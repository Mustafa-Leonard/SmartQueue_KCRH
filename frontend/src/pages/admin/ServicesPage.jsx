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
import * as serviceApi from '../../api/serviceApi.js';
import * as branchApi from '../../api/branchApi.js';
import { EditIcon, TrashIcon, PlusIcon, ClockIcon, CheckIcon, BanIcon, FilterIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesData, branchesData] = await Promise.all([
        serviceApi.getServices(),
        branchApi.getBranches()
      ]);
      setServices(extractArray(servicesData, 'services'));
      setBranches(extractArray(branchesData, 'branches'));
    } catch (err) {
      toast.error('Failed to load services data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onAddSubmit = async (data) => {
    setSubmitting(true);
    try {
      await serviceApi.createService({ ...data, estimatedTime: parseInt(data.estimatedTime, 10) });
      toast.success('Service created successfully');
      setIsAddModalOpen(false);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data) => {
    setSubmitting(true);
    try {
      await serviceApi.updateService(selectedService.id, { ...data, estimatedTime: parseInt(data.estimatedTime, 10) });
      toast.success('Service updated successfully');
      setIsEditModalOpen(false);
      setSelectedService(null);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (service) => {
    try {
      await serviceApi.updateService(service.id, { isActive: !service.isActive });
      toast.success(`Service ${service.isActive ? 'deactivated' : 'activated'} successfully`);
      loadData();
    } catch (err) {
      toast.error('Failed to update service status');
    }
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setValue('name', service.name);
    setValue('description', service.description || '');
    setValue('estimatedTime', service.estimatedTime);
    setValue('branchId', service.branchId);
    setValue('category', service.category || '');
    setIsEditModalOpen(true);
  };

  const deleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await serviceApi.deleteService(id);
      toast.success('Service deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  const filteredServices = services.filter(s => {
    const matchesBranch = branchFilter ? s.branchId === branchFilter : true;
    const matchesCategory = categoryFilter ? (s.category || '') === categoryFilter : true;
    return matchesBranch && matchesCategory;
  });

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];

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
      header: 'Service Name',
      accessor: 'name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {row.description || 'No description'}
          </div>
          {row.category && <Badge variant="info" size="sm" style={{ marginTop: '0.25rem' }}>{row.category}</Badge>}
        </div>
      )
    },
    { header: 'Department', accessor: 'branchId', render: (val, row) => <span>{row.branch?.name || 'Unlinked'}</span> },
    {
      header: 'Est. Time',
      accessor: 'estimatedTime',
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
          <ClockIcon size={14} /> {val} min
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Badge variant={val !== false ? 'success' : 'default'}>{val !== false ? 'Active' : 'Disabled'}</Badge>
          <button
            onClick={() => toggleActive(row)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: val !== false ? 'var(--color-error)' : 'var(--color-success)', padding: '2px' }}
            title={val !== false ? 'Deactivate' : 'Activate'}
          >
            {val !== false ? <BanIcon size={14} /> : <CheckIcon size={14} />}
          </button>
        </div>
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
          <Button variant="danger" size="sm" onClick={() => deleteService(row.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrashIcon size={14} /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hospital Clinical Services</h1>
          <p>Configure consultations, lab checks, pharmacy services with estimated durations</p>
        </div>
        <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }} icon={<PlusIcon size={16} />}>
          Create Service
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Services</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{services.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Active</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-success)' }}>{services.filter(s => s.isActive !== false).length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Avg Duration</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-accent)' }}>
            {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + (s.estimatedTime || 0), 0) / services.length) : 0} min
          </h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Categories</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-info)' }}>{categories.length}</h3>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FilterIcon size={16} />
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ ...selectStyle, padding: '0.5rem 1rem' }}>
              <option value="">All Departments</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          {categories.length > 0 && (
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...selectStyle, padding: '0.5rem 1rem' }}>
              <option value="">All Categories</option>
              {categories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
        ) : (
          <Table columns={columns} data={filteredServices} />
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Clinical Service">
        <form onSubmit={handleSubmit(onAddSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
            <select {...register('branchId', { required: 'Department is required' })} style={selectStyle}>
              <option value="">-- Choose Department --</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <Input label="Service Name" type="text" placeholder="e.g. General Consultation" error={errors.name} {...register('name', { required: 'Service name is required' })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Est. Duration (Minutes)" type="number" placeholder="e.g. 15" error={errors.estimatedTime} {...register('estimatedTime', { required: true, min: 1 })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category</label>
              <select {...register('category')} style={selectStyle}>
                <option value="">-- General --</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="LABORATORY">Laboratory</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="RADIOLOGY">Radiology</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PEDIATRICS">Pediatrics</option>
                <option value="DENTAL">Dental</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea {...register('description')} placeholder="Details about patient routing, requirements..." style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Clinical Service Details">
        <form onSubmit={handleSubmit(onEditSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
            <select {...register('branchId', { required: 'Department is required' })} style={selectStyle}>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <Input label="Service Name" type="text" error={errors.name} {...register('name', { required: true })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Est. Duration (Minutes)" type="number" error={errors.estimatedTime} {...register('estimatedTime', { required: true })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category</label>
              <select {...register('category')} style={selectStyle}>
                <option value="">-- General --</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="LABORATORY">Laboratory</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="RADIOLOGY">Radiology</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PEDIATRICS">Pediatrics</option>
                <option value="DENTAL">Dental</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea {...register('description')} style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setSelectedService(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
