import React from 'react';

interface EmployeeSidebarProps {
  activeTab: 'box' | 'pending' | 'verify';
  countBox: number;
  countPending: number;
  countVerify: number;
  isManager?: boolean;
  onTabChange: (tab: 'box' | 'pending' | 'verify') => void;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  activeTab,
  countBox,
  countPending,
  countVerify,
  isManager = false,
  onTabChange,
}) => {
  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        <li
          className={activeTab === 'box' ? 'active' : ''}
          onClick={() => onTabChange('box')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Inbox</span>
          </div>
          {countBox > 0 && <span className="sidebar-badge badge-warning">{countBox}</span>}
        </li>

        {/* Show Pending Approval tab ONLY for Manager / Supervisor */}
        {isManager && (
          <li
            className={activeTab === 'pending' ? 'active' : ''}
            onClick={() => onTabChange('pending')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Pending Approval (หัวหน้า)</span>
            </div>
            {countPending > 0 && <span className="sidebar-badge badge-purple">{countPending}</span>}
          </li>
        )}

        <li
          className={activeTab === 'verify' ? 'active' : ''}
          onClick={() => onTabChange('verify')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Task Verification</span>
          </div>
          {countVerify > 0 && <span className="sidebar-badge badge-blue">{countVerify}</span>}
        </li>
      </ul>
    </aside>
  );
};
