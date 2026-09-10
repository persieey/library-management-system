import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BackOfficeLayout from "../../components/BackOfficeLayout";
import Avatar from "../../components/Avatar";
import Pagination, { PAGE_SIZE } from "../../components/Pagination";
import type { Equipment as EquipmentItem } from "../../types";
import "./Equipment.css";

const STATUS_LABEL: Record<string, string> = {
  available: "พร้อมใช้งาน",
  maintenance: "ซ่อมบำรุง",
};

export default function Equipment() {
  const { isEmployee, authFetch, loading: authLoading } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const loadEquipment = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/equipment");
      if (!res.ok) throw new Error("Failed to load equipment");
      const data = await res.json();
      setEquipment(data.equipment || []);
    } catch {
      setError("โหลดข้อมูลอุปกรณ์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEmployee) return; // guard below handles the redirect
    loadEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  const handleCreated = (item: EquipmentItem) => {
    setEquipment((prev) => [...prev, item]);
    setShowAdd(false);
  };

  const counts = useMemo(() => {
    const available = equipment.filter((e) => e.status === "available").length;
    const maintenance = equipment.filter((e) => e.status === "maintenance").length;
    return { available, maintenance, total: equipment.length };
  }, [equipment]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter(
      (e) =>
        String(e.equipment_id).toLowerCase().includes(q) ||
        (e.name || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.location || "").toLowerCase().includes(q)
    );
  }, [equipment, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => {
    setPage(1);
  }, [search]);

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

  const share = (n: number) =>
    counts.total > 0 ? `${Math.round((n / counts.total) * 100)}% ของทั้งหมด` : "ยังไม่มีรายการ";
  const stats = [
    { key: "available", title: "อุปกรณ์พร้อมใช้งาน", value: counts.available, note: share(counts.available), accent: true },
    { key: "maintenance", title: "อยู่ระหว่างซ่อมบำรุง", value: counts.maintenance, note: share(counts.maintenance) },
    { key: "total", title: "อุปกรณ์ทั้งหมด", value: counts.total, note: "รายการที่ติดตาม" },
  ];

  return (
    <BackOfficeLayout title="อุปกรณ์ครุภัณฑ์">
          <div className="eq-page">
            <h2 className="eq-title">แดชบอร์ดสรุปอุปกรณ์ครุภัณฑ์</h2>

            <div className="staff-stats cols-3">
              {stats.map((s) => (
                <div key={s.key} className={`staff-stat ${s.accent ? "staff-stat--accent" : ""}`}>
                  <div className="staff-stat-title">{s.title}</div>
                  <div className="staff-stat-value">{s.value}</div>
                  <div className="staff-stat-note">{s.note}</div>
                </div>
              ))}
            </div>

            <div className="eq-toolbar">
              <input
                type="text"
                className="staff-search eq-search"
                placeholder="ค้นหาจาก ID ชื่อ หมวดหมู่ หรือตำแหน่ง..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="button" className="eq-btn-add" onClick={() => setShowAdd(true)}>
                + เพิ่มอุปกรณ์ครุภัณฑ์
              </button>
            </div>

            {error && <p className="eq-error">{error}</p>}

            <div className="eq-table-wrap">
              <table className="eq-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ชื่อ</th>
                    <th>หมวดหมู่</th>
                    <th>ตำแหน่ง</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="eq-empty">กำลังโหลด...</td>
                    </tr>
                  ) : (
                    <>
                      {pageRows.map((e) => (
                        <tr key={e.equipment_id}>
                          <td>{e.equipment_id}</td>
                          <td>
                            <span className="staff-cell-user">
                              <Avatar name={e.name} size={30} />
                              {e.name}
                            </span>
                          </td>
                          <td>{e.category}</td>
                          <td>{e.location}</td>
                          <td>
                            <span className={`staff-badge staff-badge-${e.status}`}>
                              {STATUS_LABEL[e.status] || e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} className="eq-empty">ไม่พบอุปกรณ์ที่ตรงกับคำค้นหา</td>
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
                  {filtered.length} รายการ
                </span>
                <Pagination page={page} pageCount={pageCount} onPage={setPage} />
              </div>
            )}
          </div>

      {showAdd && (
        <AddEquipmentModal
          authFetch={authFetch}
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </BackOfficeLayout>
  );
}

function AddEquipmentModal({
  authFetch,
  onClose,
  onCreated,
}: {
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onCreated: (item: EquipmentItem) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("กรุณากรอกชื่ออุปกรณ์");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await authFetch("/api/v1/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category: category.trim(), location: location.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เพิ่มอุปกรณ์ไม่สำเร็จ");
      onCreated(data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "เพิ่มอุปกรณ์ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-modal-overlay" onClick={onClose}>
      <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-head">
          <div>
            <h3 className="staff-modal-title">เพิ่มอุปกรณ์ครุภัณฑ์</h3>
            <div className="staff-modal-sub">กรอกข้อมูลอุปกรณ์ชิ้นใหม่ที่จะเพิ่มเข้าระบบ</div>
          </div>
          <button type="button" className="staff-modal-close" onClick={onClose} aria-label="ปิด">
            ×
          </button>
        </div>

        <form className="staff-modal-body" onSubmit={handleSubmit}>
          <label className="eq-form-field">
            <span>ชื่ออุปกรณ์ *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น โปรเจคเตอร์ Epson EB-X06"
              autoFocus
            />
          </label>
          <label className="eq-form-field">
            <span>หมวดหมู่</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="เช่น อุปกรณ์ IT"
            />
          </label>
          <label className="eq-form-field">
            <span>ตำแหน่งที่เก็บ</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น ชั้น 2 ห้องควบคุม"
            />
          </label>

          {formError && <p className="eq-error eq-form-error">{formError}</p>}

          <div className="eq-form-actions">
            <button type="button" className="eq-btn-cancel" onClick={onClose} disabled={submitting}>
              ยกเลิก
            </button>
            <button type="submit" className="eq-btn-add" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
