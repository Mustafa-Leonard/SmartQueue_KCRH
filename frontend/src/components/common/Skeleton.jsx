import React from 'react';

const styles = {
  base: {
    background: 'linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 'var(--radius-sm)',
  },
  text: {
    height: 14,
    marginBottom: 8,
    width: '100%',
  },
  title: {
    height: 20,
    marginBottom: 12,
    width: '60%',
  },
  circle: (size = 40) => ({
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
  }),
  card: {
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-6)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 'var(--space-4)',
    padding: 'var(--space-3_5) var(--space-5)',
    borderBottom: '1px solid var(--color-border-light)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    flexShrink: 0,
  },
  badge: {
    height: 22,
    width: 70,
    borderRadius: 'var(--radius-full)',
  },
  button: {
    height: 38,
    width: 100,
    borderRadius: 'var(--radius-md)',
  },
};

/**
 * Skeleton loading placeholders for various use cases.
 *
 * Usage:
 *   <Skeleton variant="text" width="80%" />
 *   <Skeleton variant="card" rows={3} />
 *   <Skeleton variant="table" columns={4} rows={5} />
 *   <Skeleton variant="circle" size={48} />
 *   <Skeleton variant="avatar" />
 */
export default function Skeleton({ variant = 'text', width, height, size, rows = 1, columns = 3, count = 1, style, className }) {
  if (variant === 'card') {
    return (
      <div style={{ ...styles.card, ...style }} className={className}>
        <div style={{ ...styles.base, ...styles.title, width: '40%' }} />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ ...styles.base, ...styles.text, width: `${70 + Math.random() * 30}%` }} />
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ ...styles.base, ...styles.badge }} />
          <div style={{ ...styles.base, ...styles.badge, width: 50 }} />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ ...styles.tableRow, backgroundColor: 'var(--color-surface-2)' }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`h-${i}`} style={{ ...styles.base, height: 14, width: '80%' }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} style={styles.tableRow}>
            {Array.from({ length: columns }).map((_, c) => (
              <div key={`c-${c}`} style={{ ...styles.base, height: 12, width: `${50 + Math.random() * 50}%` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div style={{ ...styles.base, ...styles.circle(size || 40), ...style }} className={className} />
    );
  }

  if (variant === 'avatar') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }} className={className}>
        <div style={{ ...styles.base, ...styles.avatar }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...styles.base, ...styles.title, width: '50%' }} />
          <div style={{ ...styles.base, ...styles.text, width: '30%' }} />
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div style={{ ...styles.base, ...styles.button, ...style }} className={className} />
    );
  }

  // Default: variant === 'text'
  if (count > 1) {
    return (
      <div style={style} className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.base,
              ...styles.text,
              width: width || `${85 - i * 10}%`,
              height: height || 14,
              marginBottom: i < count - 1 ? 8 : 0,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.base,
        ...styles.text,
        width: width || '100%',
        height: height || 14,
        ...style,
      }}
      className={className}
    />
  );
}

/**
 * SkeletonCard — a full card placeholder with header and body
 */
export function SkeletonCard({ rows = 3, style }) {
  return <Skeleton variant="card" rows={rows} style={style} />;
}

/**
 * SkeletonTable — a full table placeholder
 */
export function SkeletonTable({ rows = 5, columns = 4, style }) {
  return <Skeleton variant="table" rows={rows} columns={columns} style={style} />;
}

/**
 * SkeletonAvatar — avatar with text lines
 */
export function SkeletonAvatar({ style }) {
  return <Skeleton variant="avatar" style={style} />;
}

/**
 * SkeletonPage — full page loading state
 */
export function SkeletonPage({ sections = 2, tableRows = 5 }) {
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Skeleton variant="text" width="180px" height={24} />
          <Skeleton variant="text" width="300px" height={14} style={{ marginTop: 8 }} />
        </div>
        <Skeleton variant="button" />
      </div>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" rows={2} />
        ))}
      </div>
      {/* Table */}
      <Skeleton variant="table" rows={tableRows} columns={4} />
      {/* Extra sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={`sec-${i}`} style={{ marginTop: 24 }}>
          <Skeleton variant="text" width="200px" height={18} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} variant="card" rows={2} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

