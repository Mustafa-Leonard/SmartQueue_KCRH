import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import * as taskApi from '../../api/taskApi.js';
import { RefreshIcon, CheckCircleIcon, PlayIcon, CrossIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';
import { formatDate } from '../../utils/formatters.js';

export default function StaffTaskListPage() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getMyTasks();
      setTasks(extractArray(data, 'tasks'));
    } catch (err) {
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id) loadTasks(); }, [user]);

  const handleStatusUpdate = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      loadTasks();
    } catch (err) {
      toast.error('Failed to update task status');
    } finally {
      setUpdating(null);
    }
  };

  const priorityVariants = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'error' };
  const statusVariants = { PENDING: 'default', IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'error' };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Assigned Tasks</h1>
          <p>View and manage duties assigned by hospital administration</p>
        </div>
        <Button variant="secondary" onClick={loadTasks} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Active Tasks</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>{pendingTasks.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>{completedTasks.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{tasks.length}</h3>
        </Card>
      </div>

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
      ) : tasks.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No tasks assigned to you yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Tasks */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Active Tasks ({pendingTasks.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {pendingTasks.map(task => (
                <Card key={task.id} variant="bordered" style={{ borderLeft: `4px solid ${task.priority === 'URGENT' ? 'var(--color-error)' : task.priority === 'HIGH' ? 'var(--color-warning)' : 'var(--color-primary)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
                      <Badge variant={statusVariants[task.status]}>{task.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{task.title}</h3>
                  {task.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{task.description}</p>
                  )}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Assigned by: <strong>{task.creator?.name}</strong></span>
                    {task.dueDate && <span>Due: <strong>{formatDate(task.dueDate)}</strong></span>}
                    {task.branch && <span>Department: <strong>{task.branch.name}</strong></span>}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {task.status === 'PENDING' && (
                      <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')} disabled={updating === task.id} icon={<PlayIcon size={14} />}>
                        Start
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button variant="success" size="sm" onClick={() => handleStatusUpdate(task.id, 'COMPLETED')} disabled={updating === task.id} icon={<CheckCircleIcon size={14} />}>
                        Complete
                      </Button>
                    )}
                    {task.status !== 'CANCELLED' && (
                      <Button variant="ghost" size="sm" style={{ color: 'var(--color-error)' }} onClick={() => handleStatusUpdate(task.id, 'CANCELLED')} disabled={updating === task.id}>
                        <CrossIcon size={14} /> Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Completed ({completedTasks.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {completedTasks.map(task => (
                  <div key={task.id} style={{
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <strong>{task.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: '0.75rem' }}>
                        by {task.creator?.name}
                      </span>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
