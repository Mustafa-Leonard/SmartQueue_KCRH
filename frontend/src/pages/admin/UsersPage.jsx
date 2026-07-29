import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import * as userApi from '../../api/userApi.js';
import * as branchApi from '../../api/branchApi.js';
import { EditIcon, BanIcon, CheckIcon, PlusIcon, UsersIcon, SearchIcon, ClockIcon, HistoryIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';
import { formatDate } from '../../utils/formatters.js';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([
        userApi.getUsers(roleFilter, search),
        branchApi.getBranches()
      ]);
      setUsers(extractArray(usersData, 'users'));
      setBranches(extractArray(branchesData, 'branches'));
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleSearch = (e) => { e.preventDefault(); loadUsers(); };

  const onAddSubmit = async (data) => {
    setSubmitting(true);
    try {
      await userApi.createUser(data);
      toast.success('User created successfully');
      setIsAddModalOpen(false);
      reset();
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data) => {
    setSubmitting(true);
    try {
      const updateData = {};
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.phone) updateData.phone = data.phone;
      if (data.role) updateData.role = data.role;
      if (data.branchId) updateData.branchId = data.branchId;
      await userApi.updateUser(selectedUser.id, updateData);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      reset();
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('phone', user.phone);
    setValue('role', user.role);
    setValue('branchId', user.branchId || '');
    setIsEditModalOpen(true);
  };

  const toggleActive = async (user) => {
    try {
      await userApi.toggleUserActive(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (err) {
      toast.error('Failed to update active status');
    }
  };

  const selectStyle = {
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem'
          }}>
            {row.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{row.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Role',
      accessor: 'role',
      render: (val) => {
        const variants = { ADMIN: 'error', STAFF: 'warning', CUSTOMER: 'info' };
        return <Badge variant={variants[val] || 'default'}>{val}</Badge>;
      }
    },
    {
      header: 'Department',
      accessor: 'branchId',
      render: (val, row) => <span>{row.branch?.name || '—'}</span>
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (val) => <Badge variant={val ? 'success' : 'default'}>{val ? 'Active' : 'Suspended'}</Badge>
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      render: (val) => <span style={{ fontSize: '0.85rem' }}>{formatDate(val)}</span>
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <EditIcon size={14} /> Edit
          </Button>
          <Button variant={row.isActive ? 'danger' : 'secondary'} size="sm" onClick={() => toggleActive(row)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            {row.isActive ? <><BanIcon size={14} /> Suspend</> : <><CheckIcon size={14} /> Activate</>}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff & Users</h1>
          <p>Manage hospital staff, administrators, and registered patients</p>
        </div>
        <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }} icon={<PlusIcon size={16} />}>
          Register New User
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Accounts</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{users.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Staff</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>{users.filter(u => u.role === 'STAFF').length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Admins</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)', marginTop: '0.25rem' }}>{users.filter(u => u.role === 'ADMIN').length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Patients</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>{users.filter(u => u.role === 'CUSTOMER').length}</h3>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input type="text" placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', ...selectStyle }} />
          </div>
          <div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
              <option value="">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="STAFF">Hospital Staff</option>
              <option value="CUSTOMER">Patients</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <SearchIcon size={16} /> Search
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No users found.</div>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Hospital User">
        <form onSubmit={handleSubmit(onAddSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Full Name" type="text" placeholder="e.g. Dr. Jane Kinyua" error={errors.name} {...register('name', { required: true })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Email" type="email" error={errors.email} {...register('email', { required: true })} />
            <Input label="Phone" type="text" error={errors.phone} {...register('phone', { required: true })} />
          </div>
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password} {...register('password', { required: true, minLength: { value: 6, message: 'Min 6 chars' } })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role</label>
            <select {...register('role', { required: true })} style={selectStyle}>
              <option value="CUSTOMER">Patient</option>
              <option value="STAFF">Hospital Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department (for staff)</label>
            <select {...register('branchId')} style={selectStyle}>
              <option value="">— None —</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }} title="Edit User Information">
        <form onSubmit={handleSubmit(onEditSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Full Name" type="text" error={errors.name} {...register('name', { required: true })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Email" type="email" error={errors.email} {...register('email', { required: true })} />
            <Input label="Phone" type="text" error={errors.phone} {...register('phone', { required: true })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role</label>
            <select {...register('role', { required: true })} style={selectStyle}>
              <option value="CUSTOMER">Patient</option>
              <option value="STAFF">Hospital Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
            <select {...register('branchId')} style={selectStyle}>
              <option value="">— None —</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
