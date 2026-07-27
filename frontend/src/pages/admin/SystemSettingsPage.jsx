import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import * as settingsApi from '../../api/settingsApi.js';
import { SaveIcon, RefreshIcon, SettingsIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getSettings();
      const list = extractArray(data, 'settings');
      setSettings(list);
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async (key) => {
    setSaving(true);
    try {
      await settingsApi.upsertSetting(key, editValue, '');
      toast.success(`Setting "${key}" updated successfully`);
      setEditingKey(null);
      setEditValue('');
      loadSettings();
    } catch (err) {
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayLabel = (key) => {
    const labels = {
      NOTIFICATION_ENABLED: 'Enable Notifications',
      WORKING_HOURS_START: 'Working Hours Start',
      WORKING_HOURS_END: 'Working Hours End',
      SLOT_DURATION_MINUTES: 'Appointment Slot Duration (mins)',
      MAX_WAITING_PER_COUNTER: 'Max Waiting Per Counter',
      AUTO_CONFIRM_APPOINTMENTS: 'Auto-Confirm Appointments',
      SMS_ALERTS_ENABLED: 'SMS Alerts Enabled',
      EMAIL_ALERTS_ENABLED: 'Email Alerts Enabled',
      DISPLAY_BOARD_REFRESH_SECONDS: 'Display Board Refresh (sec)'
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getInputType = (key) => {
    if (key.includes('ENABLED') || key.includes('CONFIRM')) return 'checkbox';
    if (key.includes('MINUTES') || key.includes('SECONDS') || key.includes('COUNTER')) return 'number';
    if (key.includes('START') || key.includes('END')) return 'time';
    return 'text';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure hospital system parameters and preferences</p>
        </div>
        <Button variant="secondary" onClick={loadSettings} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {settings.map(s => (
            <Card key={s.key} variant="bordered" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>{getDisplayLabel(s.key)}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{s.key}</p>
                  {s.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{s.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {editingKey === s.key ? (
                    <>
                      {getInputType(s.key) === 'checkbox' ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            fontFamily: 'var(--font-family)',
                            fontSize: '0.875rem'
                          }}
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      ) : (
                        <input
                          type={getInputType(s.key)}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            fontFamily: 'var(--font-family)',
                            fontSize: '0.875rem',
                            width: '120px'
                          }}
                        />
                      )}
                      <Button variant="primary" size="sm" onClick={() => handleSave(s.key)} disabled={saving} icon={<SaveIcon size={14} />}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingKey(null); setEditValue(''); }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', padding: '0.25rem 0.75rem', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)' }}>
                        {s.value}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingKey(s.key); setEditValue(s.value); }}>
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
