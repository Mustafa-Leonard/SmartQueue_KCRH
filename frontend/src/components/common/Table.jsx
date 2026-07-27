import React from 'react';

const Table = ({ columns, headers, data, renderRow, emptyMessage = 'No records found.' }) => {
  const safeData = Array.isArray(data) ? data : [];

  // Determine th header titles from columns or headers prop
  const headerList = columns
    ? columns.map(c => (typeof c === 'string' ? c : c.header))
    : (headers || []);

  if (safeData.length === 0) {
    return (
      <div className="table-container">
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <table className="custom-table">
        <thead>
          <tr>
            {headerList.map((h, idx) => (
              <th key={idx}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRow
            ? safeData.map((row, idx) => renderRow(row, idx))
            : safeData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => {
                    const value = col.accessor ? row[col.accessor] : undefined;
                    return (
                      <td key={colIdx}>
                        {col.render ? col.render(value, row, rowIdx) : (value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
