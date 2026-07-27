import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import * as notificationApi from '../../api/notificationApi.js';
import { 
  RefreshIcon, BellIcon, PhoneIcon, MailIcon, 
  CheckCircleIcon, AlertIcon, CalendarIcon, 
  MegaphoneIcon, InfoIcon, ClockIcon 
} from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';
import { formatDateTime, formatDate } from '../../utils/formatters.js';

const NOTIFICATION_CATEGORIES = {
  queue: { label: 'Queue Updates', icon: <ClockIcon size={14} />, color: 'var(--color-primary)' },
  appointment: { label: 'Appointment Reminders', icon: <CalendarIcon size={14} />, color: 'var(--color-accent)' },
  announcement: { label: 'Announcements', icon: <MegaphoneIcon size={14} />, color: 'var(--color-warning)' },
  emergency: { label: 'Emergency Alerts', icon: <AlertIcon size={14} />, color: 'var(--color-error)' },
  system: { label: 'System Messages', icon: <InfoIcon size={14} />, color: 'var(--color-info)' },
};

function categorizeNotification(n) {
  const msg = (n.message || '').toLowerCase() + (n.subject || '').toLowerCase();
  if (msg.includes('queue') || msg.includes('ticket') || msg.includes('position') || msg.includes('wait')) return 'queue';
  if (msg.includes('appointment') || msg.includes('booking') || msg.includes('schedule')) return 'appointment';
  if (msg.includes('emergency') || msg.includes('urgent') || msg.includes('alert')) return 'emergency';
  if (msg.includes('announcement') || msg.includes('notice') || msg.includes('bulletin')) return 'announcement';
  return 'system';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications({});
      setNotifications(extractArray(data, 'notifications'));
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  // Group by date
  const groupedNotifications = (() => {
    const filtered = selectedCategory === 'all' 
      ? notifications 
      : notifications.filter(n => categorizeNotification(n) === selectedCategory);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };
    
    filtered.forEach(n => {
      const date = new Date(n.createdAt);
      const dateStr = formatDate(n.createdAt);
      const todayStr = formatDate(today);
      const yesterdayStr = formatDate(yesterday);
      
      if (dateStr === todayStr) groups.today.push(n);
      else if (dateStr === yesterdayStr) groups.yesterday.push(n);
      else if (date > new Date(today.getTime() - 7 * 86400000)) groups.thisWeek.push(n);
      else groups.earlier.push(n);
    });
    
    return groups;
  })();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const categoriesWithCount = {};
  Object.keys(NOTIFICATION_CATEGORIES).forEach(key => {
    categoriesWithCount[key] = notifications.filter(n => !n.isRead && categorizeNotification(n) === key).length;
  });

  const statusVariants = { SENT: 'success', DELIVERED: 'success', SIMULATED: 'info', FAILED: 'error' };

  const renderNotificationCard = (n) => {
    const category = categorizeNotification(n);
    const catInfo = NOTIFICATION_CATEGORIES[category];
    
    return (
      <Card 
        key={n.id} 
        variant="bordered" 
        style={{ 
          padding: '1rem',
          borderLeft: !n.isRead ? `4px solid ${catInfo?.color || 'var(--color-primary)'}` : 'none',
          opacity: n.isRead ? 0.7 : 1
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: catInfo?.color }}>{catInfo?.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: catInfo?.color }}>{catInfo?.label}</span>
              {n.type === 'SMS' && <PhoneIcon size={12} color="var(--color-text-muted)" />}
              {n.type === 'EMAIL' && <MailIcon size={12} color="var(--color-text-muted)" />}
              {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'inline-block' }} />}
            </div>
            {n.subject && <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{n.subject}</p>}
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{n.message}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span>{formatDateTime(n.createdAt)}</span>
              {n.recipient && <span>To: {n.recipient}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Badge variant={statusVariants[n.status]} size="sm">{n.status}</Badge>
            {!n.isRead && (
              <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                Mark Read
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title} ({items.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map(renderNotificationCard)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with queue alerts, appointments, and hospital announcements</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={markingAll} icon={<CheckCircleIcon size={14} />}>
              Mark All Read ({unreadCount})
            </Button>
          )}
          <Button variant="secondary" onClick={loadNotifications} icon={<RefreshIcon size={16} />}>Refresh</Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Card style={{ padding: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button 
            variant={selectedCategory === 'all' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All {unreadCount > 0 && <Badge variant="error" size="sm" style={{ marginLeft: '0.25rem' }}>{unreadCount}</Badge>}
          </Button>
          {Object.entries(NOTIFICATION_CATEGORIES).map(([key, cat]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              icon={cat.icon}
            >
              {cat.label}
              {categoriesWithCount[key] > 0 && (
                <Badge variant="error" size="sm" style={{ marginLeft: '0.25rem' }}>{categoriesWithCount[key]}</Badge>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Notification Groups */}
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
        <div>
          {renderGroup('Today', groupedNotifications.today)}
          {renderGroup('Yesterday', groupedNotifications.yesterday)}
          {renderGroup('This Week', groupedNotifications.thisWeek)}
          {renderGroup('Earlier', groupedNotifications.earlier)}
          
          {groupedNotifications.today.length === 0 && 
           groupedNotifications.yesterday.length === 0 && 
           groupedNotifications.thisWeek.length === 0 && 
           groupedNotifications.earlier.length === 0 && (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>No notifications in this category.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
