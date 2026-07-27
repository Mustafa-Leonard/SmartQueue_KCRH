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
import * as branchApi from '../../api/branchApi.js';
import * as counterApi from '../../api/counterApi.js';
import { EditIcon, TrashIcon, PlusIcon, MapPinIcon, ClockIcon, CounterIcon, UsersIcon, CheckIcon, BanIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [countersByBranch, setCountersByBranch] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadBranches = async () => {
    setLoading(true);
    try {
      const [branchesData, countersData] = await Promise.all([
        branchApi.getBranches(),
        counterApi.getCounters()
      ]);
      const branchList = extractArray(branchesData, 'branches');
      const countersList = extractArray(countersData, 'counters');
      
      const countersMap = {};
      countersList.forEach(c => {
        if (!countersMap[c.branchId]) countersMap[c.branchId] = [];
        countersMap[c.branchId].push(c);
      });
      
      setBranches(branchList);
      setCountersByBranch(countersMap);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBranches(); }, []);

  const onAddSubmit = async (data) => {
    setSubmitting(true);
    try {
      await branchApi.createBranch(data);
      toast.success('Department created successfully');
      setIsAddModalOpen(false);
      reset();
      loadBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data) => {
    setSubmitting(true);
    try {
      await branchApi.updateBranch(selectedBranch.id, data);
      toast.success('Department updated successfully');
      setIsEditModalOpen(false);
      setSelectedBranch(null);
      reset();
      loadBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (branch) => {
    setSelectedBranch(branch);
    setValue('name', branch.name);
    setValue('location', branch.location);
    setValue('description', branch.description);
    setValue('phone', branch.phone || '');
    setValue('email', branch.email || '');
    setValue('openingHours', branch.openingHours || '');
    setIsEditModalOpen(true);
  };

  const toggleActive = async (branch) => {
    try {
      await branchApi.updateBranch(branch.id, { isActive: !branch.isActive });
      toast.success(`Department ${branch.isActive ? 'suspended' : 'activated'} successfully`);
      loadBranches();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await branchApi.deleteBranch(id);
      toast.success('Department deleted successfully');
      loadBranches();
    } catch (err) {
      toast.error('Failed to delete department');
    }
  };

  const columns = [
    {
      header: 'Department',
      accessor: 'name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{row.description || 'No description'}</div>
          {row.phone && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>📞 {row.phone}</div>}
        </div>
      )
    },
    { header: 'Location', accessor: 'location', render: (val) => val || 'N/A' },
    {
      header: 'Counters',
      accessor: 'id',
      render: (val) => {
        const count = countersByBranch[val]?.length || 0;
        const open = countersByBranch[val]?.filter(c => c.status === 'OPEN').length || 0;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
            <CounterIcon size={14} /> {open}/{count} open
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (val) => (
        <Badge variant={val !== false ? 'success' : 'default'}>
          {val !== false ? 'Operational' : 'Suspended'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <EditIcon size={14} /> Edit
          </Button>
          {row.isActive !== false ? (
            <Button variant="ghost" size="sm" style={{ color: 'var(--color-warning)' }} onClick={() => toggleActive(row)}>
              <BanIcon size={14} /> Suspend
            </Button>
          ) : (
            <Button variant="ghost" size="sm" style={{ color: 'var(--color-success)' }} onClick={() => toggleActive(row)}>
              <CheckIcon size={14} /> Activate
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => deleteBranch(row.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrashIcon size={14} /> Delete
          </Button>
        </div>
      )
    }
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
          <h1>Hospital Departments & Branches</h1>
          <p>Manage hospital wings, outpatient units, contact info, and operational status</p>
        </div>
        <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }} icon={<PlusIcon size={16} />}>
          Create Department
        </Button>
      </div>

      {!loading && branches.length > 0 && (
        <div className="stats-grid">
          <Card condensed>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Departments</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-primary)' }}>{branches.length}</h3>
              </div>
              <MapPinIcon size={24} color="var(--color-primary)" />
            </div>
          </Card>
          <Card condensed>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Active Locations</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-success)' }}>{branches.filter(b => b.isActive !== false).length}</h3>
              </div>
              <CheckIcon size={24} color="var(--color-success)" />
            </div>
          </Card>
          <Card condensed>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Counters</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-accent)' }}>
                  {Object.values(countersByBranch).flat().length}
                </h3>
              </div>
              <CounterIcon size={24} color="var(--color-accent)" />
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
          <Spinner size="md" />
        </div>
      ) : branches.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No departments created yet.</p>
          <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }}>Create First Department</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Branch Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {branches.map(b => {
              const branchCounters = countersByBranch[b.id] || [];
              const openCount = branchCounters.filter(c => c.status === 'OPEN').length;
              return (
                <Card key={b.id} variant="bordered" interactive style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{b.name}</h3>
                    <Badge variant={b.isActive !== false ? 'success' : 'default'}>
                      {b.isActive !== false ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    {b.description || 'No description provided.'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPinIcon size={14} /> Location: <strong>{b.location}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CounterIcon size={14} /> Counters: <strong>{openCount}/{branchCounters.length} open</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(b)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <EditIcon size={14} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteBranch(b.id)}>
                      <TrashIcon size={14} /> Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Table View */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Detailed Directory</h2>
            <Card>
              <Table columns={columns} data={branches} />
            </Card>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Hospital Department">
        <form onSubmit={handleSubmit(onAddSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Department Name" type="text" placeholder="e.g. Outpatient Department (OPD)" error={errors.name} {...register('name', { required: 'Name is required' })} />
          <Input label="Location / Building" type="text" placeholder="e.g. Block B, Ground Floor" error={errors.location} {...register('location', { required: 'Location is required' })} />
          <Input label="Phone Number" type="text" placeholder="e.g. +254700000000" {...register('phone')} />
          <Input label="Email Address" type="email" placeholder="e.g. opd@kcrh.go.ke" {...register('email')} />
          <Input label="Opening Hours" type="text" placeholder="e.g. Mon-Fri 8:00 AM - 5:00 PM" {...register('openingHours')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea {...register('description')} placeholder="Details about services provided here..." style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Branch Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Department Details">
        <form onSubmit={handleSubmit(onEditSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Department Name" type="text" error={errors.name} {...register('name', { required: 'Name is required' })} />
          <Input label="Location / Building" type="text" error={errors.location} {...register('location', { required: 'Location is required' })} />
          <Input label="Phone Number" type="text" {...register('phone')} />
          <Input label="Email Address" type="email" {...register('email')} />
          <Input label="Opening Hours" type="text" {...register('openingHours')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea {...register('description')} style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setSelectedBranch(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
