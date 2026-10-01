import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ArrowRightIcon, BellIcon, CalendarIcon, MapPinIcon, ActivityIcon, TicketIcon, QrCodeIcon, FileTextIcon } from '../../components/common/Icons.jsx';
import './LandingStyles.css';

const features = [
  {
    icon: QrCodeIcon,
    title: 'Digital Queue Ticketing',
    description: 'Choose a department and service, then receive a ticket you can follow from the patient portal.',
  },
  {
    icon: BellIcon,
    title: 'Real-Time SMS & Email Alerts',
    description: 'Receive ticket updates through the contact channels enabled for your account and hospital service.',
  },
  {
    icon: CalendarIcon,
    title: 'Online Appointment Booking',
    description: 'Choose an available service and time slot, then review your appointment request in your account.',
  },
  {
    icon: TicketIcon,
    title: 'Live Queue Tracking',
    description: 'Track your ticket number in real-time from anywhere. View estimated wait times and the number of people ahead of you.',
  },
  {
    icon: FileTextIcon,
    title: 'Visit History',
    description: 'Review completed queue visits and the service details associated with each ticket.',
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
    description: 'Sign in, choose a department and service, and create a queue ticket online.',
    details: 'Your ticket and current queue position are available in the patient portal.'
  },
  {
    number: '02',
    title: 'Get Real-Time Updates',
    description: 'Follow your ticket status and queue position as staff update the service queue.',
    details: 'Notifications depend on the contact details and channels configured for your account.'
  },
  {
    number: '03',
    title: 'Get Served at Your Counter',
    description: 'Check your ticket for its current status and counter details when staff call you.',
    details: 'After a completed visit, you can leave feedback from your account.'
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false);
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
          <div id="landing-navigation" className={`landing-nav-links ${isMenuOpen ? 'landing-nav-links--open' : ''}`}>
            <button onClick={() => scrollToSection('features')} className="landing-nav-link">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="landing-nav-link">How It Works</button>
            <button onClick={() => scrollToSection('footer')} className="landing-nav-link">Contact</button>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="landing-nav-btn landing-nav-btn--primary">Patient Login</Link>
            <Link to="/track" onClick={() => setIsMenuOpen(false)} className="landing-nav-btn landing-nav-btn--outline">Track Ticket</Link>
          </div>
          <button
            className="landing-mobile-menu"
            type="button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="landing-navigation"
            onClick={() => setIsMenuOpen(open => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">Kilifi County Referral Hospital · Kilifi, Kenya</div>
          <h1 className="landing-hero-title">
            Queue services, made easier to follow.
          </h1>
          <p className="landing-hero-subtitle">
            Join a hospital service queue, follow your ticket, and review appointment details through the Kilifi County Referral Hospital patient portal.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="landing-hero-btn landing-hero-btn--primary">
              Patient sign in
              <ArrowRightIcon size={18} />
            </Link>
            <Link to="/register" className="landing-hero-btn landing-hero-btn--secondary">
              Create an account
            </Link>
            <Link to="/track" className="landing-hero-btn landing-hero-btn--ghost">
              Track Your Ticket
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────── */}
      <section id="features" className="landing-section landing-features">
        <div className="landing-section-header">
          <span className="landing-section-tag">Features</span>
          <h2 className="landing-section-title">Why Choose Our System?</h2>
          <p className="landing-section-desc">
            Queue tickets, appointment requests, and visit history in one place.
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

      {/* ── CTA Section ────────────────────────────────── */}
      <section className="landing-section landing-cta">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Plan your next visit</h2>
          <p className="landing-cta-desc">
            Sign in to manage queue tickets and appointment requests, or track a ticket using its code.
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
                Patient access to queue tickets, appointment requests, and visit history for Kilifi County Referral Hospital.
              </p>
              <div className="landing-footer-contact">
                <div className="landing-footer-contact-item">
                  <MapPinIcon size={14} />
                  <span>Kilifi County, Kenya</span>
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
                <li><Link to="/customer/join">Join Queue</Link></li>
                <li><Link to="/customer/appointments">Appointments</Link></li>
                <li><Link to="/customer/history">Visit History</Link></li>
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
            <a href="https://commons.wikimedia.org/wiki/File:A_patient_waiting_room_at_an_urgent_care_clinic_and_doctor%E2%80%99s_office_in_North_Carolina,_United_States_02.jpg" target="_blank" rel="noreferrer">
              Photo: Harrison Keely / Wikimedia Commons, CC BY 4.0
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
