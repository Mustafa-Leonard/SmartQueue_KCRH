import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import * as feedbackApi from '../../api/feedbackApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import { extractArray, extractData } from '../../utils/apiUtils.js';
import { 
  StarIcon, SendIcon, HistoryIcon, AlertIcon, 
  MessageIcon, CheckCircleIcon, LightbulbIcon,
  ThumbsUpIcon, ThumbsDownIcon, ClockIcon, UserIcon, BranchIcon,
  MegaphoneIcon, WalkIcon, ServiceIcon
} from '../../components/common/Icons.jsx';
import { formatDateTime } from '../../utils/formatters.js';

const FEEDBACK_CATEGORIES = [
  { value: 'GENERAL', label: 'General', icon: MessageIcon },
  { value: 'SERVICE', label: 'Service Quality', icon: ServiceIcon },
  { value: 'WAIT_TIME', label: 'Wait Time', icon: ClockIcon },
  { value: 'STAFF', label: 'Staff Attitude', icon: UserIcon },
  { value: 'FACILITY', label: 'Facility & Cleanliness', icon: BranchIcon },
  { value: 'COMMUNICATION', label: 'Communication', icon: MegaphoneIcon },
  { value: 'ACCESSIBILITY', label: 'Accessibility', icon: WalkIcon },
  { value: 'COMPLAINT', label: 'Complaint', icon: AlertIcon },
  { value: 'SUGGESTION', label: 'Suggestion', icon: LightbulbIcon },
];

export default function FeedbackPage() {
  const [myFeedback, setMyFeedback] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('feedback'); // 'feedback' | 'suggestion' | 'complaint'

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const selectedCategory = FEEDBACK_CATEGORIES.find(category => category.value === (watch('category') || 'GENERAL')) || FEEDBACK_CATEGORIES[0];
  const SelectedCategoryIcon = selectedCategory.icon;

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackRes, historyRes] = await Promise.all([
        feedbackApi.getMyFeedback(),
        ticketApi.getCustomerHistoryTickets()
      ]);
      setMyFeedback(extractArray(feedbackRes, 'feedbacks'));
      const historyPayload = extractData(historyRes);
      setCompletedTickets(historyPayload?.tickets?.filter(t => t.status === 'COMPLETED') || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onSubmit = async (data) => {
    if (rating === 0 && feedbackType !== 'suggestion') {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        comment: data.comment,
        category: feedbackType === 'suggestion' ? 'SUGGESTION' : 
                 feedbackType === 'complaint' ? 'COMPLAINT' : (data.category || 'GENERAL'),
        ticketId: data.ticketId || undefined
      };
      
      if (feedbackType !== 'suggestion') {
        payload.rating = rating;
      }

      await feedbackApi.createFeedback(payload);
      setShowSuccessModal(true);
      reset();
      setRating(0);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = myFeedback.length > 0 
    ? (myFeedback.reduce((sum, f) => sum + f.rating, 0) / myFeedback.length).toFixed(1) 
    : 0;

  const selectStyle = {
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem',
    width: '100%'
  };

  const ratingDistribution = [0, 0, 0, 0, 0];
  myFeedback.forEach(f => { if (f.rating >= 1 && f.rating <= 5) ratingDistribution[f.rating - 1]++; });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rate Your Experience</h1>
          <p>Help us improve with your feedback, suggestions, or complaints</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Submit Feedback */}
        <div>
          <Card title="Share Your Feedback">
            {/* Feedback Type Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.5rem' }}>
              {[
                { key: 'feedback', label: 'Feedback', icon: <MessageIcon size={14} /> },
                { key: 'suggestion', label: 'Suggestion', icon: <LightbulbIcon size={14} /> },
                { key: 'complaint', label: 'Complaint', icon: <AlertIcon size={14} /> },
              ].map(opt => (
                <Button
                  key={opt.key}
                  variant={feedbackType === opt.key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFeedbackType(opt.key)}
                  icon={opt.icon}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
              
              {/* Star Rating (not for suggestions) */}
              {feedbackType !== 'suggestion' && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Your Rating
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: star <= (hoverRating || rating) ? '#f59e0b' : 'var(--color-border)',
                          transition: 'color 0.15s', padding: '0 2px'
                        }}
                        aria-label={`Rate ${star} out of 5 stars`}
                        aria-pressed={rating === star}
                      >
                        <StarIcon size={28} color={star <= (hoverRating || rating) ? '#f59e0b' : 'var(--color-border)'} style={{ fill: star <= (hoverRating || rating) ? '#f59e0b' : 'transparent' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <SelectedCategoryIcon size={14} />
                  {feedbackType === 'suggestion' ? 'Suggestion Type' : feedbackType === 'complaint' ? 'Complaint Category' : 'Category'}
                </label>
                <select {...register('category')} style={selectStyle}>
                  {(feedbackType === 'suggestion' 
                    ? [{ value: 'SUGGESTION', label: 'General Suggestion' }]
                    : FEEDBACK_CATEGORIES.filter(c => 
                        feedbackType === 'complaint' 
                          ? ['SERVICE', 'WAIT_TIME', 'STAFF', 'FACILITY', 'COMMUNICATION', 'ACCESSIBILITY', 'COMPLAINT'].includes(c.value)
                          : true
                      )
                  ).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Related Ticket */}
              {completedTickets.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Related Visit (Optional)</label>
                  <select {...register('ticketId')} style={selectStyle}>
                    <option value="">-- Not related to a specific visit --</option>
                    {completedTickets.map(t => (
                      <option key={t.id} value={t.id}>{t.ticketNumber} - {t.service?.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Comment Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {feedbackType === 'suggestion' ? 'Your Suggestion' : feedbackType === 'complaint' ? 'Describe Your Issue' : 'Your Comments'}
                </label>
                <textarea
                  {...register('comment', feedbackType === 'complaint' ? { required: 'Please describe your issue' } : {})}
                  placeholder={
                    feedbackType === 'suggestion' 
                      ? 'Share your ideas for improvement...' 
                      : feedbackType === 'complaint' 
                        ? 'Please describe the issue you experienced in detail...'
                        : 'Tell us about your experience...'
                  }
                  style={{ ...selectStyle, minHeight: '100px', resize: 'vertical' }}
                />
                {errors.comment && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.comment.message}</span>}
              </div>

              <Button type="submit" variant="primary" disabled={submitting || (rating === 0 && feedbackType !== 'suggestion')} icon={<SendIcon size={16} />}>
                {submitting ? 'Submitting...' : feedbackType === 'suggestion' ? 'Submit Suggestion' : feedbackType === 'complaint' ? 'Submit Complaint' : 'Submit Feedback'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Satisfaction Analytics */}
          {myFeedback.length > 0 && (
            <Card title="Your Satisfaction Score">
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
                  {avgRating} / 5
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.15rem', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon key={star} size={20} color={star <= Math.round(parseFloat(avgRating)) ? '#f59e0b' : 'var(--color-border)'} style={{ fill: star <= Math.round(parseFloat(avgRating)) ? '#f59e0b' : 'transparent' }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Based on {myFeedback.length} review{myFeedback.length !== 1 ? 's' : ''}
                </p>
                {/* Rating Distribution Bars */}
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingDistribution[star - 1] || 0;
                    const pct = myFeedback.length > 0 ? (count / myFeedback.length) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <span style={{ width: '2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>{star}<StarIcon size={12} /></span>
                        <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '99px' }} />
                        </div>
                        <span style={{ width: '2rem', color: 'var(--color-text-secondary)' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Previous Feedback */}
          <Card title="Your Previous Feedback">
            {loading ? (
              <div style={{ display: 'flex', padding: '2rem', justifyContent: 'center' }}><Spinner size="sm" /></div>
            ) : myFeedback.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                You haven't submitted any feedback yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                {myFeedback.map(f => (
                  <div key={f.id} style={{
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarIcon key={star} size={14} color={star <= f.rating ? '#f59e0b' : 'var(--color-border)'} style={{ fill: star <= f.rating ? '#f59e0b' : 'transparent' }} />
                        ))}
                      </div>
                      <Badge variant={
                        f.category === 'COMPLAINT' ? 'error' : 
                        f.category === 'SUGGESTION' ? 'info' : 
                        f.category === 'SERVICE' ? 'info' : 
                        f.category === 'WAIT_TIME' ? 'warning' : 'default'
                      } size="sm">{f.category}</Badge>
                    </div>
                    {f.comment && <p style={{ fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>"{f.comment}"</p>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {f.ticket && <span>Ticket: {f.ticket.ticketNumber} | </span>}
                      {formatDateTime(f.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="">
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
          }}>
            <CheckCircleIcon size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {feedbackType === 'suggestion' ? 'Suggestion Received!' : feedbackType === 'complaint' ? 'Complaint Submitted' : 'Thank You for Your Feedback!'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {feedbackType === 'suggestion' 
              ? 'Your suggestion has been recorded and will be reviewed by our management team.'
              : feedbackType === 'complaint' 
                ? 'Your complaint has been logged and will be investigated. We will follow up with you.'
                : 'Your feedback helps us improve our services for everyone.'}
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Button variant="primary" onClick={() => setShowSuccessModal(false)}>Continue</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
