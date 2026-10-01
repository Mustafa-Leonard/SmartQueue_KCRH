import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import * as ticketApi from '../../api/ticketApi.js';
import { 
  RefreshIcon, HistoryIcon, TicketIcon, ClockIcon, 
  SearchIcon, DownloadIcon, StarIcon, FilterIcon, BranchIcon
} from '../../components/common/Icons.jsx';
import { extractData } from '../../utils/apiUtils.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';
import PaginationControls from '../../components/common/PaginationControls.jsx';

export default function QueueHistoryPage() {
  const [historyTickets, setHistoryTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getCustomerHistoryTickets(page, 20, {
        search: appliedSearch || undefined,
        status: statusFilter || undefined,
        date: dateFilter || undefined
      });
      const payload = extractData(res);
      setHistoryTickets(payload?.tickets || []);
      setPagination(payload?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [page, appliedSearch, statusFilter, dateFilter]);

  const statusVariants = { COMPLETED: 'success', SKIPPED: 'default', NO_SHOW: 'error', TRANSFERRED: 'info' };

  const filteredTickets = historyTickets;

  const handleHistorySearch = (event) => {
    event.preventDefault();
    setPage(1);
    if (page === 1 && appliedSearch === searchQuery) loadHistory();
    else setAppliedSearch(searchQuery);
  };

  const handleDownloadReceipt = (ticket) => {
    const receiptText = `
      ======================================
      KILIFI COUNTY REFERRAL HOSPITAL
      DIGITAL QUEUE RECEIPT
      ======================================
      Ticket Number: ${ticket.ticketNumber}
      Service: ${ticket.service?.name || 'N/A'}
      Department: ${ticket.queue?.branch?.name || 'N/A'}
      Date: ${formatDateTime(ticket.createdAt)}
      Status: ${ticket.status}
      ${ticket.counter ? `Served at: ${ticket.counter.name} (Counter #${ticket.counter.number})` : ''}
      ======================================
      Thank you for visiting KCRH.
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KCRH-Receipt-${ticket.ticketNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Visit receipt downloaded');
  };

  const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Queue Visit History</h1>
          <p>Your complete hospital visit records</p>
        </div>
        <Button variant="secondary" onClick={loadHistory} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Visits</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{pagination.total}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed on Page</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
            {historyTickets.filter(t => t.status === 'COMPLETED').length}
          </h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Page Avg. Rating</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
            {(() => {
              const ratings = historyTickets.flatMap(ticket => ticket.feedbacks || []).map(feedback => Number(feedback.rating)).filter(Number.isFinite);
              return ratings.length ? `${(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)} / 5` : '—';
            })()}
          </h3>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleHistorySearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SearchIcon size={16} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search by ticket, service, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...selectStyle, width: '100%', border: 'none', outline: 'none' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped</option>
            <option value="NO_SHOW">No Show</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>
          <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} style={selectStyle} />
          <Button type="submit" variant="secondary" icon={<SearchIcon size={14} />}>Search</Button>
        </form>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
      ) : filteredTickets.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <HistoryIcon size={24} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            {searchQuery || statusFilter || dateFilter ? 'No visits match your filters.' : 'No visit history found.'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {searchQuery || statusFilter || dateFilter ? 'Try adjusting your search criteria.' : 'Your past visits will appear here once completed.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTickets.map(t => (
            <Card key={t.id} variant="bordered" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 900, flexShrink: 0
                  }}>
                    {t.ticketNumber?.split('-')[1] || t.ticketNumber}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.service?.name}</h3>
                      <Badge variant={statusVariants[t.status]} size="sm">{t.status}</Badge>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ClockIcon size={12} /> {formatDateTime(t.createdAt)}
                      </span>
                      {t.queue?.branch?.name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><BranchIcon size={12} /> {t.queue.branch.name}</span>}
                      {t.counter && <span>Desk: {t.counter.name}</span>}
                    </div>
                    {/* Serving duration placeholder */}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {t.calledAt && t.completedAt ? (
                        <span>Duration: {Math.round((new Date(t.completedAt) - new Date(t.calledAt)) / 60000)} min</span>
                      ) : (
                        <span>Waiting time: ~{t.waitingBefore * (t.service?.estimatedTime || 15)} min (est.)</span>
                      )}
                    </div>
                    {/* Feedback link */}
                    {t.status === 'COMPLETED' && !t.feedbacks?.length && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a href="/customer/feedback" style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                          <StarIcon size={12} /> Rate this visit
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <Button 
                    variant="ghost" size="sm" 
                    onClick={() => handleDownloadReceipt(t)}
                    icon={<DownloadIcon size={14} />}
                    title="Download Receipt"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <PaginationControls page={page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
    </div>
  );
}
