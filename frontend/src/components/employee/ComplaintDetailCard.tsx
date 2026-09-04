import React, { useState, useEffect, useRef } from 'react';
import type { DisplayComplaint } from '../../interface/complaint';
import { COMPLAINT_STATUS, getStatusClass, getPriorityInfo } from '../../constants/complaintConstants';

interface ComplaintDetailCardProps {
  selectedItem: DisplayComplaint;
  activeTab: 'box' | 'pending' | 'verify';
  isProcessing: boolean;
  isManager?: boolean;
  onUpdateStatus: (newStatus: string, extraData?: any) => Promise<void>;
  onOpenImagePreview: (imageUrl: string, title: string) => void;
  onDownloadPDF: (item: DisplayComplaint) => void;
}

export const ComplaintDetailCard: React.FC<ComplaintDetailCardProps> = ({
  selectedItem,
  activeTab,
  isProcessing,
  isManager = false,
  onUpdateStatus,
  onOpenImagePreview,
  onDownloadPDF,
}) => {
  const [inspectorReportInput, setInspectorReportInput] = useState<string>('');
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [externalUnitInput, setExternalUnitInput] = useState<string>('');
  const [resolutionSummaryInput, setResolutionSummaryInput] = useState<string>('');
  const [resolutionImageInput, setResolutionImageInput] = useState<string>('');

  const resolutionFileRef = useRef<HTMLInputElement>(null);

  // Sync inputs when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setInspectorReportInput(selectedItem.inspectorReport || '');
      setRejectReasonInput(selectedItem.rejectReason || '');
      setExternalUnitInput(
        selectedItem.externalUnit && selectedItem.externalUnit !== '-'
          ? selectedItem.externalUnit
          : ''
      );
      setResolutionSummaryInput(selectedItem.resolutionSummary || '');
      setResolutionImageInput(selectedItem.resolutionImage || '');
    } else {
      setInspectorReportInput('');
      setRejectReasonInput('');
      setExternalUnitInput('');
      setResolutionSummaryInput('');
      setResolutionImageInput('');
    }
  }, [selectedItem]);

  const handleResolutionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const priorityInfo = getPriorityInfo(selectedItem.priority);

  return (
    <div className="details-card">
      <div className="details-header">
        <div className="details-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <h3>{selectedItem.id}</h3>
            <span className={`priority-tag ${priorityInfo.className}`}>
              {priorityInfo.label}
            </span>
          </div>
          <span className={`status-badge ${getStatusClass(selectedItem.status)}`}>
            {selectedItem.status}
          </span>
        </div>
        <div className="info-box">
          <div className="info-item">
            <span>Category</span>
            <strong>{selectedItem.category}</strong>
          </div>
          <div className="info-item">
            <span>Location</span>
            <strong>{selectedItem.location || '-'}</strong>
          </div>
          <div className="info-item">
            <span>Reported Date</span>
            <strong>{selectedItem.date} {selectedItem.time}</strong>
          </div>
        </div>
      </div>

      <div className="details-body">
        <h4>{selectedItem.topic}</h4>
        <p className="description-text">{selectedItem.description}</p>

        {/* Photo View Buttons */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {selectedItem.attached_image ? (
            <button
              type="button"
              className="img-btn"
              onClick={() =>
                onOpenImagePreview(
                  selectedItem.attached_image || '',
                  `Problem Photo Evidence (${selectedItem.id})`
                )
              }
            >
              📷 View Attached Photo Evidence
            </button>
          ) : (
            <button
              type="button"
              className="img-btn"
              style={{ opacity: 0.6, cursor: 'default' }}
            >
              📷 No Photo Evidence Attached
            </button>
          )}

          {selectedItem.resolution_image && (
            <button
              type="button"
              className="img-btn"
              style={{ backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#166534' }}
              onClick={() =>
                onOpenImagePreview(
                  selectedItem.resolution_image || '',
                  `Resolution Photo Evidence (${selectedItem.id})`
                )
              }
            >
              ✓ View Resolution Photo
            </button>
          )}
        </div>

        {/* ==============================================================
            CASE 1: Completed Case (Read-Only)
        ============================================================== */}
        {selectedItem.status === COMPLAINT_STATUS.COMPLETED && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '8px',
              padding: '1.5rem',
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#166534',
                fontWeight: 700,
                fontSize: '1.1rem',
                marginBottom: '0.8rem',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>✓</span> Issue Completed & Resolved (Case Closed)
            </div>
            <div style={{ marginBottom: '0.6rem', color: '#334155', fontSize: '0.95rem' }}>
              <strong>Assigned Department:</strong> {selectedItem.externalUnit || 'Internal Handling'}
            </div>
            <div style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <strong>Resolution Summary:</strong>
              <p
                style={{
                  margin: '0.4rem 0 0 0',
                  backgroundColor: '#ffffff',
                  padding: '0.8rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #dcfce7',
                }}
              >
                {selectedItem.resolutionSummary || 'Maintenance completed and tested successfully.'}
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            CASE 2: Cancelled Case (Read-Only)
        ============================================================== */}
        {selectedItem.status === COMPLAINT_STATUS.CANCELLED && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: '8px',
              padding: '1.5rem',
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#991b1b',
                fontWeight: 700,
                fontSize: '1.1rem',
                marginBottom: '0.8rem',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>✕</span> This complaint has been cancelled / rejected
            </div>
            <div style={{ color: '#334155', fontSize: '0.95rem' }}>
              <strong>Cancellation Reason:</strong>
              <p
                style={{
                  margin: '0.4rem 0 0 0',
                  backgroundColor: '#ffffff',
                  padding: '0.8rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #fee2e2',
                }}
              >
                {selectedItem.rejectReason || 'Does not meet university library criteria.'}
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            CASE 3: Active Cases (Interactive Forms)
        ============================================================== */}
        {selectedItem.status !== COMPLAINT_STATUS.COMPLETED &&
          selectedItem.status !== COMPLAINT_STATUS.CANCELLED && (
            <>
              {/* --- TAB 1: Inbox (On-site Inspection) --- */}
              {activeTab === 'box' && (
                <>
                  {selectedItem.status === COMPLAINT_STATUS.PENDING_INSPECTION ? (
                    <>
                      <div className="form-group">
                        <label>On-site Inspection Notes / Assessment (Staff):</label>
                        <textarea
                          rows={3}
                          placeholder="Describe on-site inspection findings, damages, and required repairs..."
                          value={inspectorReportInput}
                          onChange={(e) => setInspectorReportInput(e.target.value)}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>Rejection / Cancellation Reason (If not approved):</label>
                        <input
                          type="text"
                          className="full-input"
                          placeholder="e.g. Invalid request, against energy saving policy"
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                        />
                      </div>

                      <div className="action-row" style={{ gap: '1rem' }}>
                        <button
                          className="btn-reject"
                          disabled={isProcessing}
                          onClick={() =>
                            onUpdateStatus(COMPLAINT_STATUS.CANCELLED, {
                              reject_reason: rejectReasonInput,
                            })
                          }
                        >
                          ✕ Reject Complaint
                        </button>
                        <button
                          className="submit-action-btn"
                          disabled={isProcessing}
                          onClick={() =>
                            onUpdateStatus(COMPLAINT_STATUS.AWAITING_SUPERVISOR, {
                              inspector_report: inspectorReportInput,
                            })
                          }
                        >
                          {isProcessing ? 'Saving...' : '✓ Submit Inspection & Forward to Supervisor'}
                        </button>
                      </div>
                    </>
                  ) : selectedItem.status === COMPLAINT_STATUS.AWAITING_SUPERVISOR ? (
                    <div
                      style={{
                        backgroundColor: '#faf5ff',
                        border: '1.5px solid #d8b4fe',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginTop: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          color: '#7e22ce',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          marginBottom: '0.8rem',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>🕒</span> Forwarded to Supervisor (Pending Approval)
                      </div>
                      <div style={{ color: '#334155', fontSize: '0.95rem' }}>
                        <strong>On-site Inspection Notes:</strong>
                        <p
                          style={{
                            margin: '0.4rem 0 0 0',
                            backgroundColor: '#ffffff',
                            padding: '0.8rem 1rem',
                            borderRadius: '6px',
                            border: '1px solid #f3e8ff',
                          }}
                        >
                          {selectedItem.inspectorReport || 'Inspected on-site by staff.'}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* --- TAB 2: Pending Approval (Supervisor / Forwarding) --- */}
              {activeTab === 'pending' && (
                <>
                  {selectedItem.status === COMPLAINT_STATUS.AWAITING_SUPERVISOR ? (
                    <>
                      <div className="form-group">
                        <label>Inspection Report from Staff:</label>
                        <p
                          style={{
                            background: '#f8fafc',
                            padding: '0.8rem',
                            borderRadius: '6px',
                            margin: 0,
                            color: '#334155',
                          }}
                        >
                          {selectedItem.inspectorReport || 'No inspection notes recorded.'}
                        </p>
                      </div>

                      <div className="form-group">
                        <label>Forward to External Department / Contractor:</label>
                        <select
                          className="full-input"
                          value={externalUnitInput}
                          onChange={(e) => setExternalUnitInput(e.target.value)}
                        >
                          <option value="">-- Do not forward (Handle Internally) --</option>
                          <option value="กองอาคารสถานที่">Division of Buildings & Grounds (กองอาคารสถานที่)</option>
                          <option value="ศูนย์คอมพิวเตอร์">Computer & Network Center (ศูนย์คอมพิวเตอร์)</option>
                          <option value="งานเทคโนโลยีการศึกษา">Educational Technology Unit (งานเทคโนโลยีการศึกษา)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Rejection / Cancellation Reason (If not approved):</label>
                        <input
                          type="text"
                          className="full-input"
                          placeholder="Specify reason, e.g. Insufficient budget, out of service scope"
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                        />
                      </div>

                      {isManager ? (
                        <div className="action-row" style={{ gap: '1rem' }}>
                          <button
                            className="btn-reject"
                            disabled={isProcessing}
                            onClick={() =>
                              onUpdateStatus(COMPLAINT_STATUS.CANCELLED, {
                                reject_reason: rejectReasonInput,
                              })
                            }
                          >
                            ✕ Reject Complaint
                          </button>
                          <button
                            className="submit-action-btn"
                            disabled={isProcessing}
                            onClick={() => {
                              if (externalUnitInput) {
                                onUpdateStatus(COMPLAINT_STATUS.COORDINATING, {
                                  external_unit: externalUnitInput,
                                });
                              } else {
                                onUpdateStatus(COMPLAINT_STATUS.IN_PROGRESS);
                              }
                            }}
                          >
                            {isProcessing ? 'Saving...' : '✓ Approve & Start Operations (หัวหน้าอนุมัติ)'}
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: '#fffbeb',
                            border: '1.5px solid #fde68a',
                            borderRadius: '8px',
                            padding: '1rem 1.2rem',
                            marginTop: '1rem',
                            color: '#92400e',
                            fontSize: '0.95rem',
                          }}
                        >
                          <strong>🔒 สิทธิ์พนักงานทั่วไป (Staff / Librarian):</strong> คำร้องนี้ส่งต่อถึงหัวหน้างานแล้ว เฉพาะผู้มีตำแหน่ง <strong>หัวหน้าเจ้าหน้าที่ (Manager)</strong> เท่านั้นที่สามารถกดอนุมัติหรือสั่งการเริ่มงานได้
                        </div>
                      )}
                    </>
                  ) : selectedItem.status === COMPLAINT_STATUS.COORDINATING ? (
                    <div
                      style={{
                        backgroundColor: '#f0f9ff',
                        border: '1.5px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginTop: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          color: '#0369a1',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          marginBottom: '0.8rem',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>✓</span> Approved and Forwarded to External Department
                      </div>
                      <div style={{ color: '#334155', fontSize: '0.95rem' }}>
                        <strong>Coordinating Unit:</strong> {selectedItem.externalUnit || 'Internal Handling'}
                      </div>

                      <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          type="button"
                          className="btn-download-pdf"
                          onClick={() => onDownloadPDF(selectedItem)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="8" y1="13" x2="16" y2="13"></line>
                            <line x1="8" y1="17" x2="16" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Download Official Memorandum (PDF)
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* --- TAB 3: Task Verification (Close Case) --- */}
              {activeTab === 'verify' && (
                <>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <label>Assigned Department / Contractor:</label>
                        <p style={{ fontWeight: 600, color: '#1e293b', margin: '0.2rem 0 0 0' }}>
                          {selectedItem.externalUnit || 'Internal Handling'}
                        </p>
                      </div>
                      {selectedItem.externalUnit && selectedItem.externalUnit !== '-' && (
                        <button
                          type="button"
                          className="btn-download-pdf"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => onDownloadPDF(selectedItem)}
                        >
                          📄 Print Official Memorandum (PDF)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Resolution Summary / Actions Taken *:</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Replaced damaged parts, restored AC functionality and tested operation..."
                      value={resolutionSummaryInput}
                      onChange={(e) => setResolutionSummaryInput(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Attach After-Repair Photo Evidence (Optional):</label>
                    <input
                      type="file"
                      ref={resolutionFileRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleResolutionImageChange}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        type="button"
                        className="img-btn"
                        onClick={() => resolutionFileRef.current?.click()}
                      >
                        📷 {resolutionImageInput ? 'Change Resolution Photo' : 'Upload Resolution Photo'}
                      </button>
                      {resolutionImageInput && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img
                            src={resolutionImageInput}
                            alt="resolution-preview"
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
                            Photo Attached
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="action-row">
                    <button
                      className="submit-action-btn"
                      style={{ backgroundColor: '#16a34a' }}
                      disabled={isProcessing}
                      onClick={() =>
                        onUpdateStatus(COMPLAINT_STATUS.COMPLETED, {
                          resolution_summary: resolutionSummaryInput,
                          resolution_image: resolutionImageInput,
                        })
                      }
                    >
                      {isProcessing ? 'Saving...' : '★ Verify & Close Case'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
      </div>
    </div>
  );
};
