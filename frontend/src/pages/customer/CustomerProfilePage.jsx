import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import * as authApi from '../../api/authApi.js';
import { 
  SaveIcon, UserIcon, MailIcon, PhoneIcon, 
  LockIcon, CameraIcon, HistoryIcon, BellIcon,
  AlertIcon, CrossIcon, CheckIcon 
} from '../../components/common/Icons.jsx';
import { PASSWORD_REQUIREMENTS, validatePassword } from '../../utils/passwordValidation.js';

export default function CustomerProfilePage() {
  const { user, updateUser } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  // Parse emergencyContact from JSON string if needed
  const parsedEmergency = typeof user?.emergencyContact === 'string' 
    ? (() => { try { return JSON.parse(user.emergencyContact); } catch(e) { return {}; } })() 
    : (user?.emergencyContact || {});

  const { register: profileRegister, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
      emergencyName: parsedEmergency.name || '',
      emergencyPhone: parsedEmergency.phone || '',
      emergencyRelation: parsedEmergency.relation || '',
      // Medical fields
      weight: user?.weight || '',
      bloodType: user?.bloodType || '',
      height: user?.height || '',
      diseases: user?.diseases || '',
      allergies: user?.allergies || '',
      gender: user?.gender || '',
    }
  });

  const { register: pwRegister, handleSubmit: handlePwSubmit, reset: resetPwForm, formState: { errors: pwErrors } } = useForm();

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    queueUpdates: true,
    appointmentReminders: true,
    announcements: true,
    smsAlerts: true,
    emailAlerts: true,
  });

  const onProfileSave = async (data) => {
    setSubmitting(true);
    try {
      const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        emergencyContactName: data.emergencyName,
        emergencyContact: JSON.stringify({
          phone: data.emergencyPhone,
          relation: data.emergencyRelation
        }),
        // Medical fields
        weight: data.weight,
        bloodType: data.bloodType,
        height: data.height,
        diseases: data.diseases,
        allergies: data.allergies,
        gender: data.gender,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
      };

      // Include profile image if changed
      if (profilePic && profilePic.startsWith('data:')) {
        updateData.profileImageUrl = profilePic;
      }

      const res = await authApi.updateProfile(updateData);
      toast.success('Profile updated successfully.');
      if (updateUser) {
        updateUser(res.data?.data || res.data || updateData);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  const onPasswordSave = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPwSubmitting(true);
    try {
      await authApi.updateProfile({ currentPassword: data.currentPassword, password: data.newPassword });
      toast.success('Password changed successfully');
      resetPwForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target.result);
        toast.success('Profile picture updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleNotifPref = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preference updated');
  };

  const activityLog = [
    { action: 'Password changed', date: '2024-01-15 10:30 AM' },
    { action: 'Profile updated', date: '2024-01-10 2:15 PM' },
    { action: 'Logged in from new device', date: '2024-01-08 8:00 AM' },
    { action: 'Account created', date: '2023-12-01 9:00 AM' },
  ];

  const selectStyle = {
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem',
    width: '100%'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information, security, and preferences</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'personal', label: 'Personal Info', icon: <UserIcon size={14} /> },
          { key: 'security', label: 'Security', icon: <LockIcon size={14} /> },
          { key: 'notifications', label: 'Notifications', icon: <BellIcon size={14} /> },
        ].map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            icon={tab.icon}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Profile Picture */}
          <Card style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: profilePic ? `url(${profilePic}) center/cover` : 'var(--gradient-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {!profilePic && (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <label htmlFor="profile-pic-upload" style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid #fff', fontSize: '0.75rem'
                }}>
                  <CameraIcon size={14} />
                </label>
                <input 
                  id="profile-pic-upload" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleProfilePicChange}
                />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.name}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{user?.email}</p>
                <Badge variant="info" size="sm" style={{ marginTop: '0.25rem' }}>Patient</Badge>
              </div>
            </div>
          </Card>

          <Card title="Personal Information">
            <form onSubmit={handleProfileSubmit(onProfileSave)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Full Name" type="text" error={profileErrors.name} {...profileRegister('name', { required: 'Name is required' })} />
                <Input label="Email Address" type="email" error={profileErrors.email} {...profileRegister('email', { required: 'Email is required' })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Phone Number" type="text" error={profileErrors.phone} {...profileRegister('phone', { required: 'Phone is required' })} />
                <Input label="Date of Birth" type="date" {...profileRegister('dateOfBirth')} />
              </div>
              <Input label="Home Address" type="text" {...profileRegister('address')} placeholder="e.g. 123 Hospital Road" />
              
              {/* Medical Information */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CrossIcon size={16} color="var(--color-primary)" /> Medical Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <Input label="Weight (kg)" type="text" {...profileRegister('weight')} placeholder="e.g. 70" />
                  <Input label="Height (cm)" type="text" {...profileRegister('height')} placeholder="e.g. 170" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Blood Type</label>
                    <select {...profileRegister('bloodType')} style={selectStyle}>
                      <option value="">— Select —</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Gender</label>
                    <select {...profileRegister('gender')} style={selectStyle}>
                      <option value="">— Select —</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <Input label="Last Visit Date" type="date" {...profileRegister('lastVisit')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <Input label="Known Diseases / Conditions" type="text" {...profileRegister('diseases')} placeholder="e.g. Hypertension, Diabetes" />
                  <Input label="Known Allergies" type="text" {...profileRegister('allergies')} placeholder="e.g. Penicillin, Peanuts" />
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertIcon size={16} color="var(--color-warning)" /> Emergency Contact
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input label="Contact Name" type="text" {...profileRegister('emergencyName')} placeholder="e.g. Jane Doe" />
                  <Input label="Phone Number" type="text" {...profileRegister('emergencyPhone')} placeholder="e.g. +254712345678" />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Input label="Relationship" type="text" {...profileRegister('emergencyRelation')} placeholder="e.g. Spouse, Parent, Sibling" />
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={submitting} style={{ width: 'fit-content' }} icon={<SaveIcon size={16} />}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          {/* Account Activity */}
          <Card title="Account Activity">
            <div style={{ padding: '0.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Member since: <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</strong></span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowActivityLog(true)} icon={<HistoryIcon size={14} />}>
                View Login Activity
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card title="Change Password">
          <form onSubmit={handlePwSubmit(onPasswordSave)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={pwErrors.currentPassword}
              {...pwRegister('currentPassword', { required: 'Current password is required' })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={pwErrors.newPassword}
                {...pwRegister('newPassword', { 
                  required: 'New password is required',
                  validate: validatePassword
                })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={pwErrors.confirmPassword}
                {...pwRegister('confirmPassword', { required: 'Confirm your new password' })}
              />
            </div>
            <p style={{ marginTop: '-0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {PASSWORD_REQUIREMENTS}
            </p>
            <Button type="submit" variant="primary" disabled={pwSubmitting} style={{ width: 'fit-content' }} icon={<LockIcon size={16} />}>
              {pwSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card title="Notification Preferences">
          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Alert Types</h3>
            {[
              { key: 'queueUpdates', label: 'Queue Updates', desc: 'When your ticket is called or position changes' },
              { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Reminders for upcoming appointments' },
              { key: 'announcements', label: 'Announcements', desc: 'Hospital announcements and news' },
            ].map(pref => (
              <div key={pref.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pref.label}</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{pref.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotifPref(pref.key)}
                  style={{
                    width: 44, height: 24, borderRadius: '12px', border: 'none',
                    backgroundColor: notifPrefs[pref.key] ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff',
                    position: 'absolute', top: 2,
                    left: notifPrefs[pref.key] ? '22px' : '2px',
                    transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
            ))}
            
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginTop: '1rem' }}>Delivery Channels</h3>
            {[
              { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive notifications via SMS' },
              { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email' },
            ].map(pref => (
              <div key={pref.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pref.label}</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{pref.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotifPref(pref.key)}
                  style={{
                    width: 44, height: 24, borderRadius: '12px', border: 'none',
                    backgroundColor: notifPrefs[pref.key] ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff',
                    position: 'absolute', top: 2,
                    left: notifPrefs[pref.key] ? '22px' : '2px',
                    transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Activity Log Modal */}
      <Modal isOpen={showActivityLog} onClose={() => setShowActivityLog(false)} title="Account Activity Log">
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activityLog.map((entry, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem', borderBottom: '1px solid var(--color-border)',
                fontSize: '0.85rem'
              }}>
                <span>{entry.action}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{entry.date}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
