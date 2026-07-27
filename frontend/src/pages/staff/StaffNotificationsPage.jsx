import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import * as notificationApi from '../../api/notificationApi.js';
import { RefreshIcon, BellIcon, PhoneIcon, MailIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';
import { formatDateTime } from '../../utils/formatters.js';

export default function StaffNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications({});
      setNotifications(extractArray(data, 'notifications'));
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const statusVariants = { SENT: 'success', DELIVERED: 'success', SIMULATED: 'info', FAILED: 'error' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>System alerts and communication history</p>
        </div>
        <Button variant="secondary" onClick={loadNotifications} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
      ) : notifications.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <BellIcon size={24} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>No notifications yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <Card key={n.id} variant="bordered" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {n.type === 'SMS' ? <PhoneIcon size={14} /> : <MailIcon size={14} />}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.type}</span>
                    {n.subject && <span style={{ color: 'var(--color-text-secondary)' }}>— {n.subject}</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '0.25rem' }}>{n.message}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                    <span>To: {n.recipient}</span>
                    <span>{formatDateTime(n.createdAt)}</span>
                  </div>
                </div>
                <Badge variant={statusVariants[n.status]}>{n.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
