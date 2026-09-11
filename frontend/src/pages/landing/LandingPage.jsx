import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ArrowRightIcon, BellIcon, ClockIcon, CalendarIcon, CheckCircleIcon, MapPinIcon, PhoneIcon, MailIcon, ActivityIcon, UsersIcon, TicketIcon, QrCodeIcon, FileTextIcon, LightbulbIcon, SendIcon } from '../../components/common/Icons.jsx';
import './LandingStyles.css';

const stats = [
  { value: '5,000+', label: 'Patients Served Monthly', icon: UsersIcon },
  { value: '< 15 min', label: 'Average Wait Time', icon: ClockIcon },
  { value: '98%', label: 'Satisfaction Rate', icon: CheckCircleIcon },
  { value: '24/7', label: 'System Availability', icon: ActivityIcon },
];

const features = [
  {
    icon: QrCodeIcon,
    title: 'Digital Queue Ticketing',
    description: 'Join the queue from your phone. No need to wait in long physical lines. Receive a digital ticket instantly upon registration.',
  },
  {
    icon: BellIcon,
    title: 'Real-Time SMS & Email Alerts',
    description: 'Get notified via SMS and email when your turn approaches. Track your position live and arrive exactly when called.',
  },
  {
    icon: CalendarIcon,
    title: 'Online Appointment Booking',
    description: 'Schedule appointments in advance with preferred time slots. Reduce waiting time by booking your visit ahead of arrival.',
  },
  {
    icon: TicketIcon,
    title: 'Live Queue Tracking',
    description: 'Track your ticket number in real-time from anywhere. View estimated wait times and the number of people ahead of you.',
  },
  {
    icon: FileTextIcon,
    title: 'Digital Medical Records',
    description: 'Your visit history and medical information are securely stored and accessible across departments for seamless care.',
  },
  {
    icon: ActivityIcon,
    title: 'Department-Specific Queues',
    description: 'Queues are organized by department — OPD, Pharmacy, Laboratory, Radiology, and more. Get routed to the right service.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Join the Queue',
    description: 'Walk into the hospital or join online. Select your department and service. Receive a digital ticket number instantly.',
    details: 'Register at the kiosk, through the web portal, or via our mobile app.'
  },
  {
    number: '02',
    title: 'Get Real-Time Updates',
    description: 'Monitor your position live. Receive SMS and email alerts when your turn is approaching.',
    details: 'Track your ticket from anywhere. No need to crowd the waiting area.'
  },
  {
    number: '03',
    title: 'Get Served at Your Counter',
    description: 'Proceed to the assigned counter when called. Your ticket is validated, and service is delivered efficiently.',
    details: 'Complete service, receive a digital receipt, and provide feedback.'
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="landing-loading">
        <div className="landing-loading-spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* ── Navigation Bar ─────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <div style={{
              width: 34, height: 34, borderRadius: '8px',
              background: 'linear-gradient(135deg, hsl(226,68%,38%) 0%, hsl(172,66%,36%) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 8px hsla(226,68%,38%,0.35)',
            }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v12M6 12h12" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <span className="landing-logo-text">
              Hospital Queue Management System
            </span>
          </Link>
          <div className="landing-nav-links">
            <button onClick={() => scrollToSection('features')} className="landing-nav-link">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="landing-nav-link">How It Works</button>
            <button onClick={() => scrollToSection('footer')} className="landing-nav-link">Contact</button>
            <Link to="/login" className="landing-nav-btn landing-nav-btn--primary">Patient Login</Link>
            <Link to="/track" className="landing-nav-btn landing-nav-btn--outline">Track Ticket</Link>
          </div>
          <button className="landing-mobile-menu" aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">Kilifi County Referral Hospital</div>
          <h1 className="landing-hero-title">
            Smart Queue Management
            <span className="gradient-text"> System</span>
          </h1>
          <p className="landing-hero-subtitle">
            Eliminate long waiting lines with our digital queue system. Join remotely, 
            track your turn in real-time, and receive instant alerts when it's time to 
            be served.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="landing-hero-btn landing-hero-btn--primary">
              Get Started
              <ArrowRightIcon size={18} />
            </Link>
            <Link to="/register" className="landing-hero-btn landing-hero-btn--secondary">
              Register as Patient
            </Link>
            <Link to="/track" className="landing-hero-btn landing-hero-btn--ghost">
              Track Your Ticket
            </Link>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-value">5,000+</span>
              <span className="landing-hero-stat-label">Patients Served</span>
            </div>
            <div className="landing-hero-stat-divider" />
<div className="landing-hero-stat">
              <span className="landing-hero-stat-value">{'<15 min'}</span>
              <span className="landing-hero-stat-label">Avg. Wait Time</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-value">98%</span>
              <span className="landing-hero-stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────── */}
      <section id="features" className="landing-section landing-features">
        <div className="landing-section-header">
          <span className="landing-section-tag">Features</span>
          <h2 className="landing-section-title">Why Choose Our System?</h2>
          <p className="landing-section-desc">
            A modern, patient-centric approach to hospital queue management that enhances 
            the healthcare experience for everyone.
          </p>
        </div>
        <div className="landing-features-grid">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="landing-feature-card animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                <div className="landing-feature-icon">
                  <Icon size={24} />
                </div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-desc">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works Section ───────────────────────── */}
      <section id="how-it-works" className="landing-section landing-how-it-works">
        <div className="landing-section-header">
          <span className="landing-section-tag">How It Works</span>
          <h2 className="landing-section-title">Three Simple Steps</h2>
          <p className="landing-section-desc">
            From arrival to service, our streamlined process ensures you spend less time 
            waiting and more time receiving care.
          </p>
        </div>
        <div className="landing-steps">
          {steps.map((step, idx) => (
            <div key={idx} className="landing-step animate-fade-in-up" style={{ animationDelay: `${idx * 0.15}s` }}>
              <div className="landing-step-number">{step.number}</div>
              <div className="landing-step-connector" />
              <div className="landing-step-content">
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.description}</p>
                <p className="landing-step-detail">{step.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats Section ──────────────────────────────── */}
      <section className="landing-section landing-stats-section">
        <div className="landing-stats-grid">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="landing-stat-card animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="landing-stat-icon">
                  <Icon size={24} />
                </div>
                <span className="landing-stat-value">{stat.value}</span>
                <span className="landing-stat-label">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────── */}
      <section className="landing-section landing-cta">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Ready to Experience a Shorter Wait?</h2>
          <p className="landing-cta-desc">
            Join thousands of patients who have already embraced digital queue management 
            at Kilifi County Referral Hospital.
          </p>
          <div className="landing-cta-actions">
            <Link to="/login" className="landing-hero-btn landing-hero-btn--primary">
              Patient Login
              <ArrowRightIcon size={18} />
            </Link>
            <Link to="/register" className="landing-hero-btn landing-hero-btn--secondary">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer id="footer" className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-grid">
            {/* Brand */}
            <div className="landing-footer-brand">
              <div className="landing-footer-logo">
                <div style={{
                  width: 28, height: 28, borderRadius: '7px',
                  background: 'linear-gradient(135deg, hsl(226,68%,38%) 0%, hsl(172,66%,36%) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 6v12M6 12h12" />
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
                <span>Hospital Queue Management System</span>
              </div>
              <p className="landing-footer-desc">
                Kilifi County Referral Hospital's digital queue management system. 
                Modernizing patient flow for better healthcare delivery.
              </p>
              <div className="landing-footer-contact">
                <div className="landing-footer-contact-item">
                  <MapPinIcon size={14} />
                  <span>Kilifi Town, Kilifi County, Kenya</span>
                </div>
                <div className="landing-footer-contact-item">
                  <PhoneIcon size={14} />
                  <span>+254 712 345 678</span>
                </div>
                <div className="landing-footer-contact-item">
                  <MailIcon size={14} />
                  <span>info@kcrh.go.ke</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="landing-footer-col">
              <h4 className="landing-footer-col-title">Quick Links</h4>
              <ul className="landing-footer-links">
                <li><Link to="/login">Patient Login</Link></li>
                <li><Link to="/register">Register Account</Link></li>
                <li><Link to="/track">Track Ticket</Link></li>
                <li><Link to="/display">Display Board</Link></li>
              </ul>
            </div>

            {/* For Patients */}
            <div className="landing-footer-col">
              <h4 className="landing-footer-col-title">For Patients</h4>
              <ul className="landing-footer-links">
                <li><Link to="/join">Join Queue</Link></li>
                <li><Link to="/appointment">Book Appointment</Link></li>
                <li><Link to="/customer/history">Queue History</Link></li>
                <li><Link to="/customer/feedback">Give Feedback</Link></li>
              </ul>
            </div>

            {/* Hospital */}
            <div className="landing-footer-col">
              <h4 className="landing-footer-col-title">Hospital</h4>
              <ul className="landing-footer-links">
                <li><span>Outpatient Department</span></li>
                <li><span>Pharmacy</span></li>
                <li><span>Laboratory</span></li>
                <li><span>Radiology</span></li>
                <li><span>Maternal & Child Health</span></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <p>&copy; {new Date().getFullYear()} Kilifi County Referral Hospital. All rights reserved.</p>
            <div className="landing-footer-bottom-links">
              <Link to="/login">Privacy Policy</Link>
              <span className="landing-footer-dot">·</span>
              <Link to="/login">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
