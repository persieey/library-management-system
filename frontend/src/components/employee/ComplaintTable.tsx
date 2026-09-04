import React from 'react';
import type { DisplayComplaint } from '../../interface/complaint';
import { getStatusClass } from '../../constants/complaintConstants';

interface ComplaintTableProps {
  complaints: DisplayComplaint[];
  loading: boolean;
  errorMessage: string;
  selectedItem: DisplayComplaint | null;
  onSelectItem: (item: DisplayComplaint) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  loading,
  errorMessage,
  selectedItem,
  onSelectItem,
}) => {
  return (
    <div className="table-wrapper">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading complaints from database...
        </div>
      ) : errorMessage ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          {errorMessage}
        </div>
      ) : (
        <table className="complaint-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>ID</th>
              <th>Topic</th>
              <th style={{ width: '18%' }}>Category</th>
              <th style={{ width: '16%' }}>Date / Time</th>
              <th style={{ width: '16%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length > 0 ? (
              complaints.map((item) => {
                const isSelected = selectedItem?.complaint_id === item.complaint_id;
                return (
                  <tr
                    key={item.complaint_id}
                    className={isSelected ? 'selected-row' : ''}
                    onClick={() => onSelectItem(item)}
                  >
                    <td><strong>{item.id}</strong></td>
                    <td><strong>{item.topic}</strong></td>
                    <td>{item.category}</td>
                    <td>
                      <div>{item.date}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.time}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No complaints found in this view
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
