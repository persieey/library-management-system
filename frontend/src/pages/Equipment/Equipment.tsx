import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BackOfficeLayout from "../../components/BackOfficeLayout";
import Avatar from "../../components/Avatar";
import Pagination, { PAGE_SIZE } from "../../components/Pagination";
import type { Equipment as EquipmentItem } from "../../types";
import "./Equipment.css";

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  maintenance: "Maintenance",
};

export default function Equipment() {
  const { isEmployee, authFetch, loading: authLoading } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isEmployee) return; // guard below handles the redirect

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch("/api/v1/equipment");
        if (!res.ok) throw new Error("Failed to load equipment");
        const data = await res.json();
        if (!cancelled) setEquipment(data.equipment || []);
      } catch {
        if (!cancelled) setError("Could not load equipment. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isEmployee, authFetch]);

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
    counts.total > 0 ? `${Math.round((n / counts.total) * 100)}% of stock` : "No items yet";
  const stats = [
    { key: "available", title: "Available Equipment", value: counts.available, note: share(counts.available), accent: true },
    { key: "maintenance", title: "In Maintenance", value: counts.maintenance, note: share(counts.maintenance) },
    { key: "total", title: "Total Equipment", value: counts.total, note: "Items tracked" },
  ];

  return (
    <BackOfficeLayout title="Equipment">
          <div className="eq-page">
            <h2 className="eq-title">Equipment Summary Dashboard</h2>

            <div className="staff-stats cols-3">
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
              className="staff-search eq-search"
              placeholder="Search by id, name, category, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {error && <p className="eq-error">{error}</p>}

            <div className="eq-table-wrap">
              <table className="eq-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="eq-empty">Loading...</td>
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
                          <td colSpan={5} className="eq-empty">No equipment matches your search.</td>
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
                  {filtered.length} item{filtered.length === 1 ? "" : "s"}
                </span>
                <Pagination page={page} pageCount={pageCount} onPage={setPage} />
              </div>
            )}
          </div>
    </BackOfficeLayout>
  );
}
