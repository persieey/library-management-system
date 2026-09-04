import React from 'react';
import './StatsSidebar.css';

export type StatsMenuItem =
  | 'Overview'
  | 'Top 10 Popular Books'
  | 'Book Return Statistics'
  | 'Study Room Usage'
  | 'E-Book Search Statistics'
  | 'Equipment Rental Stats'
  | 'Complaint Statistics';

export interface MenuItemConfig {
  id: StatsMenuItem;
  label: string;
  icon: React.ReactNode;
}

interface StatsSidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: StatsMenuItem) => void;
}

export const STATS_MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'Overview',
    label: 'Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    id: 'Top 10 Popular Books',
    label: 'Top 10 Popular Books',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
  },
  {
    id: 'Book Return Statistics',
    label: 'Book Return Statistics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
  },
  {
    id: 'Study Room Usage',
    label: 'Study Room Usage',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
    ),
  },
  {
    id: 'E-Book Search Statistics',
    label: 'E-Book Search Statistics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    ),
  },
  {
    id: 'Equipment Rental Stats',
    label: 'Equipment Rental Stats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
  },
  {
    id: 'Complaint Statistics',
    label: 'Complaint Statistics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  },
];

export const StatsSidebar: React.FC<StatsSidebarProps> = ({
  activeMenu,
  onSelectMenu,
}) => {
  return (
    <aside className="stats-sidebar">
      <ul className="stats-sidebar-menu">
        {STATS_MENU_ITEMS.map((item) => (
          <li
            key={item.id}
            className={activeMenu === item.id ? 'active' : ''}
            onClick={() => onSelectMenu(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
