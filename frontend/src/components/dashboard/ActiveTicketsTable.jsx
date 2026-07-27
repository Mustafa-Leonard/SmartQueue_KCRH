import React from 'react';
import Table from '../common/Table.jsx';
import Badge from '../common/Badge.jsx';
import { formatTime } from '../../utils/formatters.js';

const ActiveTicketsTable = ({ tickets = [] }) => {
  const headers = ['Ticket #', 'Patient Name', 'Clinical Service', 'Counter Assigned', 'Time Joined', 'Status'];

  const getStatusVariant = (status) => {
    switch (status) {
      case 'WAITING': return 'primary';
      case 'CALLED': return 'warning';
      case 'SERVING': return 'success';
      default: return 'neutral';
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>
        Active Clinical Session Activity
      </h2>
      <Table
        headers={headers}
        data={tickets}
        emptyMessage="No active tickets in queue at the moment."
        renderRow={(ticket) => (
          <tr key={ticket.id}>
            <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{ticket.ticketNumber}</td>
            <td>{ticket.customer?.name}</td>
            <td>{ticket.service?.name}</td>
            <td>{ticket.counter?.name || <span style={{ color: 'var(--color-text-muted)' }}>Not Assigned</span>}</td>
            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(ticket.createdAt)}</td>
            <td>
              <Badge variant={getStatusVariant(ticket.status)}>
                {ticket.status}
              </Badge>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default ActiveTicketsTable;
