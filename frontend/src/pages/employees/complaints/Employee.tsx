import React, { useState, useEffect, useCallback } from 'react';
import { complaintService } from '../../../services/complaintService';
import type { DisplayComplaint } from '../../../interface/complaint';
import { COMPLAINT_STATUS, STATUS_MAP } from '../../../constants/complaintConstants';
import { generateComplaintPDF } from '../../../utils/pdfGenerator';
import { ComplaintTable } from '../../../components/employee/ComplaintTable';
import { ComplaintDetailCard } from '../../../components/employee/ComplaintDetailCard';
import { EmployeeSidebar } from '../../../components/employee/EmployeeSidebar';
import { ImagePreviewModal } from '../../../components/common/ImagePreviewModal';
import { useAuth } from '../../../auth/teammateAuth';
import './Employee.css';
import BackOfficeLayout from '../../../components/BackOfficeLayout';

export default function Employee(): React.JSX.Element {
  const { user, isManager, isEmployee, switchToRole } = useAuth();
  const [complaints, setComplaints] = useState<DisplayComplaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'box' | 'pending' | 'verify'>('box');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('All');

  const [selectedItem, setSelectedItem] = useState<DisplayComplaint | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Image Preview Modal state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Fetch complaints from Backend API
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintService.getAll();

      // Normalize fields for display
      const normalizedData: DisplayComplaint[] = data.map((item) => ({
        ...item,
        id: item.complaint_id,
        date: item.submit_date || '20 ก.ค 2569',
        time: item.submit_time || '12.00 น.',
        priority: item.priority || 'ปกติ',
        inspectorReport: item.inspector_report || '',
        rejectReason: item.reject_reason || '',
        resolutionSummary: item.resolution_summary || '',
        resolutionImage: item.resolution_image || '',
        externalUnit: item.department_name || (item.department_id ? 'กองอาคารสถานที่' : '-'),
      }));

      setComplaints(normalizedData);
      setSelectedItem((prev) => {
        if (!prev) return null;
        const found = normalizedData.find((x) => x.complaint_id === prev.complaint_id);
        return found || null;
      });
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // พาผู้ใช้ไปแท็บที่ตัวเองมีสิทธิ์เสมอ ทั้งตอนเปิดหน้าและตอนสิทธิ์เปลี่ยน
  useEffect(() => {
    if (!isManager && activeTab === 'pending') {
      setActiveTab('box');
    }
    // หัวหน้าไม่มีแท็บ Inbox แล้ว เปิดมาให้อยู่กล่องที่รอเขาพิจารณาเลย
    if (isManager && activeTab === 'box') {
      setActiveTab('pending');
    }
  }, [isManager, activeTab]);

  const handleTabChange = (tab: 'box' | 'pending' | 'verify') => {
    setActiveTab(tab);
    setActiveFilter('All');
    setSearchQuery('');
    setFilterMonth('All');
    setSelectedItem(null);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setSelectedItem(null);
  };

  // Filter complaints per tab
  const getTabFilteredData = () => {
    if (activeTab === 'box') {
      return complaints.filter((item) =>
        [
          COMPLAINT_STATUS.PENDING_INSPECTION,
          COMPLAINT_STATUS.AWAITING_SUPERVISOR,
          COMPLAINT_STATUS.CANCELLED,
        ].includes(item.status as any)
      );
    }
    if (activeTab === 'pending') {
      return complaints.filter((item) =>
        [
          COMPLAINT_STATUS.AWAITING_SUPERVISOR,
          COMPLAINT_STATUS.COORDINATING,
          COMPLAINT_STATUS.CANCELLED,
        ].includes(item.status as any)
      );
    }
    return complaints.filter((item) =>
      [
        COMPLAINT_STATUS.IN_PROGRESS,
        'กำลังดำเนินการ',
        COMPLAINT_STATUS.COORDINATING,
        COMPLAINT_STATUS.COMPLETED,
      ].includes(item.status as any)
    );
  };

  const sourceData = getTabFilteredData();
  let finalFilteredData = sourceData;

  // Filter by status pill
  if (activeFilter !== 'All') {
    const targetStatus = STATUS_MAP[activeFilter] || activeFilter;
    finalFilteredData = finalFilteredData.filter(
      (item) => item.status === targetStatus || item.status === activeFilter
    );
  }

  // Filter by month
  if (filterMonth !== 'All') {
    finalFilteredData = finalFilteredData.filter((item) =>
      (item.date || '').includes(filterMonth)
    );
  }

  // Filter by search query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    finalFilteredData = finalFilteredData.filter(
      (item) =>
        (item.id || '').toLowerCase().includes(q) ||
        (item.topic || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
    );
  }

  // Auto-clear selectedItem if it is no longer in the filtered table
  useEffect(() => {
    if (selectedItem) {
      const isStillInFilter = finalFilteredData.some(
        (x) => x.complaint_id === selectedItem.complaint_id
      );
      if (!isStillInFilter) {
        setSelectedItem(null);
      }
    }
  }, [finalFilteredData, selectedItem]);

  // API Action: Update complaint status
  const updateComplaintStatus = async (newStatus: string, extraData: any = {}) => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await complaintService.update(selectedItem.complaint_id, {
        status: newStatus,
        ...extraData,
      });

      setSelectedItem(null);
      await fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsProcessing(false);
    }
  };

  const countBox = complaints.filter(
    (c) => c.status === COMPLAINT_STATUS.PENDING_INSPECTION
  ).length;
  const countPending = complaints.filter(
    (c) => c.status === COMPLAINT_STATUS.AWAITING_SUPERVISOR
  ).length;
  const countVerify = complaints.filter((c) =>
    [COMPLAINT_STATUS.IN_PROGRESS, COMPLAINT_STATUS.COORDINATING].includes(c.status as any)
  ).length;

  return (
    <BackOfficeLayout title="เรื่องร้องเรียน">
      <div className="employee-content-wrapper">
        {/* 1. Left Sidebar Navigation */}
        <EmployeeSidebar
          activeTab={activeTab}
          countBox={countBox}
          countPending={countPending}
          countVerify={countVerify}
          isManager={isManager}
          onTabChange={handleTabChange}
        />

        {/* 2. Main Dashboard Area */}
        <main className="dashboard-container">
          {!isEmployee && (
            <div
              style={{
                backgroundColor: '#fef3c7',
                border: '1.5px solid #f59e0b',
                borderRadius: '8px',
                padding: '0.8rem 1.2rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#92400e',
              }}
            >
              <span>
                🔒 <strong>สิทธิ์ปัจจุบัน: {user?.name}</strong> (หน้านี้สำหรับเจ้าหน้าที่ห้องสมุด คุณกำลังดูในโหมดจำลอง)
              </span>
              <button
                onClick={() => switchToRole('manager')}
                style={{
                  background: '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                สลับเป็นหัวหน้า (Manager)
              </button>
            </div>
          )}

          {/* Controls: Pills & Search */}
          <div className="dashboard-controls">
            <div className="filter-pills">
              {activeTab === 'box' && (
                <>
                  <button className={`pill ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => handleFilterChange('All')}>ทั้งหมด</button>
                  <button className={`pill ${activeFilter === 'Pending Inspection' ? 'active' : ''}`} onClick={() => handleFilterChange('Pending Inspection')}>รอตรวจสอบ</button>
                  <button className={`pill ${activeFilter === 'Awaiting Supervisor' ? 'active' : ''}`} onClick={() => handleFilterChange('Awaiting Supervisor')}>รอหัวหน้าพิจารณา</button>
                  <button className={`pill ${activeFilter === 'Cancelled' ? 'active' : ''}`} onClick={() => handleFilterChange('Cancelled')}>ยกเลิก</button>
                </>
              )}

              {activeTab === 'pending' && (
                <>
                  <button className={`pill ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => handleFilterChange('All')}>ทั้งหมด</button>
                  <button className={`pill ${activeFilter === 'Awaiting Supervisor' ? 'active' : ''}`} onClick={() => handleFilterChange('Awaiting Supervisor')}>รอหัวหน้าพิจารณา</button>
                  <button className={`pill ${activeFilter === 'Coordinating' ? 'active' : ''}`} onClick={() => handleFilterChange('Coordinating')}>ประสานงาน</button>
                  <button className={`pill ${activeFilter === 'Cancelled' ? 'active' : ''}`} onClick={() => handleFilterChange('Cancelled')}>ยกเลิก</button>
                </>
              )}

              {activeTab === 'verify' && (
                <>
                  <button className={`pill ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => handleFilterChange('All')}>ทั้งหมด</button>
                  <button className={`pill ${activeFilter === 'In Progress' ? 'active' : ''}`} onClick={() => handleFilterChange('In Progress')}>กำลังดำเนินงาน</button>
                  <button className={`pill ${activeFilter === 'Coordinating' ? 'active' : ''}`} onClick={() => handleFilterChange('Coordinating')}>ประสานงาน</button>
                  <button className={`pill ${activeFilter === 'Completed' ? 'active' : ''}`} onClick={() => handleFilterChange('Completed')}>เสร็จสิ้น</button>
                </>
              )}
            </div>

            <div className="search-filter-row">
              <div className="search-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="ค้นหาจากรหัส เรื่อง หรือหมวดหมู่..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="date-filter-box">
                <span>เดือน: </span>
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                  <option value="All">ทั้งหมด</option>
                  <option value="ส.ค">สิงหาคม</option>
                  <option value="ก.ค">กรกฎาคม</option>
                  <option value="มิ.ย">มิถุนายน</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Complaints Table Component */}
          <ComplaintTable
            complaints={finalFilteredData}
            loading={loading}
            errorMessage={errorMessage}
            selectedItem={selectedItem}
            onSelectItem={(item) => setSelectedItem(item)}
          />

          {/* 4. Details & Action Card Component */}
          {selectedItem && (
            <ComplaintDetailCard
              selectedItem={selectedItem}
              activeTab={activeTab}
              isProcessing={isProcessing}
              isManager={isManager}
              onUpdateStatus={updateComplaintStatus}
              onOpenImagePreview={(imgUrl, title) => {
                setPreviewImage(imgUrl);
                setPreviewTitle(title);
              }}
              onDownloadPDF={generateComplaintPDF}
            />
          )}
        </main>
      </div>

      {/* 5. Image Preview Modal Component */}
      <ImagePreviewModal
        imageUrl={previewImage}
        title={previewTitle}
        onClose={() => setPreviewImage(null)}
      />
    </BackOfficeLayout>
  );
}