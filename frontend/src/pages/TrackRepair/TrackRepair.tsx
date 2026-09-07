import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BackOfficeLayout from "../../components/BackOfficeLayout";
import Avatar from "../../components/Avatar";
import Pagination, { PAGE_SIZE } from "../../components/Pagination";
import { assetUrl, type RepairRequest } from "../../types";
import "./TrackRepair.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: "staff-badge-pending",
  in_progress: "staff-badge-inprogress",
  completed: "staff-badge-completed",
  cancelled: "staff-badge-cancelled",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function TrackRepairUI() {
  const { isEmployee, loading: authLoading, authFetch } = useAuth();

  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<RepairRequest | null>(null);

  const loadRepairs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/repairs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load repairs");
      setRepairs(data.repair_requests || []);
    } catch {
      setError("Could not load repair requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEmployee) return;
    loadRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  const advanceStatus = async (requestId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "in_progress" : "completed";
    setUpdatingId(requestId);

    setRepairs((prev) =>
      prev.map((r) => (r.request_id === requestId ? { ...r, status: nextStatus } : r))
    );

    try {
      const res = await authFetch(`/api/v1/repairs/${requestId}/status`, {
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
      loadRepairs(); // roll back to server truth
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => {
    const pending = repairs.filter((r) => r.status === "pending").length;
    const inProgress = repairs.filter((r) => r.status === "in_progress").length;
    const completed = repairs.filter((r) => r.status === "completed").length;
    return { pending, inProgress, completed, total: repairs.length };
  }, [repairs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return repairs;
    return repairs.filter(
      (r) =>
        String(r.request_id).includes(q) ||
        (r.equipment?.name || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.user?.name || "").toLowerCase().includes(q)
    );
  }, [repairs, search]);

  // keep the current page valid as the result set shrinks/grows
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Guards go AFTER every hook.
  if (authLoading) {
    return null;
  }
  if (!isEmployee) {
    return <Navigate to="/" replace />;
  }

  const share = (n: number) =>
    counts.total > 0 ? `${Math.round((n / counts.total) * 100)}% of all jobs` : "No jobs yet";
  const stats = [
    { key: "pending", title: "Pending Approval", value: counts.pending, note: share(counts.pending), accent: true },
    { key: "progress", title: "In Progress", value: counts.inProgress, note: share(counts.inProgress) },
    { key: "completed", title: "Completed", value: counts.completed, note: share(counts.completed) },
    { key: "total", title: "Total Requests", value: counts.total, note: "All time" },
  ];

  return (
    <BackOfficeLayout title="Repair Tracking">
          <div className="tr-page">
            <h2 className="tr-title">Repair Summary Dashboard</h2>

            <div className="staff-stats">
              {stats.map((s) => (
                <div key={s.key} className={`staff-stat ${s.accent ? "staff-stat--accent" : ""}`}>
                  <div className="staff-stat-title">{s.title}</div>
                  <div className="staff-stat-value">{s.value}</div>
                  <div className="staff-stat-note">{s.note}</div>
                </div>
              ))}
            </div>

            <input
              type="text"
              className="staff-search tr-search"
              placeholder="Search by job, equipment, requester…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {error && <p className="tr-error">{error}</p>}

            <div className="tr-table-wrap">
              <table className="tr-table">
                <thead>
                  <tr>
                    <th aria-label="View" />
                    <th>Job number</th>
                    <th>Equipment</th>
                    <th>Requested by</th>
                    <th>Details</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="tr-empty">Loading...</td>
                    </tr>
                  ) : (
                    <>
                      {pageRows.map((r) => (
                        <tr key={r.request_id}>
                          <td>
                            <button
                              type="button"
                              className="staff-icon-action"
                              onClick={() => setDetail(r)}
                              aria-label={`View details for REP-${r.request_id}`}
                              title="View details"
                            >
                              <EyeIcon />
                            </button>
                          </td>
                          <td>REP-{r.request_id}</td>
                          <td>
                            <span className="staff-cell-user">
                              <Avatar name={r.equipment?.name} size={30} />
                              {r.equipment?.name}
                            </span>
                          </td>
                          <td>{r.user?.name}</td>
                          <td className="tr-details-cell">{r.description}</td>
                          <td>{formatDate(r.created_at)}</td>
                          <td>
                            <span className={`staff-badge ${STATUS_BADGE_CLASS[r.status] || ""}`}>
                              {STATUS_LABEL[r.status] || r.status}
                            </span>
                          </td>
                          <td>
                            {r.status === "pending" && (
                              <button
                                type="button"
                                className="tr-action-btn tr-action-start"
                                disabled={updatingId === r.request_id}
                                onClick={() => advanceStatus(r.request_id, r.status)}
                              >
                                Start
                              </button>
                            )}
                            {r.status === "in_progress" && (
                              <button
                                type="button"
                                className="tr-action-btn tr-action-complete"
                                disabled={updatingId === r.request_id}
                                onClick={() => advanceStatus(r.request_id, r.status)}
                              >
                                Complete
                              </button>
                            )}
                            {(r.status === "completed" || r.status === "cancelled") && (
                              <span className="tr-action-none">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="tr-empty">No repair jobs match your search.</td>
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
                  {filtered.length} request{filtered.length === 1 ? "" : "s"}
                </span>
                <Pagination page={page} pageCount={pageCount} onPage={setPage} />
              </div>
            )}
          </div>

      {detail && (
        <RepairDetailModal repair={detail} onClose={() => setDetail(null)} />
      )}
    </BackOfficeLayout>
  );
}

function RepairDetailModal({
  repair,
  onClose,
}: {
  repair: RepairRequest;
  onClose: () => void;
}) {
  const photo = assetUrl(repair.photo_url);
  return (
    <div className="staff-modal-overlay" onClick={onClose}>
      <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-head">
          <div>
            <h3 className="staff-modal-title">REP-{repair.request_id}</h3>
            <div className="staff-modal-sub">
              {STATUS_LABEL[repair.status] || repair.status}
            </div>
          </div>
          <button type="button" className="staff-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="staff-modal-body">
          <div className="staff-modal-row">
            <span className="staff-modal-key">Equipment</span>
            <span className="staff-modal-value">{repair.equipment?.name || "—"}</span>
          </div>
          {repair.equipment?.category && (
            <div className="staff-modal-row">
              <span className="staff-modal-key">Category</span>
              <span className="staff-modal-value">{repair.equipment.category}</span>
            </div>
          )}
          {repair.equipment?.location && (
            <div className="staff-modal-row">
              <span className="staff-modal-key">Location</span>
              <span className="staff-modal-value">{repair.equipment.location}</span>
            </div>
          )}
          <div className="staff-modal-row">
            <span className="staff-modal-key">Requested by</span>
            <span className="staff-modal-value">{repair.user?.name || "—"}</span>
          </div>
          <div className="staff-modal-row">
            <span className="staff-modal-key">Urgency</span>
            <span className="staff-modal-value">{repair.urgency || "—"}</span>
          </div>
          <div className="staff-modal-row">
            <span className="staff-modal-key">Reported</span>
            <span className="staff-modal-value">{formatDate(repair.created_at)}</span>
          </div>
          <div className="staff-modal-row">
            <span className="staff-modal-key">Problem</span>
            <span className="staff-modal-value">{repair.description || "—"}</span>
          </div>

          {photo ? (
            <div className="staff-modal-photo">
              <a href={photo} target="_blank" rel="noreferrer">
                <img src={photo} alt={`Attachment for REP-${repair.request_id}`} />
              </a>
            </div>
          ) : (
            <div className="staff-modal-photo-empty">No photo attached</div>
          )}
        </div>
      </div>
    </div>
  );
}
