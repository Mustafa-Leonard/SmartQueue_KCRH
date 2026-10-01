import React from 'react';
import Button from './Button.jsx';

export default function PaginationControls({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
        Showing {firstItem}-{lastItem} of {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <span aria-live="polite" style={{ minWidth: '5rem', textAlign: 'center', fontSize: '0.8rem' }}>
          Page {page} of {pages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>
          Next
        </Button>
      </div>
    </nav>
  );
}