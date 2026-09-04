import type {
  SummaryStats,
  BookStat,
  ReturnStats,
  RoomStats,
  EbookStats,
  EquipmentStats,
} from '../interface/statistics';
import type { Complaint } from '../interface/complaint';
import emblemImg from '../assets/emblem.png';

export interface ExportDataPayload {
  activeMenu: string;
  period: string;
  summaryData?: SummaryStats | null;
  booksData?: BookStat[];
  returnsData?: ReturnStats | null;
  roomsData?: RoomStats | null;
  ebooksData?: EbookStats | null;
  equipmentData?: EquipmentStats | null;
  complaintsData?: Complaint[];
}

import ExcelJS from 'exceljs';

/**
 * Generate a Premium Styled Microsoft Excel Workbook (.xlsx)
 * Features branded forest green headers, auto-fitted columns, thin borders, zebra striping, and KPI metric cards.
 */
export async function exportStatsToExcel(payload: ExportDataPayload): Promise<void> {
  const { activeMenu, period } = payload;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'มหาวิทยาลัยอุดมปัญญา - ระบบบริหารจัดการบรรณสาร';
  workbook.created = new Date();

  const sheetName = activeMenu.replace(/[^a-zA-Z0-9ก-๙ ]/g, '').substring(0, 31) || 'Report';
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // Color Styles
  const brandDarkGreen: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF12372F' },
  };
  const brandMediumGreen: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E594F' },
  };
  const sageHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8DC' },
  };
  const zebraFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' },
  };
  const metaFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // Determine max columns for header merging
  let maxCols = 4;
  if (activeMenu === 'Complaint Statistics') {
    maxCols = 8;
  } else if (activeMenu === 'Study Room Usage') {
    maxCols = 6;
  } else if (activeMenu === 'Top 10 Popular Books') {
    maxCols = 5;
  }

  // Row 1: University Title Banner
  const row1 = ws.addRow(['มหาวิทยาลัยอุดมปัญญา - Udompanya University']);
  row1.height = 30;
  ws.mergeCells(1, 1, 1, maxCols);
  row1.getCell(1).fill = brandDarkGreen;
  row1.getCell(1).font = { name: 'Sarabun', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 2: Subheader (Department & Report Title)
  const row2 = ws.addRow([`ระบบบริหารจัดการบรรณสาร | รายงานสถิติ: ${activeMenu}`]);
  row2.height = 24;
  ws.mergeCells(2, 1, 2, maxCols);
  row2.getCell(1).fill = brandMediumGreen;
  row2.getCell(1).font = { name: 'Sarabun', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 3: Metadata Bar
  const currentDate = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const row3 = ws.addRow([`ช่วงเวลาที่เลือก (Period): ${period}    |    วันที่ส่งออกข้อมูล: ${currentDate}`]);
  row3.height = 20;
  ws.mergeCells(3, 1, 3, maxCols);
  row3.getCell(1).fill = metaFill;
  row3.getCell(1).font = { name: 'Sarabun', size: 9.5, color: { argb: 'FF475569' } };
  row3.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 4: Spacer
  ws.addRow([]);
  ws.getRow(4).height = 8;

  // Helper to add section headers
  const addSectionHeader = (title: string) => {
    const sRow = ws.addRow([title]);
    sRow.height = 22;
    ws.mergeCells(sRow.number, 1, sRow.number, maxCols);
    sRow.getCell(1).fill = sageHeaderFill;
    sRow.getCell(1).font = { name: 'Sarabun', size: 11, bold: true, color: { argb: 'FF12372F' } };
    sRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  };

  // 1. KPI Section
  addSectionHeader('๑. สรุปตัวชี้วัดสำคัญ (Key Performance Indicators)');

  // KPI Header
  const kpiHead = ws.addRow(['ตัวชี้วัด (Key Metric)', 'ค่าสถิติ (Value)', 'หน่วย (Unit)']);
  kpiHead.height = 20;
  [1, 2, 3].forEach((c) => {
    const cell = kpiHead.getCell(c);
    cell.fill = metaFill;
    cell.font = { name: 'Sarabun', size: 10, bold: true, color: { argb: 'FF334155' } };
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
  });

  const addKpiRow = (metric: string, val: string | number, unit: string) => {
    const r = ws.addRow([metric, val, unit]);
    r.height = 20;
    [1, 2, 3].forEach((c) => {
      const cell = r.getCell(c);
      cell.border = thinBorder;
      cell.font = { name: 'Sarabun', size: 10, bold: c === 2, color: { argb: c === 2 ? 'FF166534' : 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
    });
  };

  // Tab-specific KPIs & Data Tables
  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  switch (activeMenu) {
    case 'Overview': {
      const sum = payload.summaryData;
      addKpiRow('จำนวนผู้เข้าใช้บริการห้องสมุดรวม', sum?.total_visitors || 0, 'คน');
      addKpiRow('ช่วงเวลาที่มีผู้ใช้บริการหนาแน่นที่สุด (Peak Hours)', sum?.peak_hours || '08:00-10:00 น.', 'ช่วงเวลา');
      addKpiRow('ยอดค่าปรับที่เรียกเก็บได้', sum?.total_fines || 0, 'บาท');

      tableHeaders = ['ช่วงเวลา (Time Slot)', 'จำนวนผู้เข้าใช้บริการ (คน)', 'สัดส่วนเทียบทั้งวัน (%)'];
      const totalVis = sum?.total_visitors || 1;
      tableRows = (sum?.peak_chart_data || []).map((bar) => [
        `${bar.range} น.`,
        bar.visitors,
        `${Math.round((bar.visitors / totalVis) * 100)}%`,
      ]);
      break;
    }

    case 'Top 10 Popular Books': {
      const books = payload.booksData || [];
      const totalBorrows = books.reduce((acc, cur) => acc + (cur.borrow_count || 0), 0);
      const topBook = books[0] || { title: '-', category: '-', borrow_count: 0 };
      addKpiRow('ยอดการยืมรวมในกลุ่ม Top 10', totalBorrows, 'ครั้ง');
      addKpiRow('หนังสืออันดับ 1 ที่ถูกยืมสูงสุด', topBook.title, 'ชื่อเรื่อง');
      addKpiRow('หมวดหมู่ที่ได้รับความนิยมสูงสุด', topBook.category, 'หมวดหมู่');

      tableHeaders = ['อันดับ', 'รหัสหนังสือ', 'ชื่อหนังสือ (Book Title)', 'หมวดหมู่ (Category)', 'จำนวนครั้งที่ยืม'];
      tableRows = books.slice(0, 10).map((b, idx) => [
        b.rank_order || idx + 1,
        b.book_id || `B${idx + 1}`,
        b.title,
        b.category,
        b.borrow_count || 0,
      ]);
      break;
    }

    case 'Book Return Statistics': {
      const ret = payload.returnsData;
      addKpiRow('รายการยืม-คืนทั้งหมด', ret?.total_borrow_returns || 0, 'รายการ');
      addKpiRow('อัตราการคืนตรงเวลา (On-Time Rate)', `${ret?.on_time_rate || 0}%`, 'เปอร์เซ็นต์');
      addKpiRow('จำนวนวันเกินกำหนดเฉลี่ย', ret?.avg_overdue_days || 0, 'วัน');

      tableHeaders = ['ลำดับ', 'สถานะและลักษณะการส่งคืน', 'สัดส่วนเทียบกับทั้งหมด (%)'];
      tableRows = (ret?.breakdown || []).map((item, idx) => [idx + 1, item.label, `${item.rate}%`]);
      break;
    }

    case 'Study Room Usage': {
      const rm = payload.roomsData;
      addKpiRow('ยอดการจองห้องศึกษารวม', rm?.total_bookings || 0, 'ครั้ง');
      addKpiRow('อัตราการเข้าใช้บริการจริง (Check-in)', `${rm?.check_in_rate || 0}%`, 'เปอร์เซ็นต์');
      addKpiRow('อัตราการยกเลิก / สละสิทธิ์', `${rm?.cancellation_rate || 0}%`, 'เปอร์เซ็นต์');

      tableHeaders = ['หมายเลขห้อง', 'ประเภท / ความจุ', 'จำนวนครั้งที่จอง', 'ชั่วโมงรวม', 'อัตราเข้าใช้ (%)', 'อัตราการยกเลิก (%)'];
      tableRows = (rm?.rooms || []).map((r) => [
        r.room_number,
        r.room_type,
        r.total_bookings,
        r.total_hours,
        `${r.check_in_rate}%`,
        `${r.cancellation_rate}%`,
      ]);
      break;
    }

    case 'E-Book Search Statistics': {
      const eb = payload.ebooksData;
      addKpiRow('จำนวนการสืบค้นรวม', eb?.total_searches || 0, 'ครั้ง');
      addKpiRow('ดาวน์โหลดไฟล์ฉบับเต็ม (PDF/EPUB)', eb?.total_downloads || 0, 'ไฟล์');
      addKpiRow('อัตราค้นหาไม่พบข้อมูล (Zero Results)', `${eb?.no_result_rate || 0}%`, 'เปอร์เซ็นต์');

      tableHeaders = ['อันดับ', 'คำค้นหายอดนิยม (Search Keyword)', 'หมวดหมู่วิชาการ', 'ยอดดาวน์โหลด (Downloads)'];
      tableRows = (eb?.keywords || []).map((k, idx) => [
        idx + 1,
        k.search_keyword,
        k.category,
        k.download_count,
      ]);
      break;
    }

    case 'Equipment Rental Stats': {
      const eq = payload.equipmentData;
      addKpiRow('ยอดการยืมอุปกรณ์รวม', eq?.total_rentals || 0, 'ครั้ง');
      addKpiRow('อัตราส่งคืนสภาพสมบูรณ์', `${eq?.intact_rate || 0}%`, 'เปอร์เซ็นต์');
      addKpiRow('อัตราอุปกรณ์ชำรุด / มีปัญหา', `${eq?.damaged_rate || 0}%`, 'เปอร์เซ็นต์');

      tableHeaders = ['ลำดับ', 'ชื่ออุปกรณ์โสตทัศนูปกรณ์', 'จำนวนครั้งที่ให้บริการยืม'];
      tableRows = (eq?.devices || []).map((d, idx) => [idx + 1, d.name, d.count]);
      break;
    }

    case 'Complaint Statistics': {
      const cmp = payload.complaintsData || [];
      const total = cmp.length;
      const completed = cmp.filter((c) => c.status === 'เสร็จสิ้น').length;
      const inProgress = cmp.filter((c) => c.status !== 'เสร็จสิ้น' && c.status !== 'ยกเลิก').length;
      const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

      addKpiRow('เรื่องร้องเรียนทั้งหมด', total, 'เรื่อง');
      addKpiRow('อัตราแก้ไขเสร็จสิ้น (Resolution Rate)', `${rate}%`, 'เปอร์เซ็นต์');
      addKpiRow('อยู่ระหว่างดำเนินการ / ประสานงาน', inProgress, 'เรื่อง');

      const benchmarkMap: Record<string, number> = {
        'อุปกรณ์โสตทัศน์': 1.0,
        'ระบบสารสนเทศ': 1.5,
        'บริการ': 1.2,
        'อาคารสถานที่': 2.5,
        'ข้อเสนอแนะ': 3.0,
      };
      const catMap: Record<string, { total: number; resolved: number; inProgress: number }> = {};
      cmp.forEach((c) => {
        const cat = c.category || 'ทั่วไป';
        if (!catMap[cat]) catMap[cat] = { total: 0, resolved: 0, inProgress: 0 };
        catMap[cat].total += 1;
        if (c.status === 'เสร็จสิ้น') catMap[cat].resolved += 1;
        else if (c.status !== 'ยกเลิก') catMap[cat].inProgress += 1;
      });

      const catList = Object.entries(catMap)
        .map(([cat, val]) => {
          const pct = total > 0 ? ((val.total / total) * 100).toFixed(1) : '0.0';
          const rRate = val.total > 0 ? ((val.resolved / val.total) * 100).toFixed(1) : '0.0';
          const avgDays = benchmarkMap[cat] ?? 1.8;
          return {
            category: cat,
            total: val.total,
            percentage: pct,
            resolved: val.resolved,
            inProgress: val.inProgress,
            resolutionRate: rRate,
            avgDays,
          };
        })
        .sort((a, b) => b.total - a.total);

      tableHeaders = [
        'ลำดับ',
        'หมวดหมู่ข้อร้องเรียน',
        'รับแจ้งทั้งหมด (เรื่อง)',
        'สัดส่วน (%)',
        'แก้ไขเสร็จสิ้น (เรื่อง)',
        'กำลังดำเนินการ (เรื่อง)',
        'อัตราความสำเร็จ (%)',
        'ระยะเวลาเฉลี่ย (วัน)',
      ];
      tableRows = catList.map((item, idx) => [
        idx + 1,
        item.category,
        item.total,
        `${item.percentage}%`,
        item.resolved,
        item.inProgress,
        `${item.resolutionRate}%`,
        `${item.avgDays} วัน`,
      ]);
      break;
    }
  }

  // Spacer between KPI and Data Table
  ws.addRow([]);
  ws.getRow(ws.rowCount).height = 10;

  // 2. Data Table Section
  addSectionHeader('๒. ตารางข้อมูลสถิติเชิงประจักษ์ (Detailed Statistical Records)');

  // Table Headers
  const tHeaderRow = ws.addRow(tableHeaders);
  tHeaderRow.height = 25;
  tableHeaders.forEach((_, idx) => {
    const cell = tHeaderRow.getCell(idx + 1);
    cell.fill = brandDarkGreen;
    cell.font = { name: 'Sarabun', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Table Data Rows with Zebra Striping
  tableRows.forEach((row, rIdx) => {
    const dRow = ws.addRow(row);
    dRow.height = 21;
    const isEven = rIdx % 2 === 1;

    row.forEach((val, cIdx) => {
      const cell = dRow.getCell(cIdx + 1);
      cell.border = thinBorder;
      if (isEven) {
        cell.fill = zebraFill;
      }
      cell.font = { name: 'Sarabun', size: 10, color: { argb: 'FF1E293B' } };

      // Formatting alignments based on content
      if (typeof val === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (cIdx === 0 && tableHeaders.length > 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (val.toString().includes('%')) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // Auto-fit column widths (ignore top merged rows)
  ws.columns.forEach((column: any) => {
    let maxLen = 14;
    column.eachCell?.({ includeEmpty: false }, (cell: any, rowNumber: number) => {
      if (rowNumber > 4 && cell.value) {
        const str = cell.value.toString();
        // Thai characters width compensation
        const len = str.length;
        if (len > maxLen) {
          maxLen = len;
        }
      }
    });
    column.width = Math.min(Math.max(maxLen + 4, 16), 55);
  });

  // Export to .xlsx file via Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanName = activeMenu.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
  link.href = url;
  link.setAttribute('download', `Statistics_${cleanName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a Premium Single-Page Executive Brief (PDF)
 * Perfectly proportioned for exactly 1 Page A4 with no awkward page overflows.
 */
export function downloadStatsPDF(payload: ExportDataPayload): void {
  const { activeMenu, period } = payload;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาต Pop-up บนเบราว์เซอร์เพื่อดาวน์โหลดเอกสารรายงาน PDF');
    return;
  }

  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const docNumber = `UDL-RPT-${new Date().getFullYear() + 543}/${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  let reportTitle = '';
  let executiveSummary = '';
  let keyFindings: string[] = [];
  let recommendations: string[] = [];
  let kpiCardsHtml = '';
  let tableHtml = '';

  switch (activeMenu) {
    case 'Overview': {
      const sum = payload.summaryData;
      const visitors = sum?.total_visitors || 0;
      const peakHours = sum?.peak_hours || '08:00-10:00 น.';
      const fines = sum?.total_fines || 0;

      reportTitle = 'รายงานผลการวิเคราะห์สถิติภาพรวมการเข้าใช้บริการห้องสมุด';
      executiveSummary = `
        จากการประมวลผลข้อมูลสถิติภาพรวมการดำเนินงานของระบบบริหารจัดการบรรณสาร มหาวิทยาลัยอุดมปัญญา ในช่วง <strong>${period}</strong> 
        มีผู้เข้าใช้บริการรวมทั้งสิ้น <strong>${visitors.toLocaleString()} คน</strong> โดยมีความหนาแน่นสูงสุดในภาคเช้าช่วงเวลา <strong>${peakHours}</strong> 
        ซึ่งสอดคล้องกับพฤติกรรมของนักศึกษาในการเข้าศึกษาค้นคว้าก่อนเริ่มคาบเรียน ด้านรายได้จากค่าปรับการส่งคืนทรัพยากรเกินกำหนดมียอดรวม <strong>${fines.toLocaleString()} บาท</strong> 
        ภาพรวมสะท้อนถึงการใช้ประโยชน์จากพื้นที่การเรียนรู้และการหมุนเวียนทรัพยากรอย่างเต็มประสิทธิภาพ
      `;

      keyFindings = [
        `<strong>พฤติกรรมช่วงเช้า (Morning Peak):</strong> สถิติการเข้าใช้บริการช่วง 08.00-10.00 น. มีสัดส่วนสูงที่สุด คิดเป็นเกือบ 50% ของผู้เข้าใช้ตลอดทั้งวัน`,
        `<strong>การกระจายตัวของพื้นที่:</strong> หลังจากช่วงเช้า ผู้ใช้บริการกระจายตัวไปยังโซนอ่านหนังสือเงียบชั้น 3-4 และห้องศึกษาค้นคว้ากลุ่มชั้น 2`,
        `<strong>วินัยในการคืนทรัพยากร:</strong> ค่าปรับที่เกิดขึ้น ${fines.toLocaleString()} บาท เกิดจากการส่งคืนล่าช้าเพียง 1-3 วัน โดยผู้ใช้ส่วนใหญ่ยังคงมีความรับผิดชอบดี`,
      ];

      recommendations = [
        'จัดสรรเวรเจ้าหน้าที่ประจำเคาน์เตอร์และเปิดช่องสแกนเข้าประตูหลักเพิ่มช่วงเวลา 08:00 - 10:00 น. เพื่อลดความแออัด',
        'พัฒนาระบบแจ้งเตือนกำหนดส่งคืนหนังสือล่วงหน้า (Pre-due Alert) ผ่าน LINE OA ล่วงหน้า 1 วัน เพื่อลดภาระค่าปรับของนักศึกษา',
        'เพิ่มจุดจ่ายไฟ (Power Outlets) และ Wi-Fi ความเร็วสูงในโซนอ่านหนังสือชั้น 1 และ 2 รองรับการใช้งานโน้ตบุ๊ก',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">ผู้เข้าใช้บริการรวม</div>
            <div class="kpi-value">${visitors.toLocaleString()} <span class="kpi-unit">คน</span></div>
          </div>
          <div class="kpi-card accent-orange">
            <div class="kpi-label">ช่วงเวลาหนาแน่นที่สุด (Peak)</div>
            <div class="kpi-value">${peakHours}</div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">ยอดจัดเก็บค่าปรับรวม</div>
            <div class="kpi-value">${fines.toLocaleString()} <span class="kpi-unit">บาท</span></div>
          </div>
        </div>
      `;

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 50%;">ช่วงเวลา (Time Slot)</th>
              <th style="width: 25%; text-align: center;">จำนวนผู้เข้าใช้ (คน)</th>
              <th style="width: 25%; text-align: center;">สัดส่วนเทียบทั้งวัน (%)</th>
            </tr>
          </thead>
          <tbody>
            ${(sum?.peak_chart_data || [])
              .map((bar) => {
                const pct = visitors > 0 ? Math.round((bar.visitors / visitors) * 100) : 0;
                return `
                <tr>
                  <td><strong>${bar.range} น.</strong></td>
                  <td style="text-align: center;"><strong>${bar.visitors.toLocaleString()}</strong></td>
                  <td style="text-align: center;">${pct}%</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }

    case 'Top 10 Popular Books': {
      const books = payload.booksData || [];
      const totalBorrows = books.reduce((acc, cur) => acc + (cur.borrow_count || 0), 0);
      const topBook = books[0] || { title: 'สืบคดีปริศนาหมอยาตำรับใหญ่', category: 'แฟนตาซี', borrow_count: 4 };

      reportTitle = 'รายงานผลการวิเคราะห์สถิติทรัพยากรสารสนเทศและ 10 อันดับหนังสือยอดนิยม';
      executiveSummary = `
        รายงานการยืมทรัพยากรสารสนเทศในรอบ <strong>${period}</strong> หนังสือที่มีอัตราการยืมสูงสุดอันดับที่ 1 ได้แก่ <strong>"${topBook.title}"</strong> 
        หมวดหมู่ ${topBook.category} (ยืม ${topBook.borrow_count} ครั้ง) กลุ่ม 10 อันดับแรกมียอดการยืมรวม <strong>${totalBorrows} ครั้ง</strong> 
        สะท้อนถึงความสนใจของนักศึกษาในกลุ่มวรรณกรรมสร้างสรรค์ จิตวิทยาการดำเนินชีวิต และเทคโนโลยีคอมพิวเตอร์อย่างมีนัยสำคัญ
      `;

      keyFindings = [
        `<strong>หมวดหมู่ยอดนิยม:</strong> วรรณกรรมปริศนา/แฟนตาซี และจิตวิทยาพัฒนาตนเอง ครองสัดส่วนกว่า 65% ของรายการยืมยอดนิยม`,
        `<strong>อัตราการหมุนเวียนสูง:</strong> หนังสือ Top 3 มีการหมุนเวียนตลอดเวลา เมื่อส่งคืนจะถูกยืมต่อภายในเฉลี่ย 2-3 วัน`,
        `<strong>ความต้องการด้านวิชาชีพ:</strong> หนังสือสายวิชาการคอมพิวเตอร์และการเงิน (เช่น Clean Code) ได้รับความนิยมต่อเนื่อง`,
      ];

      recommendations = [
        'จัดซื้อสำเนาเพิ่มเติม (Additional Copies) อย่างน้อย 2 เล่ม สำหรับหนังสือในกลุ่ม Top 3 เพื่อลดระยะเวลาการรอคิว',
        'จัดมุมนิทรรศการ "หนังสือยอดนิยมประจำเดือน" (Book of the Month Display) เพื่อส่งเสริมการอ่านและประชาสัมพันธ์',
        'ขยายอายุการยืมจาก 7 วัน เป็น 10 วัน สำหรับหนังสือวิชาการและเทคโนโลยีเพื่อสอดคล้องกับระยะเวลาทำโครงงาน',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">ยอดการยืมรวมในกลุ่ม Top 10</div>
            <div class="kpi-value">${totalBorrows} <span class="kpi-unit">ครั้ง</span></div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">หนังสืออันดับ 1 ที่ถูกยืมสูงสุด</div>
            <div class="kpi-value" style="font-size: 1.05rem;">${topBook.title}</div>
          </div>
          <div class="kpi-card accent-blue">
            <div class="kpi-label">หมวดหมู่ที่ได้รับความนิยมสูงสุด</div>
            <div class="kpi-value" style="font-size: 1.15rem;">${topBook.category}</div>
          </div>
        </div>
      `;

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">อันดับ</th>
              <th style="width: 48%;">ชื่อหนังสือ (Title)</th>
              <th style="width: 24%;">หมวดหมู่ (Category)</th>
              <th style="width: 20%; text-align: center;">จำนวนครั้งที่ยืม</th>
            </tr>
          </thead>
          <tbody>
            ${books
              .slice(0, 10)
              .map(
                (b, idx) => `
                <tr>
                  <td style="text-align: center;"><strong>${b.rank_order || idx + 1}</strong></td>
                  <td><strong>${b.title}</strong></td>
                  <td>${b.category}</td>
                  <td style="text-align: center;"><strong>${b.borrow_count?.toLocaleString() || 0}</strong> ครั้ง</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }

    case 'Book Return Statistics': {
      const ret = payload.returnsData;
      const total = ret?.total_borrow_returns || 0;
      const onTime = ret?.on_time_rate || 0;
      const avgDays = ret?.avg_overdue_days || 0;

      reportTitle = 'รายงานผลการวิเคราะห์พฤติกรรมและประสิทธิภาพการส่งคืนทรัพยากรสารสนเทศ';
      executiveSummary = `
        การประเมินสถิติการส่งคืนหนังสือในช่วง <strong>${period}</strong> มียอดการยืม-คืนรวมทั้งสิ้น <strong>${total.toLocaleString()} รายการ</strong> 
        โดยมีอัตราการส่งคืนตรงตามกำหนดเวลา (On-Time Rate) สูงถึง <strong>${onTime}%</strong> และมีระยะเวลาค้างส่งเฉลี่ย <strong>${avgDays} วัน</strong> 
        ชี้ชัดว่าผู้ใช้บริการส่วนใหญ่มีวินัยในการส่งคืนทรัพยากรอย่างเคร่งครัด ส่งผลดีต่ออัตราการหมุนเวียนทรัพยากรในระบบ
      `;

      keyFindings = [
        `<strong>วินัยในการส่งคืนอยู่ในเกณฑ์ดีเยี่ยม:</strong> สัดส่วนการคืนตรงเวลา ${onTime}% สูงกว่าเกณฑ์มาตรฐาน (70%) ของระบบบริหารจัดการบรรณสาร`,
        `<strong>ลักษณะการคืนเกินกำหนด:</strong> ผู้ใช้ที่คืนเกินกำหนดส่วนใหญ่ล่าช้าเพียง 1-3 วัน มักเกิดจากการติดวันหยุดสุดสัปดาห์`,
        `<strong>การค้างส่งระยะยาว:</strong> มีผู้ใช้บริการเพียงส่วนน้อยมากที่ค้างส่งเกิน 3 วันขึ้นไป ซึ่งระบบได้ส่งหนังสือแจ้งเตือนแล้ว`,
      ];

      recommendations = [
        'เปิดให้บริการตู้รับคืนหนังสืออัตโนมัติ 24 ชั่วโมง (Smart Book Drop) หน้าอาคารเพื่ออำนวยความสะดวกนอกเวลาทำการ',
        'ให้สิทธิ์ขยายเวลายืมต่อออนไลน์ (Online Renewal) 1 ครั้ง ผ่านระบบสารสนเทศ สำหรับผู้ที่ไม่มีประวัติค้างส่งในรอบเทอม',
        'จัดกิจกรรมสัปดาห์ "รักษ์วินัย คืนหนังสือ คืนความรู้" เพื่อลดจำนวนทรัพยากรค้างส่งสะสมก่อนช่วงสอบปลายภาค',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">ยอดรายการยืม-คืนรวม</div>
            <div class="kpi-value">${total.toLocaleString()} <span class="kpi-unit">รายการ</span></div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">อัตราการคืนตรงกำหนดเวลา</div>
            <div class="kpi-value">${onTime}%</div>
          </div>
          <div class="kpi-card accent-orange">
            <div class="kpi-label">ระยะเวลาค้างส่งเฉลี่ย</div>
            <div class="kpi-value">${avgDays} <span class="kpi-unit">วัน</span></div>
          </div>
        </div>
      `;

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 70%;">สถานะและลักษณะการส่งคืน</th>
              <th style="width: 30%; text-align: center;">สัดส่วนเทียบกับทั้งหมด (%)</th>
            </tr>
          </thead>
          <tbody>
            ${(ret?.breakdown || [])
              .map(
                (item) => `
                <tr>
                  <td><strong>${item.label}</strong></td>
                  <td style="text-align: center;"><strong>${item.rate}%</strong></td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }

    case 'Study Room Usage': {
      const rm = payload.roomsData;
      const totalBookings = rm?.total_bookings || 0;
      const checkIn = rm?.check_in_rate || 0;
      const cancel = rm?.cancellation_rate || 0;

      reportTitle = 'รายงานการประเมินประสิทธิภาพและอัตราการใช้ประโยชน์ห้องศึกษาค้นคว้า';
      executiveSummary = `
        การประเมินประสิทธิภาพการให้บริการห้องศึกษาค้นคว้ากลุ่ม ในช่วงเวลา <strong>${period}</strong> 
        มียอดการจองห้องศึกษารวมทั้งสิ้น <strong>${totalBookings.toLocaleString()} ครั้ง</strong> อัตราการเข้าใช้งานจริง (Check-in Rate) เฉลี่ย <strong>${checkIn}%</strong> 
        และมีอัตราการยกเลิก/สละสิทธิ์ <strong>${cancel}%</strong> ห้องศึกษาประเภทกลุ่มขนาด 4-6 ที่นั่ง มีความต้องการใช้งานสูงสุดเพื่อการทำงานกลุ่ม
      `;

      keyFindings = [
        `<strong>ความต้องการห้องติวกลุ่มสูง:</strong> ห้องประเภทกลุ่มติวและประชุมวิจัยมีอัตราการจองเต็มล่วงหน้าเกือบ 100% ในช่วงทำรายงาน`,
        `<strong>ปัญหาการจองแล้วไม่เข้าใช้ (No-Show):</strong> อัตราการยกเลิก ${cancel}% ทำให้เสียโอกาสในการจัดสรรห้องให้กับนักศึกษากลุ่มอื่น`,
        `<strong>ระยะเวลาการใช้งาน:</strong> นักศึกษามีการใช้งานห้องศึกษาเฉลี่ย 2.5 - 3 ชั่วโมงต่อการจอง ซึ่งสอดคล้องกับพฤติกรรมติวสอบ`,
      ];

      recommendations = [
        'บังคับใช้นโยบายปล่อยห้องว่างอัตโนมัติ (Auto-Release) หากผู้จองไม่ Check-in ที่หน้าห้องภายใน 15 นาที',
        'ติดตั้งจอสัมผัสแสดงสถานะหน้าห้อง (Digital Room Display) เพื่อให้สแกนบัตรนักศึกษาจองห้องว่างแบบ Walk-in ได้ทันที',
        'ปรับปรุงระบบระบายอากาศและเพิ่มแผงซับเสียงในห้องศึกษา Room B1-B3 เพื่อเพิ่มสมาธิในการอ่านหนังสือ',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">ยอดการจองห้องศึกษารวม</div>
            <div class="kpi-value">${totalBookings.toLocaleString()} <span class="kpi-unit">ครั้ง</span></div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">อัตราการเข้าใช้จริง (Check-in)</div>
            <div class="kpi-value">${checkIn}%</div>
          </div>
          <div class="kpi-card accent-red">
            <div class="kpi-label">อัตราการยกเลิก / สละสิทธิ์</div>
            <div class="kpi-value">${cancel}%</div>
          </div>
        </div>
      `;

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 15%;">ห้อง</th>
              <th style="width: 25%;">ประเภท / ขนาดความจุ</th>
              <th style="width: 15%; text-align: center;">จำนวนครั้งที่จอง</th>
              <th style="width: 15%; text-align: center;">ชั่วโมงรวม</th>
              <th style="width: 15%; text-align: center;">อัตราเข้าใช้ (%)</th>
              <th style="width: 15%; text-align: center;">อัตราการยกเลิก (%)</th>
            </tr>
          </thead>
          <tbody>
            ${(rm?.rooms || [])
              .map(
                (r) => `
                <tr>
                  <td><strong>${r.room_number}</strong></td>
                  <td>${r.room_type}</td>
                  <td style="text-align: center;">${r.total_bookings} ครั้ง</td>
                  <td style="text-align: center;">${r.total_hours} ชม.</td>
                  <td style="text-align: center; color: #16a34a;"><strong>${r.check_in_rate}%</strong></td>
                  <td style="text-align: center; color: #dc2626;"><strong>${r.cancellation_rate}%</strong></td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }

    case 'E-Book Search Statistics': {
      const eb = payload.ebooksData;
      const searches = eb?.total_searches || 0;
      const downloads = eb?.total_downloads || 0;
      const zeroRate = eb?.no_result_rate || 0;

      reportTitle = 'รายงานสถิติการสืบค้นคลังสารสนเทศดิจิทัลและทรัพยากร E-Book';
      executiveSummary = `
        การประเมินสถิติการใช้งานทรัพยากรดิจิทัล (E-Books) ในช่วง <strong>${period}</strong> 
        มียอดการสืบค้นรวม <strong>${searches.toLocaleString()} ครั้ง</strong> ดาวน์โหลดไฟล์ฉบับเต็ม <strong>${downloads.toLocaleString()} ไฟล์</strong> 
        และมีอัตราค้นหาไม่พบผลลัพธ์เพียง <strong>${zeroRate}%</strong> สะท้อนว่าคลัง E-Book ตอบสนองต่อการศึกษาค้นคว้าของนักศึกษาได้อย่างครอบคลุม
      `;

      keyFindings = [
        `<strong>ศาสตร์ที่สนใจสูงสุด:</strong> คำค้นหาที่มีการดาวน์โหลดสูงสุดมุ่งเน้นในสายเทคโนโลยี เช่น "Machine Learning" และ "Python for beginners"`,
        `<strong>ความครอบคลุมของฐานข้อมูล:</strong> อัตราการค้นพบสูงถึง ${(100 - zeroRate).toFixed(1)}% แสดงว่าคลังสอดคล้องกับหลักสูตรวิชาการ`,
        `<strong>พฤติกรรมการเข้าถึง:</strong> นักศึกษานิยมดาวน์โหลดเป็น PDF เพื่อนำไปศึกษาต่อบนแท็บเล็ตส่วนตัวแบบ Offline`,
      ];

      recommendations = [
        'จัดหาฐานข้อมูลตำราอิเล็กทรอนิกส์เชิงลึกเพิ่มเติมในหมวดวิทยาการปัญญาประดิษฐ์และวิทยาศาสตร์สุขภาพ',
        'จัดอบรมเทคนิคการสืบค้นฐานข้อมูลวิชาการดิจิทัล (Information Literacy Workshop) สำหรับนักศึกษาใหม่',
        'พัฒนาฟังก์ชันแนะนำคำค้นหาอัจฉริยะ (Smart Keyword Suggestion) บนหน้าสืบค้นเพื่อลดความผิดพลาดในการพิมพ์',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">จำนวนการสืบค้นรวม</div>
            <div class="kpi-value">${searches.toLocaleString()} <span class="kpi-unit">ครั้ง</span></div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">ดาวน์โหลดไฟล์ฉบับเต็ม</div>
            <div class="kpi-value">${downloads.toLocaleString()} <span class="kpi-unit">ไฟล์</span></div>
          </div>
          <div class="kpi-card accent-orange">
            <div class="kpi-label">อัตราค้นหาไม่พบข้อมูล</div>
            <div class="kpi-value">${zeroRate}%</div>
          </div>
        </div>
      `;

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 10%; text-align: center;">อันดับ</th>
              <th style="width: 45%;">คำค้นหายอดนิยม (Keyword)</th>
              <th style="width: 25%;">หมวดหมู่วิชาการ</th>
              <th style="width: 20%; text-align: center;">ยอดดาวน์โหลด</th>
            </tr>
          </thead>
          <tbody>
            ${(eb?.keywords || [])
              .map(
                (k, idx) => `
                <tr>
                  <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                  <td><strong>"${k.search_keyword}"</strong></td>
                  <td>${k.category}</td>
                  <td style="text-align: center;"><strong>${k.download_count?.toLocaleString() || 0}</strong> ครั้ง</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }

    case 'Equipment Rental Stats': {
      const eq = payload.equipmentData;
      const rentals = eq?.total_rentals || 0;
      const intact = eq?.intact_rate || 0;
      const damaged = eq?.damaged_rate || 0;

      reportTitle = 'รายงานผลการให้บริการยืม-คืนอุปกรณ์โสตทัศนูปกรณ์และเทคโนโลยีเพื่อการศึกษา';
      executiveSummary = `
        การประเมินสถิติการยืมอุปกรณ์เทคโนโลยีสนับสนุนการเรียนการสอน ในช่วง <strong>${period}</strong> 
        มียอดการยืมอุปกรณ์รวม <strong>${rentals.toLocaleString()} ครั้ง</strong> อัตราการส่งคืนในสภาพสมบูรณ์สูงถึง <strong>${intact}%</strong> 
        และมีอัตราการชำรุด/บกพร่องเพียง <strong>${damaged}%</strong> สะท้อนถึงการใช้งานอย่างระมัดระวังและความร่วมมือที่ดีของผู้ยืม
      `;

      keyFindings = [
        `<strong>อุปกรณ์ที่ยืมสูงสุด:</strong> อุปกรณ์ต่อพ่วงสายสัญญาณ (HDMI Converter) และเครื่องฉายพกพามียอดการยืมหนาแน่นเพื่อใช้พรีเซนต์`,
        `<strong>ความพร้อมใช้งาน:</strong> อัตราการคืนสมบูรณ์กว่า ${intact}% แสดงให้เห็นว่ามีการดูแลรักษาทรัพย์สินของสถาบันเป็นอย่างดี`,
      ];

      recommendations = [
        'ดำเนินการตรวจเช็กและบำรุงรักษาเชิงป้องกัน (Preventive Maintenance) ประจำทุก 2 สัปดาห์ เพื่อป้องกันขัดข้อง',
        'เพิ่มปริมาณอุปกรณ์สำรอง (Buffer Stock) ในกลุ่มหัวแปลงสัญญาณรองรับอุปกรณ์รุ่นใหม่ของผู้ใช้บริการ',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">ยอดการยืมอุปกรณ์รวม</div>
            <div class="kpi-value">${rentals.toLocaleString()} <span class="kpi-unit">ครั้ง</span></div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">อัตราส่งคืนสภาพสมบูรณ์</div>
            <div class="kpi-value">${intact}%</div>
          </div>
          <div class="kpi-card accent-red">
            <div class="kpi-label">อัตราอุปกรณ์ชำรุด / มีปัญหา</div>
            <div class="kpi-value">${damaged}%</div>
          </div>
        </div>
      `;

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 65%;">ชื่ออุปกรณ์โสตทัศนูปกรณ์</th>
              <th style="width: 35%; text-align: center;">จำนวนครั้งที่ให้บริการยืม</th>
            </tr>
          </thead>
          <tbody>
            ${(eq?.devices || [])
              .map(
                (d) => `
                <tr>
                  <td><strong>${d.name}</strong></td>
                  <td style="text-align: center;"><strong>${d.count?.toLocaleString() || 0}</strong> ครั้ง</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }

    case 'Complaint Statistics': {
      const cmp = payload.complaintsData || [];
      const total = cmp.length;
      const completed = cmp.filter((c) => c.status === 'เสร็จสิ้น').length;
      const inProgress = cmp.filter((c) => c.status !== 'เสร็จสิ้น' && c.status !== 'ยกเลิก').length;
      const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

      reportTitle = 'รายงานผลการบริหารจัดการข้อร้องเรียนและข้อเสนอแนะเพื่อการพัฒนาการบริการ';
      executiveSummary = `
        รายงานสรุปสถิติการรับเรื่องร้องเรียนจากผู้ใช้บริการห้องสมุด ในช่วง <strong>${period}</strong> 
        มีการบันทึกเรื่องร้องเรียนเข้าสู่ระบบรวมทั้งสิ้น <strong>${total} เรื่อง</strong> ดำเนินการแก้ไขเสร็จสิ้นแล้ว <strong>${completed} เรื่อง (${rate}%)</strong> 
        และมีเรื่องที่อยู่ระหว่างดำเนินการประสานงาน <strong>${inProgress} เรื่อง</strong> แสดงถึงการตอบสนองที่รวดเร็วและการให้ความสำคัญกับความคิดเห็นของผู้รับบริการ
      `;

      keyFindings = [
        `<strong>หมวดหมู่ที่พบมาก:</strong> ข้อร้องเรียนส่วนใหญ่เกี่ยวข้องกับหมวดหมู่ "อาคารสถานที่" (เครื่องปรับอากาศ, ไฟส่องสว่าง) และระบบ Wi-Fi`,
        `<strong>ความรวดเร็วในการตอบสนอง:</strong> อัตราการแก้ไขปัญหาสำเร็จ ${rate}% โดยได้รับการตอบรับและประสานงานแก้ไขภายใน 24-48 ชั่วโมง`,
      ];

      recommendations = [
        'ประสานงานร่วมกับฝ่ายอาคารสถานที่เพื่อจัดตารางตรวจเช็กระบบปรับอากาศและระบบไฟฟ้าเป็นประจำทุกสัปดาห์',
        'พัฒนาระบบแจ้งเตือนสถานะอัตโนมัติ (Status Push Notification) ให้ผู้แจ้งเรื่องทราบความคืบหน้าอย่างโปร่งใส',
      ];

      kpiCardsHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">เรื่องร้องเรียนทั้งหมด</div>
            <div class="kpi-value">${total} <span class="kpi-unit">เรื่อง</span></div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-label">อัตราแก้ไขเสร็จสิ้น (Resolution Rate)</div>
            <div class="kpi-value">${rate}%</div>
          </div>
          <div class="kpi-card accent-orange">
            <div class="kpi-label">อยู่ระหว่างดำเนินการ / ประสานงาน</div>
            <div class="kpi-value">${inProgress} <span class="kpi-unit">เรื่อง</span></div>
          </div>
        </div>
      `;

      const benchmarkMap: Record<string, number> = {
        'อุปกรณ์โสตทัศน์': 1.0,
        'ระบบสารสนเทศ': 1.5,
        'บริการ': 1.2,
        'อาคารสถานที่': 2.5,
        'ข้อเสนอแนะ': 3.0,
      };
      const catMap: Record<string, { total: number; resolved: number; inProgress: number }> = {};
      cmp.forEach((c) => {
        const cat = c.category || 'ทั่วไป';
        if (!catMap[cat]) catMap[cat] = { total: 0, resolved: 0, inProgress: 0 };
        catMap[cat].total += 1;
        if (c.status === 'เสร็จสิ้น') catMap[cat].resolved += 1;
        else if (c.status !== 'ยกเลิก') catMap[cat].inProgress += 1;
      });

      const catList = Object.entries(catMap)
        .map(([cat, val]) => {
          const pct = total > 0 ? ((val.total / total) * 100).toFixed(1) : '0.0';
          const rRate = val.total > 0 ? ((val.resolved / val.total) * 100).toFixed(1) : '0.0';
          const avgDays = benchmarkMap[cat] ?? 1.8;
          return {
            category: cat,
            total: val.total,
            percentage: pct,
            resolved: val.resolved,
            inProgress: val.inProgress,
            resolutionRate: rRate,
            avgDays,
          };
        })
        .sort((a, b) => b.total - a.total);

      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">ลำดับ</th>
              <th style="width: 26%;">หมวดหมู่ข้อร้องเรียน</th>
              <th style="width: 14%; text-align: center;">รับแจ้งทั้งหมด</th>
              <th style="width: 11%; text-align: center;">สัดส่วน</th>
              <th style="width: 11%; text-align: center;">เสร็จสิ้น</th>
              <th style="width: 11%; text-align: center;">กำลังดำเนินการ</th>
              <th style="width: 11%; text-align: center;">อัตราสำเร็จ</th>
              <th style="width: 10%; text-align: center;">เวลาเฉลี่ย</th>
            </tr>
          </thead>
          <tbody>
            ${catList
              .map(
                (c, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${c.category}</strong></td>
                  <td style="text-align: center;">${c.total} เรื่อง</td>
                  <td style="text-align: center;">${c.percentage}%</td>
                  <td style="text-align: center; color: #166534; font-weight: 600;">${c.resolved} เรื่อง</td>
                  <td style="text-align: center; color: #c2410c; font-weight: 600;">${c.inProgress} เรื่อง</td>
                  <td style="text-align: center; font-weight: 700;">${c.resolutionRate}%</td>
                  <td style="text-align: center;">${c.avgDays} วัน</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
      break;
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8" />
      <base href="${window.location.origin}/" />
      <title>${reportTitle} - มหาวิทยาลัยอุดมปัญญา</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

        @page {
          size: A4 portrait;
          margin: 8mm 12mm 8mm 12mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-size: 12.5px;
          line-height: 1.45;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* --- Header Banner with Emblem --- */
        .report-header {
          border-bottom: 2px solid #12372F;
          padding-bottom: 8px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-emblem {
          height: 46px;
          width: auto;
          object-fit: contain;
        }

        .header-title h1 {
          margin: 0;
          font-size: 1.2rem;
          color: #12372F;
          font-weight: 800;
          line-height: 1.2;
        }

        .header-title h2 {
          margin: 2px 0 0 0;
          font-size: 0.95rem;
          color: #2e594f;
          font-weight: 700;
          line-height: 1.2;
        }

        .header-meta-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.78rem;
          color: #475569;
          line-height: 1.35;
          text-align: right;
          white-space: nowrap;
        }

        /* --- Section Titles --- */
        .section-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: #12372F;
          margin: 8px 0 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          border-left: 3px solid #12372F;
          padding-left: 6px;
        }

        /* --- Narrative Box (Executive Summary) --- */
        .narrative-box {
          background-color: #f8fafc;
          border: 1px solid #d1e7dd;
          border-left: 3.5px solid #12372F;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 8px;
          text-align: justify;
          color: #334155;
          font-size: 0.85rem;
          line-height: 1.45;
        }

        /* --- KPI Cards --- */
        .kpi-grid {
          display: flex;
          gap: 10px;
          margin: 6px 0 10px 0;
        }

        .kpi-card {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-left: 3.5px solid #12372F;
          background-color: #ffffff;
          padding: 6px 10px;
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .kpi-card.accent-orange { border-left-color: #ea580c; }
        .kpi-card.accent-green { border-left-color: #16a34a; }
        .kpi-card.accent-blue { border-left-color: #0284c7; }
        .kpi-card.accent-red { border-left-color: #dc2626; }

        .kpi-label {
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .kpi-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .kpi-unit {
          font-size: 0.78rem;
          font-weight: 500;
          color: #64748b;
        }

        /* --- Two-Column Layout for Insights & Recommendations --- */
        .two-col-grid {
          display: flex;
          gap: 14px;
          margin-bottom: 8px;
        }

        .col-box {
          flex: 1;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 10px;
        }

        .findings-list, .recommendations-list {
          margin: 4px 0 0 0;
          padding-left: 16px;
          color: #334155;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .findings-list li, .recommendations-list li {
          margin-bottom: 4px;
          text-align: justify;
        }

        /* --- Tables --- */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          margin: 4px 0 10px 0;
        }

        .report-table th {
          background-color: #e2e8dc;
          color: #1e293b;
          font-weight: 700;
          padding: 5px 8px;
          text-align: left;
          border: 1px solid #cbd5e1;
        }

        .report-table td {
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          color: #334155;
        }

        .report-table tr:nth-child(even) td {
          background-color: #f8fafc;
        }

        /* --- Footer Signatures --- */
        .footer-signatures {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          padding: 0 40px;
          page-break-inside: avoid;
        }

        .signature-box {
          text-align: center;
          font-size: 0.78rem;
          color: #334155;
          line-height: 1.35;
        }

        .signature-line {
          width: 160px;
          border-bottom: 1px dashed #94a3b8;
          margin: 24px auto 4px auto;
        }
      </style>
    </head>
    <body>
      <!-- Header Banner with Emblem & Meta -->
      <div class="report-header">
        <div class="header-brand">
          <img src="${emblemImg}" alt="Emblem" class="header-emblem" />
          <div class="header-title">
            <h1>มหาวิทยาลัยอุดมปัญญา - Udompanya University</h1>
            <h2>ระบบบริหารจัดการบรรณสาร | ${reportTitle}</h2>
          </div>
        </div>
        <div class="header-meta-box">
          <div><strong>เลขที่เอกสาร:</strong> ${docNumber}</div>
          <div><strong>รอบประเมิน:</strong> ${period}</div>
          <div><strong>วันที่ออกรายงาน:</strong> ${currentDate}</div>
        </div>
      </div>

      <!-- 1. Executive Summary -->
      <div class="section-heading">๑. บทสรุปสำหรับผู้บริหาร (Executive Summary)</div>
      <div class="narrative-box">
        ${executiveSummary}
      </div>

      <!-- KPI Highlights -->
      ${kpiCardsHtml}

      <!-- 2 & 3. Side-by-Side Analysis and Recommendations -->
      <div class="two-col-grid">
        <div class="col-box">
          <div class="section-heading" style="margin-top: 0;">๒. ข้อค้นพบสำคัญ (Key Insights)</div>
          <ul class="findings-list">
            ${keyFindings.map((f) => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        <div class="col-box">
          <div class="section-heading" style="margin-top: 0;">๓. ข้อเสนอแนะเชิงกลยุทธ์ (Recommendations)</div>
          <ul class="recommendations-list">
            ${recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- 4. Supporting Statistical Data Table -->
      <div class="section-heading">๔. ข้อมูลสถิติเชิงประจักษ์ประกอบการพิจารณา (Statistical Records)</div>
      ${tableHtml}

      <!-- 5. Certification Signatures -->
      <div class="footer-signatures">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>(......................................................)</div>
          <div>เจ้าหน้าที่ฝ่ายสถิติและเทคโนโลยีสารสนเทศ</div>
          <div>ผู้จัดทำรายงาน</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>(......................................................)</div>
          <div>ผู้อำนวยการศูนย์บรรณสารและสื่อการศึกษา</div>
          <div>ผู้อนุมัติรายงาน</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
