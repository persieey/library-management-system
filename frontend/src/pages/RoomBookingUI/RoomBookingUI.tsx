import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import { errorMessage, type BookedSlot, type Room, type RoomBooking } from "../../types";
import "./RoomBookingUI.css";

const OPEN_HOUR = 8;
const CLOSE_HOUR = 19;
// โควตาต่อคนต่อวัน ต้องตรงกับ maxBookingHoursPerDay ฝั่ง backend
const MAX_HOURS_PER_DAY = 6;
const MAX_ADVANCE_DAYS = 3;

const HOURS = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR + 1 },
  (_, i) => OPEN_HOUR + i
);

const ROOM_TYPE_LABELS = {
  individual: "Individual study room ( 1 person )",
  group: "Group study room ( 4-8 people )",
};

interface HourSlot {
  startHour: number;
  endHour: number;
}

interface DayOption {
  offset: number;
  date: Date;
  label: string;
}

type Notice = { type: "error" | "success"; text: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatHour(h: number) {
  return `${pad(h)}.00`;
}
function dayOptions(): DayOption[] {
  const opts: DayOption[] = [];
  const today = new Date();
  for (let i = 0; i <= MAX_ADVANCE_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const label =
      i === 0
        ? `Today ${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`
        : i === 1
        ? `Tomorrow ${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`
        : `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
    opts.push({ offset: i, date: d, label });
  }
  return opts;
}
// ช่องเวลานี้ผ่านไปแล้วหรือยัง — เทียบกับนาฬิกาจริงตอนนี้
//
// ตอนบ่ายสี่ ช่องบ่ายสามถือว่าผ่านไปแล้ว จองไม่ได้
// backend เช็คซ้ำอีกชั้นที่ RoomBookingController.Create การปิดปุ่มตรงนี้
// เป็นแค่การบอกผู้ใช้ล่วงหน้า ไม่ใช่การป้องกัน
function isHourPast(day: Date, hour: number) {
  return hourToDate(day, hour).getTime() <= Date.now();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function hourToDate(day: Date, hour: number) {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function toRanges(hours: Iterable<number>): HourSlot[] {
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: HourSlot[] = [];
  for (const h of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && last.endHour === h) last.endHour = h + 1;
    else ranges.push({ startHour: h, endHour: h + 1 });
  }
  return ranges;
}

export default function RoomBookingUI() {
  const { user, authFetch } = useAuth();

  const [roomType, setRoomType] = useState("individual");
  const [dayOffset, setDayOffset] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookedByRoom, setBookedByRoom] = useState<Record<number, HourSlot[]>>({});
  const [myBookings, setMyBookings] = useState<RoomBooking[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedHours, setSelectedHours] = useState<Set<number>>(() => new Set());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const days = useMemo(dayOptions, []);
  const activeDay = days[dayOffset];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`/api/v1/rooms`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load rooms");
        if (!cancelled) {
          setRooms((data.rooms || []).filter((r: Room) => r.room_type === roomType));
        }
      } catch {
        if (!cancelled) setNotice({ type: "error", text: "Could not load rooms." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomType, authFetch]);

  useEffect(() => {
    if (rooms.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const key = dateKey(activeDay.date);

    (async () => {
      try {
        const results = await Promise.all(
          rooms.map(async (room) => {
            const res = await authFetch(
              `/api/v1/room-bookings/availability?room_id=${room.room_id}&date=${key}`
            );
            const data = await res.json();
            const slots: HourSlot[] = (data.booked_slots || []).map((s: BookedSlot) => {
              const start = new Date(s.start_datetime);
              const end = new Date(s.end_datetime);
              return { startHour: start.getHours(), endHour: end.getHours() };
            });
            return [room.room_id, slots] as [number, HourSlot[]];
          })
        );
        if (!cancelled) setBookedByRoom(Object.fromEntries(results));
      } catch {
        if (!cancelled) setNotice({ type: "error", text: "Could not load room availability." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rooms, activeDay, authFetch]);

  const loadMyBookings = useCallback(async () => {
    try {
      const res = await authFetch(`/api/v1/room-bookings/mine`);
      const data = await res.json();
      if (res.ok) setMyBookings(data.room_bookings || []);
    } catch {
      // silent — panel just keeps whatever it had
    }
  }, [authFetch]);

  useEffect(() => {
    loadMyBookings();
  }, [loadMyBookings]);

  // ตามสถานะที่เจ้าหน้าที่เปลี่ยนจากหน้า panel — เช็กรายการจองของเราซ้ำทุก 8 วิ
  // (เจ้าหน้าที่กด "คืนห้อง" แล้วรายการจะหายจากที่นี่เองและโควตาเวลากลับมา)
  // และรีเฟรชทั้งหน้าเมื่อกลับมาโฟกัสแท็บ
  useEffect(() => {
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") loadMyBookings();
    }, 8000);
    const onFocus = () => {
      loadMyBookings();
      setRooms((prev) => (prev.length ? [...prev] : prev)); // re-run availability effect
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadMyBookings]);

  // "Active" = still holding a slot toward the 6h cap: booked but not yet
  // picked up (pending), or currently checked out (confirmed). "completed"
  // (room returned) frees the hours back up, so it's excluded here.
  const activeBookings = useMemo(
    () => myBookings.filter((b) => b.status === "pending" || b.status === "confirmed"),
    [myBookings]
  );

  // "My bookings" shows anything still relevant right now: not yet picked up
  // (pending, cancellable) or currently checked out (confirmed, in use).
  // "completed" (returned) is history and doesn't belong here.
  const visibleBookings = activeBookings;

  // ชั่วโมงที่ใช้ไปแล้ว *ของวันที่กำลังดูอยู่* ไม่ใช่ยอดรวมทุกวัน
  //
  // นับการจองที่ยังไม่ถูกยกเลิกทั้งหมด รวมที่คืนห้องแล้ว เพราะใช้ห้องไปจริง
  // ในวันนั้นแล้ว ตรงกับที่ backend นับใน Create
  const usedHoursOnDay = useMemo(() => {
    const key = dateKey(activeDay.date);
    return myBookings
      .filter((b) => b.status !== "cancelled")
      .filter((b) => dateKey(new Date(b.start_datetime)) === key)
      .reduce((sum, b) => {
      const h =
        (new Date(b.end_datetime).getTime() - new Date(b.start_datetime).getTime()) /
        (1000 * 60 * 60);
      return sum + h;
    }, 0);
  }, [myBookings, activeDay]);

  const remainingHours = Math.max(0, MAX_HOURS_PER_DAY - usedHoursOnDay);
  const selectedCount = selectedHours.size;
  const remainingAfterSelection = Math.max(0, remainingHours - selectedCount);
  const dayLimitReached = remainingHours === 0;

  const isHourBooked = useCallback(
    (roomId: number, hour: number) => {
      const slots = bookedByRoom[roomId] || [];
      return slots.some((s) => hour >= s.startHour && hour < s.endHour);
    },
    [bookedByRoom]
  );

  const isHourSelected = useCallback(
    (roomId: number, hour: number) => roomId === selectedRoomId && selectedHours.has(hour),
    [selectedRoomId, selectedHours]
  );

  const toggleCell = (roomId: number, hour: number) => {
    if (isHourBooked(roomId, hour)) return;
    setNotice(null);

    if (isHourPast(activeDay.date, hour)) {
      setNotice({
        type: "error",
        text: "ช่วงเวลานี้ผ่านไปแล้ว จองย้อนหลังไม่ได้",
      });
      return;
    }

    if (dayLimitReached && !(roomId === selectedRoomId && selectedHours.has(hour))) {
      setNotice({
        type: "error",
        text: `ใช้โควตา ${MAX_HOURS_PER_DAY} ชั่วโมงของวันนี้ครบแล้ว ยกเลิกการจองด้านล่างเพื่อคืนเวลา หรือเลือกวันอื่น`,
      });
      return;
    }

    if (roomId !== selectedRoomId) {
      setSelectedRoomId(roomId);
      setSelectedHours(new Set([hour]));
      return;
    }

    setSelectedHours((prev) => {
      const next = new Set(prev);
      if (next.has(hour)) {
        next.delete(hour);
        return next;
      }
      if (next.size >= remainingHours) {
        setNotice({
          type: "error",
          text: `วันนี้เหลือโควตาอีก ${remainingHours} ชั่วโมง เลือกเพิ่มไม่ได้แล้ว`,
        });
        return prev;
      }
      next.add(hour);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!selectedRoomId || selectedHours.size === 0) {
      setNotice({ type: "error", text: "Select at least one time slot on the schedule first." });
      return;
    }
    const ranges = toRanges(selectedHours);

    try {
      for (const r of ranges) {
        const res = await authFetch(`/api/v1/room-bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: selectedRoomId,
            booking_type: roomType,
            start_datetime: hourToDate(activeDay.date, r.startHour).toISOString(),
            end_datetime: hourToDate(activeDay.date, r.endHour).toISOString(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Booking failed");
      }

      setSelectedHours(new Set());
      setSelectedRoomId(null);
      setNotice({ type: "success", text: "Booking confirmed." });
      await loadMyBookings();
      // new array ref re-runs the availability effect so the grid refreshes
      setRooms((prev) => [...prev]);
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Booking failed. Please try again.") });
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const res = await authFetch(`/api/v1/room-bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      setNotice({ type: "success", text: "Booking cancelled." });
      await loadMyBookings();
      // new array ref re-runs the availability effect so the grid refreshes
      setRooms((prev) => [...prev]);
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "Could not cancel booking.") });
    }
  };

  const summaryRoom = selectedRoomId
    ? rooms.find((r) => r.room_id === selectedRoomId)
    : null;
  const summaryRanges = selectedHours.size > 0 ? toRanges(selectedHours) : [];

  return (
    <div className="rb-page">
      <Header />

      <main className="rb-main">
        <div className="rb-selectors">
          <div className="rb-field">
            <label className="rb-label">Room</label>
            <select
              className="rb-select"
              value={roomType}
              onChange={(e) => {
                setRoomType(e.target.value);
                setSelectedRoomId(null);
                setSelectedHours(new Set());
              }}
            >
              <option value="individual">{ROOM_TYPE_LABELS.individual}</option>
              <option value="group">{ROOM_TYPE_LABELS.group}</option>
            </select>
          </div>
          <div className="rb-field">
            <label className="rb-label">Day</label>
            <select
              className="rb-select"
              value={dayOffset}
              onChange={(e) => {
                setDayOffset(Number(e.target.value));
                setSelectedRoomId(null);
                setSelectedHours(new Set());
              }}
            >
              {days.map((d) => (
                <option key={d.offset} value={d.offset}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rb-columns">
          <div className="rb-panel">
            <h2 className="rb-panel-title">Free time schedule</h2>
            {loading ? (
              <p style={{ padding: 16 }}>Loading...</p>
            ) : (
              <div className="rb-schedule-scroll">
                <div className="rb-schedule-inner">
                  <div className="rb-schedule-header">
                    <div />
                    {HOURS.map((h) => (
                      <span key={h}>{formatHour(h)}</span>
                    ))}
                  </div>
                  {rooms.map((room) => (
                    <div key={room.room_id} className="rb-schedule-row">
                      <div className="rb-room-label">
                        <span>{room.room_name}</span>
                        <span className="rb-room-divider" />
                      </div>
                      {HOURS.map((h) => {
                        const booked = isHourBooked(room.room_id, h);
                        const selected = isHourSelected(room.room_id, h);
                        const past = isHourPast(activeDay.date, h);
                        const atCap =
                          !booked &&
                          !past &&
                          !selected &&
                          (dayLimitReached ||
                            (room.room_id === selectedRoomId &&
                              selectedHours.size >= remainingHours));
                        const cls = [
                          "rb-cell",
                          booked ? "booked" : "",
                          past ? "past" : "",
                          selected ? "selected" : "",
                          atCap ? "disabled-cap" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        let cellTitle: string | undefined;
                        if (past) cellTitle = "ช่วงเวลานี้ผ่านไปแล้ว";
                        else if (atCap)
                          cellTitle = `วันนี้เหลือโควตาอีก ${remainingHours} ชั่วโมง`;

                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={booked || past}
                            onClick={() => toggleCell(room.room_id, h)}
                            className={cls}
                            title={cellTitle}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="rb-panel">
              <h2 className="rb-panel-title">Booking summary</h2>
              <p className="rb-summary-user">User : {user?.name}</p>
              <div className="rb-summary-divider">
                <div className="rb-summary-row">
                  <span className="rb-key">Room</span>
                  <span className="rb-value">{summaryRoom ? summaryRoom.room_name : "—"}</span>
                </div>
                <div className="rb-summary-row">
                  <span className="rb-key">Day</span>
                  <span className="rb-value">{activeDay.label}</span>
                </div>
                <div className="rb-summary-row">
                  <span className="rb-key">Time</span>
                  <span className="rb-value">
                    {summaryRanges.length > 0
                      ? summaryRanges
                          .map((r) => `${formatHour(r.startHour)} – ${formatHour(r.endHour)}`)
                          .join(", ")
                      : "—"}
                  </span>
                </div>
              </div>
              <p className="rb-remaining">
                เหลือ {remainingAfterSelection} ชม. จากโควตา {MAX_HOURS_PER_DAY} ชม. ของวันนี้
              </p>
            </div>

            <div className="rb-panel">
              <h2 className="rb-panel-title">My bookings</h2>
              {visibleBookings.length === 0 ? (
                <p className="rb-empty">No reservations</p>
              ) : (
                <ul className="rb-booking-list">
                  {visibleBookings.map((b) => (
                    <li key={b.room_booking_id}>
                      <span>
                        {b.room?.room_name} ·{" "}
                        {new Date(b.start_datetime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        , {new Date(b.start_datetime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        –
                        {new Date(b.end_datetime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {b.status === "pending" ? (
                        <button
                          type="button"
                          className="rb-cancel-btn"
                          onClick={() => handleCancelBooking(b.room_booking_id)}
                          aria-label={`Cancel booking for ${b.room?.room_name}`}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="rb-status-badge">กำลังใช้งาน</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {notice && <p className={`rb-notice ${notice.type}`}>{notice.text}</p>}

        <div className="rb-confirm-wrap">
          <button type="button" onClick={handleConfirm} className="rb-confirm-btn">
            Confirm booking
          </button>
        </div>
      </main>
    </div>
  );
}
