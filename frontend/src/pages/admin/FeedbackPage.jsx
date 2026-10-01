import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import PaginationControls from '../../components/common/PaginationControls.jsx';
import * as feedbackApi from '../../api/feedbackApi.js';
import { RefreshIcon, StarIcon, MessageIcon } from '../../components/common/Icons.jsx';
import { extractArray, extractData } from '../../utils/apiUtils.js';
import { formatDateTime } from '../../utils/formatters.js';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackRes, statsRes] = await Promise.all([
        feedbackApi.getAllFeedback({ page, limit: 20 }),
        feedbackApi.getFeedbackStats()
      ]);
      const feedbackPayload = extractData(feedbackRes);
      setFeedbacks(feedbackPayload?.feedbacks || extractArray(feedbackRes, 'feedbacks'));
      setPagination(feedbackPayload?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      const statsData = extractData(statsRes);
      setStats(statsData?.stats || null);
    } catch (err) {
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleMarkRead = async (id) => {
    try {
      await feedbackApi.markFeedbackRead(id);
      toast.success('Marked as read');
      loadData();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} size={16} color={i < rating ? '#f59e0b' : 'var(--color-border)'} style={{ fill: i < rating ? '#f59e0b' : 'transparent' }} />
    ));
  };

  const unread = stats?.unread ?? feedbacks.filter(f => !f.isRead).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customer Feedback</h1>
          <p>Review patient ratings and comments about services</p>
        </div>
        <Button variant="secondary" onClick={loadData} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <Card condensed>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Reviews</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats.total}</h3>
          </Card>
          <Card condensed>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Average Rating</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {stats.avgRating} {renderStars(Math.round(stats.avgRating))}
            </h3>
          </Card>
          <Card condensed>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Unread</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)', marginTop: '0.25rem' }}>{unread}</h3>
          </Card>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
      ) : feedbacks.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No feedback received yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedbacks.map(f => (
            <Card key={f.id} variant="bordered" style={{ padding: '1.25rem', borderLeft: f.isRead ? 'none' : '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {renderStars(f.rating)}
                    </div>
                    <Badge variant={f.category === 'SERVICE' ? 'info' : f.category === 'WAIT_TIME' ? 'warning' : f.category === 'STAFF' ? 'success' : 'default'}>
                      {f.category}
                    </Badge>
                    {!f.isRead && <Badge variant="error">New</Badge>}
                  </div>
                  {f.comment && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: '0.5rem' }}>"{f.comment}"</p>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>By: <strong>{f.customer?.name}</strong></span>
                    {f.ticket && <span>Ticket: <strong>{f.ticket.ticketNumber}</strong> ({f.ticket.service?.name})</span>}
                    <span>{formatDateTime(f.createdAt)}</span>
                  </div>
                </div>
                {!f.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkRead(f.id)}>Mark Read</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <PaginationControls page={page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
    </div>
  );
}
