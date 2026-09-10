import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { statisticsService } from '../../../services/statisticsService';
import { complaintService } from '../../../services/complaintService';
import { StatCard } from '../../../components/statistics/StatCard';
import { type StatsMenuItem } from '../../../components/statistics/StatsSidebar';
import { exportStatsToExcel, downloadStatsPDF } from '../../../utils/statsExporter';
import type { Complaint } from '../../../interface/complaint';
import type {
  SummaryStats,
  BookStat,
  ReturnStats,
  RoomStats,
  EbookStats,
  EquipmentStats,
} from '../../../interface/statistics';
import './Statistics.css';
import BackOfficeLayout from '../../../components/BackOfficeLayout';

// เมนูย่อยเดิมอยู่เป็นแผงแยกในตัวหน้า (StatsSidebar) ย้ายมาไว้เป็นกลุ่มย่อยในแถบเมนูรวมแทน
// ใช้ /:tab จริงแบบเดียวกับ books/pr จึงต้องมี slug คู่กับชื่อหมวดเดิม (StatsMenuItem)
const STATS_TAB_TO_MENU: Record<string, StatsMenuItem> = {
  overview: 'Overview',
  'top-books': 'Top 10 Popular Books',
  returns: 'Book Return Statistics',
  rooms: 'Study Room Usage',
  'ebook-search': 'E-Book Search Statistics',
  equipment: 'Equipment Rental Stats',
  'complaint-stats': 'Complaint Statistics',
};

export default function Statistics(): React.JSX.Element {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  // ไม่มี :tab หรือค่าไม่ตรงกับที่รู้จัก แปลว่าเข้ามาที่ /employees/statistics ตรงๆ ให้แสดงภาพรวม
  const activeMenu: StatsMenuItem = (tabParam && STATS_TAB_TO_MENU[tabParam]) || 'Overview';
  const [timeFilter, setTimeFilter] = useState<string>('This Month (Aug 2026)');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-31');

  // Dynamic statistics states
  const [summaryData, setSummaryData] = useState<SummaryStats | null>(null);
  const [booksData, setBooksData] = useState<BookStat[]>([]);
  const [returnsData, setReturnsData] = useState<ReturnStats | null>(null);
  const [roomsData, setRoomsData] = useState<RoomStats | null>(null);
  const [ebooksData, setEbooksData] = useState<EbookStats | null>(null);
  const [equipmentData, setEquipmentData] = useState<EquipmentStats | null>(null);
  const [complaintsData, setComplaintsData] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        const params = {
          period: timeFilter,
          startDate: timeFilter === 'custom' ? customStartDate : undefined,
          endDate: timeFilter === 'custom' ? customEndDate : undefined,
        };

        const [sumRes, bookRes, retRes, roomRes, ebkRes, eqRes, cmpRes] = await Promise.all([
          statisticsService.getSummary(params).catch(() => null),
          statisticsService.getBooks(params).catch(() => []),
          statisticsService.getReturns(params).catch(() => null),
          statisticsService.getRooms(params).catch(() => null),
          statisticsService.getEbooks(params).catch(() => null),
          statisticsService.getEquipment(params).catch(() => null),
          complaintService.getAll().catch(() => []),
        ]);

        setSummaryData(sumRes);
        setBooksData(Array.isArray(bookRes) ? bookRes : []);
        setReturnsData(retRes);
        setRoomsData(roomRes);
        setEbooksData(ebkRes);
        setEquipmentData(eqRes);
        setComplaintsData(Array.isArray(cmpRes) ? cmpRes : []);
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [timeFilter, customStartDate, customEndDate]);

  // สลับหมวดตอนนี้คือกดลิงก์ในเมนูซ้าย (เปลี่ยน URL) แล้ว กลับขึ้นบนสุดให้เหมือนพฤติกรรมเดิม
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeMenu]);

  // Accurate Thai date parser
  const parseThaiDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const yearBE = parseInt(parts[2], 10);
    const yearCE = yearBE > 2500 ? yearBE - 543 : yearBE;

    let month = 7; // August
    if (monthStr.includes('ส.ค')) month = 7;
    else if (monthStr.includes('ก.ค')) month = 6;
    else if (monthStr.includes('มิ.ย')) month = 5;
    else if (monthStr.includes('พ.ค')) month = 4;
    else if (monthStr.includes('ม.ค')) month = 0;
    else if (monthStr.includes('ก.พ')) month = 1;
    else if (monthStr.includes('มี.ค')) month = 2;
    else if (monthStr.includes('เม.ย')) month = 3;
    else if (monthStr.includes('ก.ย')) month = 8;
    else if (monthStr.includes('ต.ค')) month = 9;
    else if (monthStr.includes('พ.ย')) month = 10;
    else if (monthStr.includes('ธ.ค')) month = 11;

    return new Date(yearCE, month, day);
  };

  // Filter complaints by matching backend period ranges accurately
  //
  // เดิมทุกช่วงเวลาผูกกับวันที่ตายตัว (ส.ค. 2569) พอเวลาผ่านไปจริง (ตอนนี้เป็น ก.ย. 2569 แล้ว)
  // ตัวกรอง "เดือนนี้"/"สัปดาห์นี้" ยังคงไปกรองเฉพาะเดือนสิงหาคมอยู่ดี ข้อมูลเดือนปัจจุบันเลยหาย
  // เปลี่ยนให้คำนวณจากวันที่ปัจจุบันจริง (new Date()) แทนค่าตายตัว ตรงกับที่แก้ฝั่ง backend
  // (utils.ParseDateRange) ไว้แล้ว
  // ป้ายตัวเลือก "เดือนนี้/เดือนที่แล้ว" เดิมเขียนเป็น "(ส.ค. 2569)" ตายตัว ทั้งที่ตอนนี้ไม่ใช่เดือน
  // สิงหาคมแล้ว ทำให้ป้ายไม่ตรงกับเดือนที่กรองจริง คำนวณชื่อเดือนไทยจากวันที่ปัจจุบันแทน
  const now = new Date();
  const thaiMonthName = (offset: number) => {
    const names = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${names[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const filteredComplaints = complaintsData.filter((item) => {
    const d = parseThaiDate(item.submit_date || '');
    if (!d) return true;

    if (timeFilter === 'This Week') {
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return d >= from && d <= to;
    }

    if (timeFilter.includes('This Month')) {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return d >= from && d <= to;
    }

    if (timeFilter.includes('Last Month')) {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return d >= from && d <= to;
    }

    if (timeFilter.includes('Semester')) {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);
      return d >= from && d <= to;
    }

    if (timeFilter === 'custom' && customStartDate && customEndDate) {
      const from = new Date(customStartDate);
      const to = new Date(customEndDate + 'T23:59:59');
      return d >= from && d <= to;
    }

    return true;
  });

  const totalComplaints = filteredComplaints.length;
  const completedComplaints = filteredComplaints.filter(
    (c) => c.status === 'เสร็จสิ้น'
  ).length;
  const inProgressComplaints = filteredComplaints.filter(
    (c) => c.status !== 'เสร็จสิ้น' && c.status !== 'ยกเลิก'
  ).length;
  const resolutionRate =
    totalComplaints > 0
      ? ((completedComplaints / totalComplaints) * 100).toFixed(1)
      : '0.0';

  // Category distribution
  const categoryCounts: { [key: string]: number } = {};
  filteredComplaints.forEach((c) => {
    const cat = c.category || 'ทั่วไป';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryList = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Category resolution & SLA performance stats
  const categoryBenchmarkMap: Record<string, number> = {
    'อุปกรณ์โสตทัศน์': 1.0,
    'ระบบสารสนเทศ': 1.5,
    'บริการ': 1.2,
    'อาคารสถานที่': 2.5,
    'ข้อเสนอแนะ': 3.0,
  };

  const categoryStatsMap: Record<
    string,
    { total: number; resolved: number; inProgress: number }
  > = {};

  filteredComplaints.forEach((c) => {
    const cat = c.category || 'ทั่วไป';
    if (!categoryStatsMap[cat]) {
      categoryStatsMap[cat] = { total: 0, resolved: 0, inProgress: 0 };
    }
    categoryStatsMap[cat].total += 1;
    if (c.status === 'เสร็จสิ้น') {
      categoryStatsMap[cat].resolved += 1;
    } else if (c.status !== 'ยกเลิก') {
      categoryStatsMap[cat].inProgress += 1;
    }
  });

  const categoryStatsList = Object.entries(categoryStatsMap)
    .map(([cat, val]) => {
      const pct = totalComplaints > 0 ? ((val.total / totalComplaints) * 100).toFixed(1) : '0.0';
      const resRate = val.total > 0 ? ((val.resolved / val.total) * 100).toFixed(1) : '0.0';
      const avgDays = categoryBenchmarkMap[cat] ?? 1.8;
      return {
        category: cat,
        total: val.total,
        percentage: pct,
        resolved: val.resolved,
        inProgress: val.inProgress,
        resolutionRate: resRate,
        avgDays,
      };
    })
    .sort((a, b) => b.total - a.total);

  const overallResolved = categoryStatsList.reduce((acc, c) => acc + c.resolved, 0);
  const overallInProgress = categoryStatsList.reduce((acc, c) => acc + c.inProgress, 0);
  const overallAvgDays =
    categoryStatsList.length > 0 && totalComplaints > 0
      ? (
          categoryStatsList.reduce((acc, c) => acc + c.avgDays * c.total, 0) /
          totalComplaints
        ).toFixed(1)
      : '0.0';

  const currentPeriodLabel =
    timeFilter === 'custom'
      ? `${customStartDate} ถึง ${customEndDate}`
      : timeFilter;

  const handleExportExcel = async () => {
    try {
      await exportStatsToExcel({
        activeMenu,
        period: currentPeriodLabel,
        summaryData,
        booksData,
        returnsData,
        roomsData,
        ebooksData,
        equipmentData,
        complaintsData: filteredComplaints,
      });
    } catch (err) {
      console.error('Error exporting Excel:', err);
    }
  };

  const handleDownloadPDF = () => {
    downloadStatsPDF({
      activeMenu,
      period: currentPeriodLabel,
      summaryData,
      booksData,
      returnsData,
      roomsData,
      ebooksData,
      equipmentData,
      complaintsData: filteredComplaints,
    });
  };

  return (
    <BackOfficeLayout title="รายงานสถิติ">
      <div className="stats-content-wrapper">
        {/* เมนูหมวดรายงาน (ภาพรวม/หนังสือยอดนิยม/...) ย้ายไปเป็นเมนูย่อยใต้ "รายงานสถิติ" ในแถบซ้ายรวมแล้ว */}
        <main className="stats-main-container">
          
          {/* --- Header Controls (Filter & Export) --- */}
          <div className="stats-header-controls">
            <div className="time-filter-group">
              <span className="filter-label">ช่วงเวลา:</span>
              <select 
                className="custom-dropdown"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="This Week">สัปดาห์นี้</option>
                <option value="This Month (Aug 2026)">เดือนนี้ ({thaiMonthName(0)})</option>
                <option value="Last Month (Jul 2026)">เดือนที่แล้ว ({thaiMonthName(-1)})</option>
                <option value="Semester 1/2026">ภาคเรียนที่ 1/{now.getFullYear() + 543}</option>
                <option value="custom">กำหนดช่วงเองที่ต้องการ...</option>
              </select>
              {timeFilter === 'custom' && (
                <div className="date-range-inputs">
                  <input 
                    type="date" 
                    className="custom-date-input" 
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)} 
                  />
                  <span>to</span>
                  <input 
                    type="date" 
                    className="custom-date-input" 
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="export-action-group">
              <button className="btn-export-excel" onClick={handleExportExcel} title="ส่งออกไฟล์ Excel (.csv)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                ส่งออก Excel
              </button>
              <button className="btn-download-pdf" onClick={handleDownloadPDF} title="พิมพ์และบันทึกเอกสาร PDF">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                ดาวน์โหลด PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>กำลังโหลดข้อมูลสถิติ...</div>
          ) : (
            <>
              {/* =========================================
                  1. Overview
              ========================================= */}
              {activeMenu === 'Overview' && (
                <>
                  <div className="summary-cards-row">
                    <StatCard 
                      title="ผู้เข้าใช้หอสมุดทั้งหมด" 
                      value={summaryData?.total_visitors?.toLocaleString() || 0} 
                      unit="คน" 
                      bgType="gray" 
                    />
                    <StatCard 
                      title="ช่วงเวลาที่คนใช้มากที่สุด" 
                      value={summaryData?.peak_hours || '13:00-15:00'} 
                      unit="ชม." 
                      bgType="orange" 
                    />
                    <StatCard 
                      title="ค่าปรับที่เก็บได้ทั้งหมด" 
                      value={summaryData?.total_fines?.toLocaleString() || 0} 
                      unit="฿" 
                      bgType="green" 
                    />
                  </div>

                  <div className="chart-section">
                    <h3>ผู้เข้าใช้เฉลี่ยตามช่วงเวลา</h3>
                    <div className="css-bar-chart">
                      {(() => {
                        const chartData = summaryData?.peak_chart_data || [];
                        const rawMax = Math.max(...chartData.map((b) => b.visitors), 10);

                        // คำนวณค่าสูงสุดของแกน Y อัตโนมัติ (Ceiling) เช่น 20, 50, 100, 200, 500, 1000...
                        let ceiling = 100;
                        if (rawMax <= 20) ceiling = 20;
                        else if (rawMax <= 50) ceiling = 50;
                        else if (rawMax <= 100) ceiling = 100;
                        else {
                          const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
                          ceiling = Math.ceil(rawMax / (magnitude / 2)) * (magnitude / 2);
                        }

                        // สร้างจุดสเกลแกน Y 5 จุดอย่างสมส่วน (100%, 75%, 50%, 25%, 0%)
                        const yTicks = [
                          ceiling,
                          Math.round(ceiling * 0.75),
                          Math.round(ceiling * 0.50),
                          Math.round(ceiling * 0.25),
                          0,
                        ];

                        return (
                          <>
                            <div className="y-axis">
                              {yTicks.map((tick, i) => (
                                <span key={i}>{tick.toLocaleString()}</span>
                              ))}
                            </div>
                            <div className="chart-bars">
                              {chartData.map((bar, idx) => {
                                const barPct = Math.min(88, Math.max(4, Math.round((bar.visitors / ceiling) * 85)));
                                return (
                                  <div key={idx} className="bar-group" title={`${bar.range}: ${bar.visitors.toLocaleString()} ครั้ง`}>
                                    <span 
                                      className="bar-value" 
                                      style={{ bottom: `calc(${barPct}% + 8px)` }}
                                    >
                                      {bar.visitors.toLocaleString()}
                                    </span>
                                    <div className="bar" style={{ height: `${barPct}%` }}></div>
                                    <span className="bar-range-label">{bar.range}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}

              {/* =========================================
                  2. Top 10 Popular Books
              ========================================= */}
              {activeMenu === 'Top 10 Popular Books' && (
                <div className="stats-table-section" style={{ marginTop: 0 }}>
                  <h3 className="stats-section-title">หนังสือที่ถูกยืมมากที่สุด 10 อันดับ</h3>
                  <div className="stats-table-card">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>ชื่อหนังสือ</th>
                          <th>หมวดหมู่</th>
                          <th>จำนวนครั้งที่ยืม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booksData.length > 0 ? (
                          booksData.map((b, idx) => (
                            <tr key={b.book_id || idx}>
                              <td className="col-rank">{b.rank_order || idx + 1}</td>
                              <td className="col-title">{b.title}</td>
                              <td className="col-category">{b.category}</td>
                              <td className="col-count">
                                <strong>{b.borrow_count?.toLocaleString() || 0}</strong>
                                <span className="text-unit">ครั้ง</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูล</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =========================================
                  3. Book Return Statistics
              ========================================= */}
              {activeMenu === 'Book Return Statistics' && (
                <>
                  <div className="summary-cards-row">
                    <StatCard 
                      title="จำนวนยืม-คืนทั้งหมด" 
                      value={returnsData?.total_borrow_returns?.toLocaleString() || 0} 
                      unit="ชิ้น" 
                      bgType="gray" 
                    />
                    <StatCard 
                      title="อัตราคืนตรงเวลา" 
                      value={typeof returnsData?.on_time_rate === 'number' ? returnsData.on_time_rate.toFixed(1) : '0.0'} 
                      unit="%" 
                      bgType="green" 
                    />
                    <StatCard 
                      title="จำนวนวันเกินกำหนดเฉลี่ย" 
                      value={returnsData?.avg_overdue_days || 0} 
                      unit="วัน" 
                      bgType="orange" 
                      valueColor="#ea580c" 
                    />
                  </div>
                  
                  <div className="chart-section">
                    <h3>สัดส่วนการคืนหนังสือ</h3>
                    <div className="horizontal-bar-container">
                      {(returnsData?.breakdown || []).map((item, idx) => (
                        <div key={idx} className="h-bar-row">
                          <span className="h-bar-label">{item.label} ({typeof item.rate === 'number' ? item.rate.toFixed(1) : item.rate}%)</span>
                          <div className="h-bar-track">
                            <div 
                              className="h-bar-fill" 
                              style={{
                                width: `${item.rate}%`, 
                                backgroundColor: idx === 0 ? '#16a34a' : idx === 1 ? '#eab308' : '#ef4444'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* =========================================
                  4. Study Room Usage
              ========================================= */}
              {activeMenu === 'Study Room Usage' && (
                <>
                  <div className="summary-cards-row">
                    <StatCard 
                      title="จำนวนการจองห้องทั้งหมด" 
                      value={roomsData?.total_bookings?.toLocaleString() || 0} 
                      unit="ครั้ง" 
                      bgType="gray" 
                    />
                    <StatCard 
                      title="อัตราเข้าใช้จริง" 
                      value={typeof roomsData?.check_in_rate === 'number' ? roomsData.check_in_rate.toFixed(1) : '0.0'} 
                      unit="%" 
                      bgType="green" 
                    />
                    <StatCard 
                      title="ยกเลิกหรือไม่มาใช้" 
                      value={typeof roomsData?.cancellation_rate === 'number' ? roomsData.cancellation_rate.toFixed(1) : '0.0'} 
                      unit="%" 
                      bgType="orange" 
                    />
                  </div>
                  
                  <div className="stats-table-section">
                    <h3 className="stats-section-title">การใช้งานห้องค้นคว้า</h3>
                    <div className="stats-table-card">
                      <table className="stats-table">
                        <thead>
                          <tr>
                            <th>ห้อง</th>
                            <th>ประเภท / ความจุ</th>
                            <th>จำนวนการจอง</th>
                            <th>ชั่วโมงรวม</th>
                            <th>อัตราเข้าใช้จริง</th>
                            <th>อัตราการยกเลิก</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomsData?.rooms && roomsData.rooms.length > 0 ? (
                            roomsData.rooms.map((r, idx) => (
                              <tr key={idx}>
                                <td><strong>{r.room_number}</strong></td>
                                <td>{r.room_type}</td>
                                <td><strong>{r.total_bookings}</strong> <span className="text-unit">ครั้ง</span></td>
                                <td>{r.total_hours} hrs</td>
                                <td><span className="trend-up">{r.check_in_rate}%</span></td>
                                <td><span className="trend-down">{r.cancellation_rate}%</span></td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูล</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* =========================================
                  5. E-Book Search Statistics
              ========================================= */}
              {activeMenu === 'E-Book Search Statistics' && (
                <>
                  <div className="summary-cards-row">
                    <StatCard 
                      title="จำนวนการค้นหาทั้งหมด" 
                      value={ebooksData?.total_searches?.toLocaleString() || 0} 
                      unit="ครั้ง" 
                      bgType="gray" 
                    />
                    <StatCard 
                      title="จำนวนการเข้าอ่าน" 
                      value={ebooksData?.total_downloads?.toLocaleString() || 0} 
                      unit="ครั้ง" 
                      bgType="green" 
                    />
                    <StatCard 
                      title="ค้นแล้วไม่เจอผลลัพธ์" 
                      value={ebooksData?.no_result_rate || 0.0} 
                      unit="%" 
                      bgType="orange" 
                    />
                  </div>
                  <div className="stats-table-section">
                    <h3 className="stats-section-title">คำค้นหายอดนิยม</h3>
                    <div className="stats-table-card">
                      <table className="stats-table">
                        <thead>
                          <tr>
                            <th>อันดับ</th>
                            <th>คำค้นหา</th>
                            <th>หมวดหมู่</th>
                            <th>ดาวน์โหลด</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ebooksData?.keywords && ebooksData.keywords.length > 0 ? (
                            ebooksData.keywords.map((item, idx) => (
                              <tr key={idx}>
                                <td className="col-rank">{idx + 1}</td>
                                <td className="col-title">"{item.search_keyword}"</td>
                                <td className="col-category">{item.category}</td>
                                <td className="col-count">
                                  <strong>{item.download_count?.toLocaleString()}</strong>{' '}
                                  <span className="text-unit">ครั้ง</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูล</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* =========================================
                  6. Equipment Rental Stats
              ========================================= */}
              {activeMenu === 'Equipment Rental Stats' && (
                <>
                  <div className="summary-cards-row">
                    <StatCard 
                      title="จำนวนการยืมอุปกรณ์ทั้งหมด" 
                      value={equipmentData?.total_rentals?.toLocaleString() || 0} 
                      unit="ครั้ง" 
                      bgType="gray" 
                    />
                    <StatCard 
                      title="อัตราคืนในสภาพสมบูรณ์" 
                      value={typeof equipmentData?.intact_rate === 'number' ? equipmentData.intact_rate.toFixed(1) : '100.0'} 
                      unit="%" 
                      bgType="green" 
                    />
                    <StatCard 
                      title="อัตราชำรุดหรือสูญหาย" 
                      value={typeof equipmentData?.damaged_rate === 'number' ? equipmentData.damaged_rate.toFixed(1) : '0.0'} 
                      unit="%" 
                      bgType="orange" 
                      valueColor="#ea580c" 
                    />
                  </div>
                  
                  <div className="chart-section">
                    <h3>ความถี่การยืมแยกตามประเภทอุปกรณ์</h3>
                    <div className="horizontal-bar-container">
                      {(equipmentData?.devices || []).map((dev, idx) => (
                        <div key={idx} className="h-bar-row">
                          <span className="h-bar-label">{dev.name} ({dev.count?.toLocaleString()} times)</span>
                          <div className="h-bar-track">
                            <div 
                              className="h-bar-fill" 
                              style={{
                                width: `${Math.min(100, Math.round((dev.count / (equipmentData?.total_rentals || 1)) * 100))}%`, 
                                backgroundColor: '#6B8E7B'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* =========================================
                  7. Complaint Statistics (รวบรวมสถิติข้อร้องเรียน)
              ========================================= */}
              {activeMenu === 'Complaint Statistics' && (
                <>
                  <div className="summary-cards-row">
                    <StatCard 
                      title="เรื่องร้องเรียนทั้งหมด" 
                      value={totalComplaints.toLocaleString()} 
                      unit="เรื่อง" 
                      bgType="gray" 
                    />
                    <StatCard 
                      title="อัตราการแก้ไขสำเร็จ" 
                      value={resolutionRate} 
                      unit="%" 
                      bgType="green" 
                    />
                    <StatCard 
                      title="กำลังดำเนินงานหรือประสานงาน" 
                      value={inProgressComplaints.toLocaleString()} 
                      unit="เรื่อง" 
                      bgType="orange" 
                      valueColor="#ea580c" 
                    />
                  </div>
                  
                  <div className="chart-section">
                    <h3>สถิติการร้องเรียนแยกตามหมวดหมู่</h3>
                    <div className="horizontal-bar-container">
                      {categoryList.length > 0 ? (
                        categoryList.map((item, idx) => (
                          <div key={idx} className="h-bar-row">
                            <span className="h-bar-label">
                              {item.category} ({item.count} cases - {item.percentage}%)
                            </span>
                            <div className="h-bar-track">
                              <div 
                                className="h-bar-fill" 
                                style={{
                                  width: `${item.percentage}%`, 
                                  backgroundColor: idx === 0 ? '#16a34a' : idx === 1 ? '#0284c7' : idx === 2 ? '#eab308' : '#8b5cf6'
                                }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>ไม่พบข้อมูลหมวดหมู่</div>
                      )}
                    </div>
                  </div>

                  <div className="stats-table-section">
                    <h3 className="stats-section-title">ประสิทธิภาพการจัดการแยกตามหมวดหมู่</h3>
                    <div className="stats-table-card">
                      <table className="stats-table stats-table-category">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center', width: '6%' }}>#</th>
                            <th>หมวดหมู่</th>
                            <th style={{ textAlign: 'center' }}>รับแจ้งทั้งหมด</th>
                            <th style={{ textAlign: 'center' }}>สัดส่วน (%)</th>
                            <th style={{ textAlign: 'center' }}>แก้ไขเสร็จสิ้น</th>
                            <th style={{ textAlign: 'center' }}>กำลังดำเนินการ</th>
                            <th style={{ textAlign: 'center' }}>อัตราความสำเร็จ</th>
                            <th style={{ textAlign: 'center' }}>ระยะเวลาเฉลี่ย</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryStatsList.length > 0 ? (
                            categoryStatsList.map((item, idx) => (
                              <tr key={item.category || idx}>
                                <td className="col-rank">{idx + 1}</td>
                                <td><strong>{item.category}</strong></td>
                                <td style={{ textAlign: 'center' }}>
                                  <strong>{item.total.toLocaleString()}</strong> <span className="text-unit">เรื่อง</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>{item.percentage}%</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span style={{ color: '#16a34a', fontWeight: 600 }}>{item.resolved}</span> <span className="text-unit">เรื่อง</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span style={{ color: '#ea580c', fontWeight: 600 }}>{item.inProgress}</span> <span className="text-unit">เรื่อง</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={parseFloat(item.resolutionRate) >= 50 ? 'trend-up' : 'trend-down'}>
                                    {item.resolutionRate}%
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <strong>{item.avgDays}</strong> <span className="text-unit">วัน</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูลสถิติในรอบเวลานี้</td></tr>
                          )}
                        </tbody>
                        {categoryStatsList.length > 0 && (
                          <tfoot>
                            <tr className="stats-total-row">
                              <td style={{ textAlign: 'center' }}>-</td>
                              <td><strong>รวมทั้งหมด (Total)</strong></td>
                              <td style={{ textAlign: 'center' }}>
                                <strong>{totalComplaints.toLocaleString()}</strong> <span className="text-unit">เรื่อง</span>
                              </td>
                              <td style={{ textAlign: 'center' }}><strong>100%</strong></td>
                              <td style={{ textAlign: 'center' }}>
                                <strong style={{ color: '#16a34a' }}>{overallResolved.toLocaleString()}</strong> <span className="text-unit">เรื่อง</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <strong style={{ color: '#ea580c' }}>{overallInProgress.toLocaleString()}</strong> <span className="text-unit">เรื่อง</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <strong className="trend-up">{resolutionRate}%</strong>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <strong>{overallAvgDays}</strong> <span className="text-unit">วัน</span>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        </main>
      </div>
    </BackOfficeLayout>
  );
}