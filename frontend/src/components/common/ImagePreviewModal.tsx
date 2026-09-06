import React from 'react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
      }}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h4 style={{ margin: 0, color: '#12372F', fontSize: '1.1rem', fontWeight: 700 }}>
            {title || 'ดูรูปภาพ'}
          </h4>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            &times;
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxHeight: '70vh',
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
          }}
        >
          <img
            src={imageUrl}
            alt="Full preview"
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  );
};
