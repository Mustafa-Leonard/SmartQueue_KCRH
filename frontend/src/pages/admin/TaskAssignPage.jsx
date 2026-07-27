import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import * as taskApi from '../../api/taskApi.js';
import * as userApi from '../../api/userApi.js';
import * as branchApi from '../../api/branchApi.js';
import { PlusIcon, EditIcon, TrashIcon, UserIcon, CalendarIcon, SearchIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';
import { formatDate } from '../../utils/formatters.js';

export default function TaskAssignPage() {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, staffData, branchData] = await Promise.all([
        taskApi.getTasks(),
        userApi.getStaff(),
        branchApi.getBranches()
      ]);
      setTasks(extractArray(tasksData, 'tasks'));
      setStaffList(extractArray(staffData, 'staff'));
      setBranches(extractArray(branchData, 'branches'));
    } catch (err) {
      toast.error('Failed to load task management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onAddSubmit = async (data) => {
    setSubmitting(true);
    try {
      await taskApi.createTask(data);
      toast.success('Task assigned successfully');
      setIsAddModalOpen(false);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data) => {
    setSubmitting(true);
    try {
      await taskApi.updateTask(selectedTask.id, data);
      toast.success('Task updated successfully');
      setIsEditModalOpen(false);
      setSelectedTask(null);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('priority', task.priority);
    setValue('status', task.status);
    setValue('assignedTo', task.assignedTo || '');
    setValue('branchId', task.branchId || '');
    setValue('dueDate', task.dueDate ? task.dueDate.split('T')[0] : '');
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.deleteTask(id);
      toast.success('Task deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesSearch = search
      ? t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee?.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const priorityVariants = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'error' };
  const statusVariants = { PENDING: 'default', IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'error' };

  const selectStyle = {
    padding: '0.5rem 1rem',
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
          <h1>Staff Task Management</h1>
          <p>Assign duties and track progress for hospital staff</p>
        </div>
        <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }} icon={<PlusIcon size={16} />}>
          Assign New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Tasks</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{tasks.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pending</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
            {tasks.filter(t => t.status === 'PENDING').length}
          </h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>In Progress</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-info)', marginTop: '0.25rem' }}>
            {tasks.filter(t => t.status === 'IN_PROGRESS').length}
          </h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
            {tasks.filter(t => t.status === 'COMPLETED').length}
          </h3>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search tasks or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={selectStyle}
            />
          </div>
          <div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task Cards */}
      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
          <Spinner size="md" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No tasks found.</p>
          <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }}>Assign First Task</Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {filteredTasks.map(task => (
            <Card key={task.id} variant="bordered" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
                  <Badge variant={statusVariants[task.status]}>{task.status.replace('_', ' ')}</Badge>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(task)}><EditIcon size={14} /></Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(task.id)}><TrashIcon size={14} /></Button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{task.title}</h3>
              {task.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {task.description}
                </p>
              )}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserIcon size={14} /> Assigned to: <strong>{task.assignee?.name || 'Unassigned'}</strong>
                </div>
                {task.dueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={14} /> Due: <strong>{formatDate(task.dueDate)}</strong>
                  </div>
                )}
                {task.branch && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Department: <strong>{task.branch.name}</strong></span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Assign New Task to Staff">
        <form onSubmit={handleSubmit(onAddSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Task Title" type="text" placeholder="e.g. Clean Pharmacy Counter B" error={errors.title} {...register('title', { required: 'Title is required' })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea
              {...register('description')}
              placeholder="Detailed instructions..."
              style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Priority</label>
              <select {...register('priority')} style={selectStyle}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Due Date</label>
              <input type="date" {...register('dueDate')} style={selectStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Assign To (Staff)</label>
            <select {...register('assignedTo')} style={selectStyle}>
              <option value="">-- Select Staff --</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
            <select {...register('branchId')} style={selectStyle}>
              <option value="">-- All Departments --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }} title="Edit Task">
        <form onSubmit={handleSubmit(onEditSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Task Title" type="text" error={errors.title} {...register('title', { required: 'Title is required' })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea {...register('description')} style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Priority</label>
              <select {...register('priority')} style={selectStyle}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</label>
              <select {...register('status')} style={selectStyle}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Due Date</label>
              <input type="date" {...register('dueDate')} style={selectStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Assign To</label>
            <select {...register('assignedTo')} style={selectStyle}>
              <option value="">-- Unassigned --</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setSelectedTask(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
