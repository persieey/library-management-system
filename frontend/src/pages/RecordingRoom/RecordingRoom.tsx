import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BackOfficeLayout from "../../components/BackOfficeLayout";
import Avatar from "../../components/Avatar";
import Pagination, { PAGE_SIZE } from "../../components/Pagination";
import type { Room, RoomBooking } from "../../types";
import "./RecordingRoom.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "In Use",
  completed: "Returned",
  cancelled: "Cancelled",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: "staff-badge-pending",
  confirmed: "staff-badge-confirmed",
  completed: "staff-badge-completed",
  cancelled: "staff-badge-cancelled",
};

// ตารางแสดงชั่วโมงเปิด-ปิดห้อง ตรงกับ OPEN_HOUR/CLOSE_HOUR ของหน้าจองห้อง (RoomBookingUI)
const SCHEDULE_OPEN_HOUR = 8;
const SCHEDULE_CLOSE_HOUR = 20;
const SCHEDULE_HOURS = Array.from(
  { length: SCHEDULE_CLOSE_HOUR - SCHEDULE_OPEN_HOUR },
  (_, i) => SCHEDULE_OPEN_HOUR + i
);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function dayLabel(startISO: string) {
  const d = new Date(startISO);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isSameLocalDateAsYMD(iso: string, ymd: string) {
  const d = new Date(iso);
  const localYMD = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return localYMD === ymd;
}

// "เวลาสิ้นสุดจริง" — ถ้าคืนห้องแล้วก่อนเวลา ใช้เวลาที่คืนจริงแทน end_datetime เดิม
// เพื่อให้ตารางเวลาแสดงว่าห้องว่างแล้วตั้งแต่ตอนที่คืนจริง ไม่ใช่ตามเวลาจองเดิม
function effectiveEnd(b: RoomBooking): Date {
  if (b.status === "completed" && b.returned_at) return new Date(b.returned_at);
  return new Date(b.end_datetime);
}

// เกินเวลาแล้วแต่ยังไม่ได้คืนห้อง (รับห้องไปแล้ว/confirmed แต่ end_datetime ผ่านไปแล้ว)
function isOverdue(b: RoomBooking) {
  return b.status === "confirmed" && new Date(b.end_datetime).getTime() < Date.now();
}

export default function RecordingRoom() {
  const { isEmployee, authFetch, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scheduleDate, setScheduleDate] = useState(todayYMD());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/room-bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");
      // แสดงทุกสถานะรวมถึงที่ถูกยกเลิก (กดยกเลิกเอง หรือเกินเวลาแล้วระบบยกเลิกให้)
      // จะได้เห็นในรายการว่าเป็นสถานะ "Cancelled" ไม่ใช่หายไปเฉย ๆ
      setBookings(data.room_bookings || []);
    } catch {
      setError("Could not load bookings. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await authFetch("/api/v1/rooms");
      const data = await res.json();
      if (res.ok) setRooms(data.rooms || []);
    } catch {
      // ตารางเวลาแค่ไม่โชว์แถวห้อง รายการจองด้านล่างยังใช้งานได้ปกติ ไม่ต้องกวนด้วย error
    }
  };

  useEffect(() => {
    if (!isEmployee) return;
    loadBookings();
    loadRooms();
    // ตามการจอง/ยกเลิกที่ผู้ใช้ทำจากหน้าจองห้อง — เช็กซ้ำเงียบ ๆ ทุก 8 วิ
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") loadBookings(true);
    }, 8000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  // pending -> confirmed ("รับห้อง" hands over the key)
  // confirmed -> completed ("คืนห้อง" takes the key back)
  const advanceStatus = async (bookingId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "confirmed" : "completed";

    // optimistic update so the button feels instant
    setBookings((prev) =>
      prev.map((b) =>
        b.room_booking_id === bookingId ? { ...b, status: nextStatus } : b
      )
    );

    try {
      const res = await authFetch(`/api/v1/room-bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
    } catch {
      setError("Could not update status. Please try again.");
      loadBookings(); // roll back to server truth on failure
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const roomName = b.room?.room_name || "";
      const userName = b.user?.name || "";
      const matchesSearch =
        !q ||
        roomName.toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q) ||
        String(b.room_booking_id).includes(q);
      const matchesDate = dateFilter === "All" || dayLabel(b.start_datetime) === dateFilter;
      const matchesStatus =
        statusFilter === "All" || STATUS_LABEL[b.status] === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [bookings, search, dateFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => {
    setPage(1);
  }, [search, dateFilter, statusFilter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ตารางเวลาการใช้ห้องของวันที่เลือก — แถว = ห้อง, คอลัมน์ = ชั่วโมง (08:00-20:00)
  // อ่านจาก bookings ที่โหลดมาแล้ว (staff เห็นทุกสถานะ+ชื่อผู้จองอยู่แล้ว) ไม่ต้องยิง API เพิ่ม
  const scheduleRows = useMemo(() => {
    return rooms.map((room) => {
      const dayBookings = bookings.filter(
        (b) =>
          b.room_id === room.room_id &&
          b.status !== "cancelled" &&
          isSameLocalDateAsYMD(b.start_datetime, scheduleDate)
      );
      const cells = SCHEDULE_HOURS.map((hour) => {
        const [y, m, d] = scheduleDate.split("-").map(Number);
        const cellStart = new Date(y, m - 1, d, hour, 0, 0, 0);
        const cellEnd = new Date(y, m - 1, d, hour + 1, 0, 0, 0);
        const booking = dayBookings.find(
          (b) => new Date(b.start_datetime) < cellEnd && effectiveEnd(b) > cellStart
        );
        return { hour, booking };
      });
      return { room, cells };
    });
  }, [rooms, bookings, scheduleDate]);

  // Guards go AFTER every hook — React requires the same hooks to run on
  // every render, so an early return can never sit above a hook.
  if (authLoading) {
    return null; // still confirming the session — don't redirect yet
  }
  // Guard: only employees may view this page. Anyone else gets sent home.
  if (!isEmployee) {
    return <Navigate to="/" replace />;
  }

  return (
    <BackOfficeLayout title="Room reservation">
          <div className="rr-page">
            <h2 className="rr-title">Room &amp; Key Management (การจัดการให้ห้อง/คืนห้อง)</h2>

            <div className="rr-schedule-wrap">
              <div className="rr-schedule-head">
                <h3 className="rr-schedule-title">ตารางการใช้ห้องรายวัน</h3>
                <input
                  type="date"
                  className="rr-schedule-date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>

              {rooms.length === 0 ? (
                <p className="rr-schedule-empty">
                  {loading ? "กำลังโหลดตาราง..." : "ยังไม่มีห้องในระบบ"}
                </p>
              ) : (
                <div className="rr-schedule-scroll">
                  <div
                    className="rr-schedule-grid"
                    style={{ gridTemplateColumns: `140px repeat(${SCHEDULE_HOURS.length}, minmax(56px, 1fr))` }}
                  >
                    <div className="rr-schedule-corner" />
                    {SCHEDULE_HOURS.map((h) => (
                      <div key={h} className="rr-schedule-hour">
                        {pad(h)}:00
                      </div>
                    ))}

                    {scheduleRows.map(({ room, cells }) => (
                      <div className="rr-schedule-row" key={room.room_id}>
                        <div className="rr-schedule-room">{room.room_name}</div>
                        {cells.map(({ hour, booking }) => {
                          if (!booking) {
                            return <div key={hour} className="rr-schedule-cell rr-schedule-cell--free" title="ว่าง" />;
                          }
                          const overdue = isOverdue(booking);
                          const stateClass = overdue
                            ? "rr-schedule-cell--overdue"
                            : `rr-schedule-cell--${booking.status}`;
                          const tooltip = `${booking.user?.name || "ไม่ทราบชื่อ"} · ${formatTimeRange(
                            booking.start_datetime,
                            booking.end_datetime
                          )} · ${overdue ? "เกินเวลา" : STATUS_LABEL[booking.status] || booking.status}`;
                          return (
                            <div
                              key={hour}
                              className={`rr-schedule-cell ${stateClass}`}
                              title={tooltip}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rr-schedule-legend">
                <span className="rr-legend-item"><i className="rr-schedule-cell--free" /> ว่าง</span>
                <span className="rr-legend-item"><i className="rr-schedule-cell--pending" /> รอรับห้อง</span>
                <span className="rr-legend-item"><i className="rr-schedule-cell--confirmed" /> กำลังใช้งาน</span>
                <span className="rr-legend-item"><i className="rr-schedule-cell--overdue" /> เกินเวลา</span>
                <span className="rr-legend-item"><i className="rr-schedule-cell--completed" /> คืนแล้ว</span>
              </div>
            </div>

            <div className="rr-toolbar">
              <input
                type="text"
                className="staff-search rr-search"
                placeholder="Search by room, booker, id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="rr-filters">
                <label className="rr-filter">
                  <span>Date</span>
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="All">All</option>
                  </select>
                </label>
                <label className="rr-filter">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="In Use">In Use</option>
                    <option value="Returned">Returned</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
            </div>

            {error && <p className="rr-error">{error}</p>}

            <div className="rr-table-wrap">
              <table className="rr-table">
                <thead>
                  <tr>
                    <th>เลขห้อง</th>
                    <th>เลขการจอง</th>
                    <th>ผู้จอง</th>
                    <th>ช่วงเวลา</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="rr-empty">Loading...</td>
                    </tr>
                  ) : (
                    <>
                      {pageRows.map((b) => (
                        <tr key={b.room_booking_id}>
                          <td>{b.room?.room_name}</td>
                          <td>BK-{b.room_booking_id}</td>
                          <td>
                            <span className="staff-cell-user">
                              <Avatar name={b.user?.name} size={30} />
                              {b.user?.name}
                            </span>
                          </td>
                          <td>{formatTimeRange(b.start_datetime, b.end_datetime)}</td>
                          <td>
                            {isOverdue(b) ? (
                              <span className="staff-badge staff-badge-overdue">เกินเวลา</span>
                            ) : (
                              <span className={`staff-badge ${STATUS_BADGE_CLASS[b.status] || ""}`}>
                                {STATUS_LABEL[b.status] || b.status}
                              </span>
                            )}
                          </td>
                          <td>
                            {b.status === "pending" && (
                              <button
                                type="button"
                                className="rr-btn rr-btn-take"
                                onClick={() => advanceStatus(b.room_booking_id, b.status)}
                              >
                                รับห้อง
                              </button>
                            )}
                            {b.status === "confirmed" && (
                              <button
                                type="button"
                                className={`rr-btn rr-btn-return${isOverdue(b) ? " rr-btn-return--overdue" : ""}`}
                                onClick={() => advanceStatus(b.room_booking_id, b.status)}
                              >
                                คืนห้อง{isOverdue(b) ? " (เกินเวลา)" : ""}
                              </button>
                            )}
                            {b.status === "completed" && (
                              <button type="button" className="rr-btn rr-btn-done" disabled>
                                ✓ เรียบร้อยแล้ว
                              </button>
                            )}
                            {b.status === "cancelled" && (
                              <span className="rr-action-none">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="rr-empty">No bookings match your filters.</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="staff-table-foot">
                <span className="staff-table-count">
                  {filtered.length} booking{filtered.length === 1 ? "" : "s"}
                </span>
                <Pagination page={page} pageCount={pageCount} onPage={setPage} />
              </div>
            )}
          </div>
    </BackOfficeLayout>
  );
}
