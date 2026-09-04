import type { DisplayComplaint } from '../interface/complaint';
import emblemImg from '../assets/emblem.png';

/**
 * Generates and triggers browser print for an Official Memorandum (บันทึกข้อความราชการ)
 * with Garuda emblem, complaint details, photo evidence, and dynamic QR Code.
 */
export function generateComplaintPDF(item: DisplayComplaint): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาต Pop-up บนเบราว์เซอร์เพื่อพิมพ์เอกสาร PDF');
    return;
  }

  // Mobile Viewer Link for QR Code (Opens high-res photo & complaint details on phone)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const host = isLocal ? '192.168.1.140' : window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const viewUrl = `${window.location.protocol}//${host}${port}/view-image/${item.id}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&margin=1&data=${encodeURIComponent(viewUrl)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <title>&nbsp;</title>
      <meta charset="utf-8" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
        
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
          color: #111827;
          line-height: 1.45;
          background: #ffffff;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 14px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .memo-container {
          width: 100%;
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 12mm 18mm 12mm 18mm;
          box-sizing: border-box;
        }

        /* Formal Thai Garuda / Memo Header */
        .memo-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2.5px solid #12372F;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .memo-top-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .garuda-symbol {
          width: 76px;
          height: 76px;
          object-fit: contain;
        }

        .org-title h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #12372F;
          line-height: 1.2;
        }

        .org-title p {
          margin: 3px 0 0 0;
          font-size: 13.5px;
          color: #4b5563;
        }

        .memo-badge-box {
          text-align: right;
        }

        .memo-badge-title {
          font-size: 26px;
          font-weight: 800;
          color: #12372F;
          letter-spacing: 1.5px;
          line-height: 1;
        }

        .memo-badge-sub {
          font-size: 11.5px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }

        /* Official Info Rows */
        .official-fields {
          margin-bottom: 14px;
          font-size: 14px;
          line-height: 1.55;
        }

        .field-row {
          display: flex;
          margin-bottom: 5px;
        }

        .field-col {
          flex: 1;
        }

        .label-bold {
          font-weight: 700;
          color: #12372F;
        }

        /* Subject & Body Announcement */
        .subject-intro {
          background-color: #f8fafc;
          border-left: 4px solid #12372F;
          padding: 9px 14px;
          margin-bottom: 14px;
          font-size: 13.5px;
          line-height: 1.5;
        }

        /* Formal Data Table */
        .content-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 13px;
        }

        .content-table th, .content-table td {
          border: 1px solid #cbd5e1;
          padding: 6.5px 10px;
          text-align: left;
          vertical-align: top;
        }

        .content-table th {
          background-color: #f1f5f9;
          color: #12372F;
          font-weight: 700;
          width: 27%;
        }

        .content-table td {
          background-color: #ffffff;
          color: #334155;
        }

        /* Media Row: Image & QR Code Side-by-Side */
        .media-container {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: stretch;
        }

        .image-card {
          flex: 2;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 14px;
          background: #f8fafc;
          text-align: center;
        }

        .image-card img {
          max-width: 100%;
          max-height: 140px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          background: #fff;
        }

        .qr-card {
          flex: 1.1;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          background: #f0fdf4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-left: 3.5px solid #16a34a;
        }

        .qr-card img {
          width: 120px;
          height: 120px;
          border-radius: 4px;
          border: 1px solid #bbf7d0;
          background: #fff;
          padding: 4px;
        }

        .qr-card p {
          margin: 6px 0 0 0;
          font-size: 11px;
          font-weight: 600;
          color: #166534;
          line-height: 1.3;
        }

        /* Signature Area */
        .signature-section {
          margin-top: 30px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }

        .sig-box {
          text-align: center;
          width: 240px;
        }

        .sig-dots {
          margin: 38px auto 6px auto;
          border-bottom: 1px dashed #64748b;
          width: 85%;
        }

        .sig-name {
          font-weight: 700;
          font-size: 13px;
          color: #1e293b;
        }

        .sig-pos {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .official-footer {
          margin-top: 22px;
          border-top: 1px solid #cbd5e1;
          padding-top: 6px;
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: #94a3b8;
        }

        @media print {
          body { 
            padding: 0; 
            margin: 0; 
          }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="memo-container">
        
        <!-- Header -->
        <div class="memo-top-header">
          <div class="memo-top-left">
            <img src="${emblemImg}" class="garuda-symbol" alt="Udompanya University Emblem" />
            <div class="org-title">
              <h2>Center for Library Resources & Educational Media</h2>
              <p>Library Management System • Udompanya University</p>
            </div>
          </div>
          <div class="memo-badge-box">
            <div class="memo-badge-title">OFFICIAL MEMORANDUM</div>
            <div class="memo-badge-sub">Maintenance & Repair Request Form</div>
          </div>
        </div>

        <!-- Official Reference Fields -->
        <div class="official-fields">
          <div class="field-row">
            <div class="field-col"><span class="label-bold">Division:</span> Information Resource Development & Service Section, Library Center, Tel. 0-2999-9999 Ext. 1102</div>
          </div>
          <div class="field-row">
            <div class="field-col"><span class="label-bold">Ref No.:</span> CLR.UP <strong>${item.id}</strong></div>
            <div class="field-col" style="text-align: right;"><span class="label-bold">Date:</span> ${item.date} (${item.time})</div>
          </div>
          <div class="field-row" style="margin-top: 2px;">
            <div class="field-col"><span class="label-bold">Subject:</span> Request for Maintenance and Repair Operations (${item.topic})</div>
          </div>
          <div class="field-row">
            <div class="field-col"><span class="label-bold">To:</span> Head / Coordinator of <strong>${item.externalUnit || 'External Department'}</strong></div>
          </div>
        </div>

        <!-- Subject Intro -->
        <div class="subject-intro">
          The <strong>Center for Library Resources and Educational Media</strong> has received a maintenance request regarding damages/issues within the library premises. Our staff has completed the on-site inspection and hereby forwards the details for your kind review and maintenance operation as follows:
        </div>

        <!-- Content Table -->
        <table class="content-table">
          <tr>
            <th>Complaint ID / Ref</th>
            <td><strong>${item.id}</strong> (Status: ${item.status})</td>
          </tr>
          <tr>
            <th>Priority Level</th>
            <td><strong style="color: ${item.priority === 'ด่วนที่สุด' ? '#dc2626' : item.priority === 'ด่วน' ? '#ea580c' : '#16a34a'};">${item.priority === 'ด่วนที่สุด' ? 'Critical (🔴 ด่วนที่สุด)' : item.priority === 'ด่วน' ? 'Urgent (🟠 ด่วน)' : 'Normal (🟢 ปกติ)'}</strong></td>
          </tr>
          <tr>
            <th>Topic / Issue Summary</th>
            <td><strong>${item.topic}</strong></td>
          </tr>
          <tr>
            <th>Category</th>
            <td>${item.category}</td>
          </tr>
          <tr>
            <th>Location / Zone</th>
            <td><strong>${item.location || '-'}</strong> (Library Premises)</td>
          </tr>
          <tr>
            <th>Damage Description</th>
            <td>${item.description}</td>
          </tr>
          <tr>
            <th>On-site Inspection Notes</th>
            <td>${item.inspectorReport || 'Inspected on-site by library staff; forwarded for professional repair.'}</td>
          </tr>
        </table>

        <!-- Media: Image + QR Code -->
        <div class="media-container">
          <div class="image-card">
            <div style="font-size: 11.5px; font-weight: 700; color: #12372F; margin-bottom: 4px;">
              Photo Evidence of Reported Issue
            </div>
            ${item.attached_image ? `
              <img src="${item.attached_image}" alt="Problem Photo Evidence" />
            ` : `
              <div style="padding: 18px 10px; color: #94a3b8; font-size: 11.5px; background: #ffffff; border-radius: 4px; border: 1px dashed #cbd5e1;">
                No photo attached in system
              </div>
            `}
          </div>

          <div class="qr-card">
            <img src="${qrCodeUrl}" alt="QR Code" />
            <p>
              Scan QR Code<br />
              to view high-res photo<br />
              & complaint details
            </p>
          </div>
        </div>

        <!-- Signature Area -->
        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-dots"></div>
            <div class="sig-name">( ${item.inspector_name || 'Somchai Rakdee'} )</div>
            <div class="sig-pos">Surveying & Reporting Officer</div>
            <div class="sig-pos">Information Resource Development Section</div>
          </div>

          <div class="sig-box">
            <div class="sig-dots"></div>
            <div class="sig-name">( ...................................................... )</div>
            <div class="sig-pos">Head of Information Resource Service Section</div>
            <div class="sig-pos">Approval & Forwarding Officer</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="official-footer">
          <div>Center for Library Resources and Educational Media (Library Management System) • Udompanya University</div>
          <div>Printed: ${new Date().toLocaleDateString('en-US')} • Internal University Coordination Document</div>
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
