import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BackOfficeLayout from "../../components/BackOfficeLayout";
import { errorMessage, type Equipment, type RepairRequest } from "../../types";
import "./RepairRequestUI.css";

// คำแจ้งซ่อมที่ยังไม่เสร็จ = ยังกันไม่ให้แจ้งซ่อมชิ้นเดิมซ้ำ
const OPEN_REPAIR_STATUSES = ["pending", "in_progress"];

const todayFormatted = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const INITIAL_FORM = {
  equipmentId: "",
  urgency: "High",
  problemDetails: "",
};

// ค่าที่เก็บ/ส่งให้ backend ยังเป็นภาษาอังกฤษเหมือนเดิม (Low/Medium/High/Critical)
// อันนี้ไว้แปลแค่ตัวที่โชว์บนจอเท่านั้น
const URGENCY_LABEL: Record<string, string> = {
  Low: "ต่ำ",
  Medium: "ปานกลาง",
  High: "สูง",
  Critical: "วิกฤต",
};

const EQUIPMENT_STATUS_LABEL: Record<string, string> = {
  available: "พร้อมใช้งาน",
  maintenance: "ซ่อมบำรุง",
};

type Notice = { type: "error" | "success"; text: string };

export default function RepairRequestUI() {
  const { user, isEmployee, loading, authFetch } = useAuth();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [openEquipIds, setOpenEquipIds] = useState<Set<number>>(() => new Set());
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // โหลดอุปกรณ์ทั้งหมด + คำแจ้งซ่อมที่ยังไม่เสร็จ เพื่อรู้ว่าชิ้นไหนกำลังซ่อมอยู่
  const loadEquipment = useCallback(async () => {
    setEquipmentLoading(true);
    try {
      const [eqRes, repRes] = await Promise.all([
        authFetch("/api/v1/equipment"),
        authFetch("/api/v1/repairs"),
      ]);
      const eqData = await eqRes.json();
      if (!eqRes.ok) throw new Error(eqData.error || "Failed to load equipment");

      const repData = repRes.ok ? await repRes.json() : { repair_requests: [] };
      const openIds = new Set<number>(
        (repData.repair_requests || [])
          .filter((r: RepairRequest) => OPEN_REPAIR_STATUSES.includes(r.status))
          .map((r: RepairRequest) => r.equipment_id)
          .filter((id: number | undefined): id is number => typeof id === "number" && id > 0)
      );

      setEquipmentList(eqData.equipment || []);
      setOpenEquipIds(openIds);
    } catch {
      setNotice({ type: "error", text: "โหลดรายการอุปกรณ์ไม่สำเร็จ" });
    } finally {
      setEquipmentLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isEmployee) return;
    loadEquipment();
  }, [isEmployee, loadEquipment]);

  // อุปกรณ์ที่เลือกได้ = ไม่มีคำแจ้งซ่อมค้างอยู่ (เอาออกจากรายการไปเลย) เรียงตามชื่อ
  const availableEquipment = useMemo(
    () =>
      equipmentList
        .filter((eq) => !openEquipIds.has(eq.equipment_id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [equipmentList, openEquipIds]
  );

  // Guards go AFTER every hook.
  if (loading) {
    return null;
  }
  // Guard: only employees may view this page. Anyone else gets sent home.
  if (!isEmployee) {
    return <Navigate to="/" replace />;
  }

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "กรุณาเลือกไฟล์รูปภาพเท่านั้น" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", text: "ไฟล์รูปต้องไม่เกิน 5 MB" });
      return;
    }
    setNotice(null);
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearPhoto = () => {
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    clearPhoto();
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.equipmentId) {
      setNotice({ type: "error", text: "กรุณาเลือกอุปกรณ์ที่ต้องการแจ้งซ่อม" });
      return;
    }
    if (!form.problemDetails.trim()) {
      setNotice({ type: "error", text: "กรุณากรอกรายละเอียดปัญหา" });
      return;
    }
    if (openEquipIds.has(Number(form.equipmentId))) {
      setNotice({
        type: "error",
        text: "อุปกรณ์นี้มีคำแจ้งซ่อมที่ยังไม่เสร็จอยู่แล้ว แจ้งซ่อมซ้ำไม่ได้จนกว่าจะซ่อมเสร็จ",
      });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      // multipart so the optional supporting photo rides along with the
      // text fields — the browser sets the multipart boundary itself, so
      // don't set Content-Type here.
      const fd = new FormData();
      fd.append("equipment_id", String(Number(form.equipmentId)));
      fd.append("description", form.problemDetails);
      fd.append("urgency", form.urgency);
      if (photoFile) fd.append("photo", photoFile);

      const res = await authFetch("/api/v1/repairs", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ส่งคำแจ้งซ่อมไม่สำเร็จ");

      // ชิ้นที่เพิ่งแจ้ง กันไม่ให้เลือกซ้ำทันที
      setOpenEquipIds((prev) => new Set(prev).add(Number(form.equipmentId)));
      setNotice({ type: "success", text: `ส่งคำแจ้งซ่อมเรียบร้อยแล้ว (คำขอ #${data.request_id})` });
      handleCancel();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err, "ส่งคำแจ้งซ่อมไม่สำเร็จ") });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEquipment = equipmentList.find(
    (eq) => String(eq.equipment_id) === String(form.equipmentId)
  );

  return (
    <BackOfficeLayout title="แบบฟอร์มแจ้งซ่อม">
          <div className="rf-page">
            <h2 className="rf-title">แบบฟอร์มแจ้งซ่อม</h2>

            <form className="rf-card" onSubmit={handleSubmit}>
              <div className="rf-form-grid">
                {/* Left column */}
                <div className="rf-column">
                  <div className="rf-section">
                    <h3 className="rf-section-title">1. ข้อมูลผู้แจ้ง</h3>

                    <div className="rf-field">
                      <label className="rf-label">ชื่อผู้แจ้ง</label>
                      <input type="text" className="rf-input" value={user?.name || ""} readOnly />
                    </div>

                    <div className="rf-field">
                      <label className="rf-label">วันที่แจ้ง</label>
                      <input type="text" className="rf-input" value={todayFormatted()} readOnly />
                    </div>
                  </div>

                  <div className="rf-section">
                    <h3 className="rf-section-title">2. รายละเอียดอุปกรณ์</h3>

                    <div className="rf-field">
                      <label className="rf-label">อุปกรณ์</label>
                      <EquipmentCombobox
                        items={availableEquipment}
                        value={form.equipmentId}
                        disabled={equipmentLoading}
                        onChange={(id) => updateField("equipmentId", id)}
                      />
                      <p className="rf-help">
                        พิมพ์เพื่อค้นหา · อุปกรณ์ที่มีคำแจ้งซ่อมค้างอยู่จะไม่แสดงจนกว่าจะซ่อมเสร็จ
                      </p>
                    </div>

                    <div className="rf-field">
                      <label className="rf-label">หมวดหมู่</label>
                      <input
                        type="text"
                        className="rf-input"
                        value={selectedEquipment?.category || ""}
                        readOnly
                      />
                    </div>

                    <div className="rf-field">
                      <label className="rf-label">สถานะปัจจุบัน</label>
                      <input
                        type="text"
                        className="rf-input"
                        value={
                          selectedEquipment?.status
                            ? EQUIPMENT_STATUS_LABEL[selectedEquipment.status] || selectedEquipment.status
                            : ""
                        }
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="rf-column">
                  <div className="rf-section">
                    <h3 className="rf-section-title">3. รายละเอียดปัญหา</h3>

                    <div className="rf-field">
                      <label className="rf-label">ระดับความเร่งด่วน</label>
                      <div className="rf-radio-group">
                        {["Low", "Medium", "High", "Critical"].map((level) => (
                          <label className="rf-radio" key={level}>
                            <input
                              type="radio"
                              name="urgency"
                              value={level}
                              checked={form.urgency === level}
                              onChange={(e) => updateField("urgency", e.target.value)}
                            />
                            {URGENCY_LABEL[level]}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rf-field">
                      <label className="rf-label">รายละเอียดปัญหา</label>
                      <textarea
                        className="rf-input rf-textarea"
                        placeholder="อธิบายปัญหาและสิ่งที่ต้องซ่อมอย่างละเอียด รวมถึงรหัสข้อผิดพลาดหรือความผิดปกติที่พบ (ถ้ามี)"
                        value={form.problemDetails}
                        onChange={(e) => updateField("problemDetails", e.target.value)}
                      />
                    </div>

                    <div className="rf-field">
                      <label className="rf-label">แนบรูปประกอบ</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="rf-file-input"
                        onChange={handlePhotoChange}
                      />

                      {photoPreview ? (
                        <div className="rf-photo-card">
                          <img src={photoPreview} alt="Attachment preview" />
                          <div className="rf-photo-meta">
                            <span className="rf-photo-name">{photoFile?.name}</span>
                            <span className="rf-photo-size">
                              {photoFile ? `${Math.round(photoFile.size / 1024)} KB` : ""}
                            </span>
                          </div>
                          <div className="rf-photo-actions">
                            <button
                              type="button"
                              className="rf-photo-link"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              เปลี่ยนรูป
                            </button>
                            <button type="button" className="rf-photo-link danger" onClick={clearPhoto}>
                              ลบรูป
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rf-dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <span className="rf-dropzone-icon" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M4.5 14v3.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span className="rf-dropzone-title">คลิกเพื่ออัปโหลดรูป</span>
                          <span className="rf-dropzone-hint">PNG, JPG หรือ WEBP · ไม่เกิน 5 MB</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {notice && (
                <p
                  style={{
                    color: notice.type === "error" ? "#dc2626" : "#16a34a",
                    marginTop: 16,
                  }}
                >
                  {notice.text}
                </p>
              )}

              <div className="rf-actions">
                <button type="submit" className="rf-btn rf-btn-submit" disabled={submitting}>
                  {submitting ? "กำลังส่ง..." : "ส่งคำแจ้งซ่อม"}
                </button>
                <button type="button" className="rf-btn rf-btn-cancel" onClick={handleCancel}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
    </BackOfficeLayout>
  );
}

const equipmentLabel = (eq: Equipment) =>
  `${eq.name}${eq.location ? ` (${eq.location})` : ""}`;

// Type-to-search picker. `items` is already the selectable list (blocked
// equipment is filtered out upstream), so anything shown here can be chosen.
function EquipmentCombobox({
  items,
  value,
  disabled,
  onChange,
}: {
  items: Equipment[];
  value: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const selected = items.find((eq) => String(eq.equipment_id) === value) || null;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((eq) => equipmentLabel(eq).toLowerCase().includes(q))
    : items;

  const display = editing ? query : selected ? equipmentLabel(selected) : "";

  const pick = (eq: Equipment) => {
    onChange(String(eq.equipment_id));
    setEditing(false);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="rf-combo" ref={boxRef}>
      <input
        type="text"
        className="rf-input rf-combo-input"
        placeholder={disabled ? "กำลังโหลด..." : "ค้นหาอุปกรณ์..."}
        value={display}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        onFocus={() => {
          setEditing(true);
          setQuery("");
          setOpen(true);
        }}
        onChange={(e) => {
          setEditing(true);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setEditing(false);
            setQuery("");
          } else if (e.key === "Enter" && open && filtered.length > 0) {
            e.preventDefault();
            pick(filtered[0]);
          }
        }}
      />
      {open && !disabled && (
        <ul className="rf-combo-list" role="listbox">
          {items.length === 0 ? (
            <li className="rf-combo-empty">ไม่มีอุปกรณ์ที่แจ้งซ่อมได้ในตอนนี้</li>
          ) : filtered.length === 0 ? (
            <li className="rf-combo-empty">ไม่พบอุปกรณ์ที่ตรงกับ "{query}"</li>
          ) : (
            filtered.map((eq) => (
              <li key={eq.equipment_id}>
                <button
                  type="button"
                  className={`rf-combo-option ${
                    selected?.equipment_id === eq.equipment_id ? "active" : ""
                  }`}
                  onClick={() => pick(eq)}
                >
                  <span className="rf-combo-name">{eq.name}</span>
                  {eq.location && <span className="rf-combo-loc">{eq.location}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
