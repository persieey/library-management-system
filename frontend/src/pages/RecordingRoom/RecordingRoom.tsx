import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BackOfficeLayout from "../../components/BackOfficeLayout";
import Avatar from "../../components/Avatar";
import Pagination, { PAGE_SIZE } from "../../components/Pagination";
import type { RoomBooking } from "../../types";
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

export default function RecordingRoom() {
  const { isEmployee, authFetch, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("All");
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

  useEffect(() => {
    if (!isEmployee) return;
    loadBookings();
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
                            <span className={`staff-badge ${STATUS_BADGE_CLASS[b.status] || ""}`}>
                              {STATUS_LABEL[b.status] || b.status}
                            </span>
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
                                className="rr-btn rr-btn-return"
                                onClick={() => advanceStatus(b.room_booking_id, b.status)}
                              >
                                คืนห้อง
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
