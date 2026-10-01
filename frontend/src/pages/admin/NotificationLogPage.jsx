import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import * as notificationApi from '../../api/notificationApi.js';
import { RefreshIcon, PhoneIcon, MailIcon, CheckCircleIcon, CrossIcon } from '../../components/common/Icons.jsx';
import { extractArray, extractData } from '../../utils/apiUtils.js';
import { formatDateTime } from '../../utils/formatters.js';
import Button from '../../components/common/Button.jsx';
import PaginationControls from '../../components/common/PaginationControls.jsx';

export default function NotificationLogPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications({ type: typeFilter, status: statusFilter, page, limit: 20 });
      const payload = extractData(data);
      setNotifications(payload?.notifications || extractArray(data, 'notifications'));
      setPagination(payload?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to load notification log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, [typeFilter, statusFilter, page]);

  const statusVariants = { SENT: 'success', DELIVERED: 'success', SIMULATED: 'info', FAILED: 'error', DISABLED: 'default', READ: 'default' };
  const typeIcons = { SMS: <PhoneIcon size={14} />, EMAIL: <MailIcon size={14} /> };

  const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  const columns = [
    {
      header: 'Type',
      accessor: 'type',
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
          {typeIcons[val] || null} {val}
        </span>
      )
    },
    { header: 'Recipient', accessor: 'recipient' },
    { header: 'Subject', accessor: 'subject', render: (val) => val || '--' },
    {
      header: 'Message',
      accessor: 'message',
      render: (val) => <span style={{ fontSize: '0.85rem', maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <Badge variant={statusVariants[val]}>{val}</Badge>
    },
    {
      header: 'Sent At',
      accessor: 'createdAt',
      render: (val) => <span style={{ fontSize: '0.85rem' }}>{formatDateTime(val)}</span>
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notification Log</h1>
          <p>Track all SMS and email messages sent by the system</p>
        </div>
        <Button variant="secondary" onClick={loadNotifications} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Type:</span>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">All Types</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Status:</span>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="SIMULATED">Simulated</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
        ) : (
          <Table columns={columns} data={notifications} />
        )}
      </Card>
      <PaginationControls page={page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
    </div>
  );
}
