import React, { useState, useEffect, useCallback, useContext } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import * as auditApi from '../../api/auditApi.js';
import { SocketContext } from '../../context/SocketContext.jsx';
import { SearchIcon, DownloadIcon, RefreshIcon, FilterIcon, ClockIcon, EyeIcon, CrossIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';
import { formatDate, formatTime, formatDateTime } from '../../utils/formatters.js';

const ACTION_COLORS = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'primary',
  LOGOUT: 'default',
  TRANSFER: 'warning',
  CALL: 'accent',
  COMPLETE: 'success',
  CANCEL: 'error',
  PAUSE: 'warning',
  RESUME: 'success',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [showLiveFeed, setShowLiveFeed] = useState(false);

  const { socket, connected } = useContext(SocketContext);

  // Subscribe to real-time audit log events
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewLog = (newLog) => {
      // Prepend to live feed (max 50)
      setLiveFeed(prev => {
        const updated = [newLog, ...prev];
        return updated.slice(0, 50);
      });
      // Show a toast notification
      toast(
        (t) => (
          <div style={{ fontSize: '0.8125rem' }}>
            <strong style={{ color: ACTION_COLORS[newLog.action] === 'error' ? 'var(--color-error)' : 'var(--color-primary)' }}>
              {newLog.action}
            </strong>
            {' '}on <strong>{newLog.entity}</strong>
            {newLog.user?.name ? <> by <em>{newLog.user.name}</em></> : ''}
          </div>
        ),
        { duration: 4000, position: 'bottom-right' }
      );
    };

    socket.on('audit:new_log', handleNewLog);

    return () => {
      socket.off('audit:new_log', handleNewLog);
    };
  }, [socket, connected]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter, dateFrom, dateTo]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditApi.getAuditLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 50
      });
      const list = extractArray(res, 'logs');
      setLogs(list);
      setTotalPages(res?.data?.totalPages || 1);
      setTotalCount(res?.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setEntityFilter('');
    setSearchInput('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
  };

  const handleExport = () => {
    if (logs.length === 0) { toast.error('No data to export'); return; }
    const headers = 'Timestamp,User,Action,Entity,Entity ID,IP Address,Details\n';
    const rows = logs.map(l => {
      const details = l.details ? JSON.stringify(l.details).replace(/"/g, '""') : '';
      return `${new Date(l.createdAt).toISOString()},${l.user?.name || 'System'},${l.action},${l.entity},${l.entityId || ''},${l.ipAddress || ''},"${details}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  const renderDetails = (details) => {
    if (!details) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
    let parsed = details;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return <span style={{ fontSize: '0.8rem' }}>{details}</span>; }
    }
    if (typeof parsed !== 'object') return <span style={{ fontSize: '0.8rem' }}>{String(parsed)}</span>;
    const entries = Object.entries(parsed).slice(0, 3);
    const summary = entries.map(([k, v]) => `${k}: ${v}`).join(', ');
    return (
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
        {summary}{Object.keys(parsed).length > 3 ? '...' : ''}
      </span>
    );
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: (val) => (
        <div style={{ fontSize: '0.85rem' }}>
          <div>{formatDate(val)}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ClockIcon size={10} /> {formatTime(val)}
          </div>
        </div>
      )
    },
    {
      header: 'User',
      accessor: 'userId',
      render: (val, row) => (
        <span style={{ fontWeight: 600 }}>{row.user?.name || 'System'}</span>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (val) => (
        <Badge variant={ACTION_COLORS[val] || 'default'} size="sm">{val}</Badge>
      )
    },
    { header: 'Entity', accessor: 'entity', render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{val}</span> },
    { header: 'Entity ID', accessor: 'entityId', render: (val) => <code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{val || '—'}</code> },
    {
      header: 'Details',
      accessor: 'details',
      render: (val) => renderDetails(val)
    },
    {
      header: 'IP',
      accessor: 'ipAddress',
      render: (val) => <code style={{ fontSize: '0.75rem' }}>{val || '—'}</code>
    },
    {
      header: '',
      accessor: 'id',
      render: (val, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(row)}
          style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
          title="View details"
        >
          <EyeIcon size={14} />
        </Button>
      )
    }
  ];

  const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  const hasActiveFilters = actionFilter || entityFilter || search || dateFrom || dateTo;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p>Track all system actions, user activities, and administrative changes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {connected && (
            <Badge variant="success" size="sm">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="status-dot status-dot--live" style={{ width: 6, height: 6 }} />
                Live
              </span>
            </Badge>
          )}
          <Button
            variant={showLiveFeed ? 'accent' : 'secondary'}
            size="sm"
            onClick={() => setShowLiveFeed(!showLiveFeed)}
            icon={<RefreshIcon size={14} />}
          >
            Feed ({liveFeed.length})
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport} icon={<DownloadIcon size={14} />}>Export CSV</Button>
          <Button variant="secondary" size="sm" onClick={() => loadLogs()} icon={<RefreshIcon size={14} />}>Refresh</Button>
        </div>
      </div>

      {/* Live Feed Panel */}
      {showLiveFeed && (
        <Card style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="status-dot status-dot--live" style={{ width: 8, height: 8 }} />
              Live Activity Feed
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setLiveFeed([])} style={{ fontSize: '0.75rem' }}>
              Clear
            </Button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {liveFeed.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem' }}>
                Waiting for new events...
              </p>
            ) : (
              liveFeed.slice(0, 30).map((log, idx) => (
                <div
                  key={log.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    animation: idx === 0 ? 'fadeIn 0.3s ease' : 'none',
                    backgroundColor: idx === 0 ? 'var(--color-primary-50)' : 'transparent',
                  }}
                >
                  <Badge variant={ACTION_COLORS[log.action] || 'default'} size="sm" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                    {log.action}
                  </Badge>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{log.entity}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    {log.user?.name || 'System'}
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Search</label>
              <input
                type="text"
                placeholder="Search by user, entity, action, IP..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ ...selectStyle, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Action</label>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="TRANSFER">Transfer</option>
                <option value="CALL">Call</option>
                <option value="COMPLETE">Complete</option>
                <option value="CANCEL">Cancel</option>
                <option value="PAUSE">Pause</option>
                <option value="RESUME">Resume</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Entity</label>
              <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={selectStyle}>
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Ticket">Ticket</option>
                <option value="Appointment">Appointment</option>
                <option value="Counter">Counter</option>
                <option value="Branch">Branch</option>
                <option value="Service">Service</option>
                <option value="Feedback">Feedback</option>
                <option value="Task">Task</option>
                <option value="Settings">Settings</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={selectStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={selectStyle} />
            </div>
            <Button type="submit" variant="secondary" size="sm" icon={<SearchIcon size={14} />}>Search</Button>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters} icon={<CrossIcon size={14} />}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Entries</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{totalCount}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Page</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{page} / {totalPages}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Displayed</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{logs.length}</h3>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No audit log entries found.</p>
            <p style={{ fontSize: '0.875rem' }}>
              {hasActiveFilters ? 'Try adjusting your filters or clear them to see all logs.' : 'Logs will appear here as actions are performed in the system.'}
            </p>
          </div>
        ) : (
          <Table columns={columns} data={logs} />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontWeight: 600, fontSize: '0.875rem' }}>
            Page {page} of {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Action</label>
                <p style={{ marginTop: '0.25rem' }}>
                  <Badge variant={ACTION_COLORS[selectedLog.action] || 'default'}>{selectedLog.action}</Badge>
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Entity</label>
                <p style={{ marginTop: '0.25rem', fontFamily: 'monospace', fontWeight: 600 }}>{selectedLog.entity}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>User</label>
                <p style={{ marginTop: '0.25rem', fontWeight: 600 }}>{selectedLog.user?.name || 'System'}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Timestamp</label>
                <p style={{ marginTop: '0.25rem' }}>{formatDateTime(selectedLog.createdAt)}</p>
              </div>
              {selectedLog.entityId && (
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Entity ID</label>
                  <p style={{ marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{selectedLog.entityId}</p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>IP Address</label>
                  <p style={{ marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{selectedLog.ipAddress}</p>
                </div>
              )}
            </div>

            {/* Full Details JSON */}
            {selectedLog.details && (
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Details (JSON)
                </label>
                <pre style={{
                  backgroundColor: 'var(--color-bg-alt)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  lineHeight: '1.6',
                  overflow: 'auto',
                  maxHeight: '300px',
                  border: '1px solid var(--color-border)',
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {(() => {
                    try {
                      const parsed = typeof selectedLog.details === 'string'
                        ? JSON.parse(selectedLog.details)
                        : selectedLog.details;
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </pre>
              </div>
            )}

            {selectedLog.userAgent && (
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  User Agent
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>{selectedLog.userAgent}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

