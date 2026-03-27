'use client';

import { useState } from 'react';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

/* ── Design tokens ── */
const C = {
  primary:   '#E8B4B8',
  secondary: '#A8D5BA',
  cta:       '#D4AF37',
  ctaDark:   '#B8962E',
  bg:        '#FFF5F5',
  text:      '#2D3436',
  muted:     '#636e72',
  white:     '#FFFFFF',
  primaryTint:   'rgba(232,180,184,0.12)',
  secondaryTint: 'rgba(168,213,186,0.15)',
  ctaTint:       'rgba(212,175,55,0.12)',
  shadow:    '0 4px 24px rgba(45,52,54,0.08)',
  shadowHov: '0 8px 40px rgba(45,52,54,0.14)',
};

/* ── SVG icons ── */
function LeafIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}

function SparkleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}

function FlowerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2a3 3 0 0 0-3 3c0 1.06.55 2 1.37 2.54A7 7 0 0 0 5 12a7 7 0 0 0 5.37 6.81 3 3 0 0 0 3.26 0A7 7 0 0 0 19 12a7 7 0 0 0-5.37-5.46A3 3 0 0 0 15 5a3 3 0 0 0-3-3z"/>
    </svg>
  );
}

function DropletIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
    </svg>
  );
}

function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function HeartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}

function StarIcon({ size = 16, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? C.cta : 'none'} stroke={C.cta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function MapPinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function PhoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function ClockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function ChevronDownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

/* ── Data ── */
const SERVICES = [
  {
    icon: <DropletIcon size={28} />,
    name: 'Signature Massage',
    desc: 'A bespoke blend of Swedish and deep tissue techniques, tailored to your body\'s unique needs for total relief.',
    duration: '60 / 90 min',
    price: 'From $95',
    accent: C.primary,
  },
  {
    icon: <SparkleIcon size={28} />,
    name: 'Radiance Facial',
    desc: 'Restore luminosity with our signature facial — a curated ritual of cleanse, exfoliation, and botanical infusion.',
    duration: '75 min',
    price: 'From $110',
    accent: C.secondary,
  },
  {
    icon: <FlowerIcon size={28} />,
    name: 'Hot Stone Therapy',
    desc: 'Smooth volcanic stones warm the deepest muscle layers, dissolving tension and grounding your entire being.',
    duration: '90 min',
    price: 'From $130',
    accent: C.primary,
  },
  {
    icon: <LeafIcon size={28} />,
    name: 'Aromatherapy Journey',
    desc: 'Pure essential oil blends guide your senses on a calming journey — breathe, soften, and surrender to stillness.',
    duration: '60 min',
    price: 'From $85',
    accent: C.secondary,
  },
  {
    icon: <SunIcon size={28} />,
    name: 'Luminous Body Polish',
    desc: 'A full-body exfoliation and hydration ritual leaving skin impossibly soft, glowing, and renewed.',
    duration: '60 min',
    price: 'From $100',
    accent: C.primary,
  },
  {
    icon: <HeartIcon size={28} />,
    name: 'Couples Retreat',
    desc: 'Share a private sanctuary with your partner — side-by-side treatments in our exclusive couples suite.',
    duration: '90 min',
    price: 'From $220',
    accent: C.secondary,
  },
];

const TESTIMONIALS = [
  {
    quote: 'Walking through those doors, every worry I carried simply dissolved. The Radiance Facial left my skin transformed — and my spirit even more so.',
    name: 'Amara L.',
    title: 'Regular Guest',
    rating: 5,
  },
  {
    quote: 'The hot stone therapy was the most deeply relaxing experience of my life. The therapists here possess a rare gift — they truly listen to your body.',
    name: 'Catherine M.',
    title: 'Spa Enthusiast',
    rating: 5,
  },
  {
    quote: 'We celebrated our anniversary here and it was flawless. The couples suite felt like our own private sanctuary. We\'ll return every year.',
    name: 'James & Priya R.',
    title: 'Anniversary Guests',
    rating: 5,
  },
];

/* ── Booking Form Component ── */
function BookingForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', service: '', date: '', notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${focused === field ? C.primary : 'rgba(45,52,54,0.15)'}`,
    borderRadius: 10,
    background: C.white,
    fontFamily: 'var(--font-montserrat)',
    fontSize: 14,
    color: C.text,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
    boxShadow: focused === field ? `0 0 0 3px rgba(232,180,184,0.2)` : 'none',
  });

  if (submitted) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        background: C.secondaryTint,
        borderRadius: 20,
        border: `1px solid rgba(168,213,186,0.3)`,
      }}>
        <div style={{ color: C.secondary, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <HeartIcon size={40} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, color: C.text, marginBottom: 8 }}>
          Thank You, {form.name.split(' ')[0]}
        </h3>
        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          We&apos;ve received your request and will confirm your appointment within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Full Name *
          </label>
          <input
            required
            type="text"
            placeholder="Your name"
            value={form.name}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle('name')}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Email *
          </label>
          <input
            required
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle('email')}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Phone
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={inputStyle('phone')}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Preferred Date
          </label>
          <input
            type="date"
            value={form.date}
            onFocus={() => setFocused('date')}
            onBlur={() => setFocused(null)}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={inputStyle('date')}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Service *
        </label>
        <div style={{ position: 'relative' }}>
          <select
            required
            value={form.service}
            onFocus={() => setFocused('service')}
            onBlur={() => setFocused(null)}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            style={{ ...inputStyle('service'), appearance: 'none', cursor: 'pointer', paddingRight: 40 }}
          >
            <option value="">Select a treatment…</option>
            {SERVICES.map((s) => (
              <option key={s.name} value={s.name}>{s.name} — {s.price}</option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.muted }}>
            <ChevronDownIcon size={16} />
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Special Requests
        </label>
        <textarea
          rows={3}
          placeholder="Any preferences, sensitivities, or notes for your therapist…"
          value={form.notes}
          onFocus={() => setFocused('notes')}
          onBlur={() => setFocused(null)}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          style={{ ...inputStyle('notes'), resize: 'vertical', minHeight: 80, fontFamily: 'var(--font-montserrat)' }}
        />
      </div>

      <button
        type="submit"
        style={{
          background: C.cta,
          color: C.white,
          border: 'none',
          borderRadius: 10,
          padding: '14px 32px',
          fontFamily: 'var(--font-montserrat)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 200ms ease, transform 150ms ease, box-shadow 200ms ease',
          boxShadow: `0 4px 16px rgba(212,175,55,0.3)`,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = C.ctaDark;
          (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(212,175,55,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = C.cta;
          (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(212,175,55,0.3)';
        }}
      >
        Request Appointment
      </button>
    </form>
  );
}

/* ══════════════════ Page ══════════════════ */
export default function SerenitySpaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className={`${cormorant.variable} ${montserrat.variable}`}
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: 'var(--font-montserrat)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition: none !important; animation: none !important; }
        }
        .spa-nav-link:hover { color: ${C.primary} !important; }
        .spa-service-card:hover {
          transform: translateY(-4px);
          box-shadow: ${C.shadowHov} !important;
        }
        .spa-testimonial-card:hover { transform: translateY(-2px); }
        .spa-social-btn:hover { background: rgba(232,180,184,0.15) !important; color: ${C.primary} !important; }
        .spa-outline-btn:hover { background: ${C.primary} !important; color: white !important; border-color: ${C.primary} !important; }
        *:focus-visible {
          outline: 2px solid ${C.primary};
          outline-offset: 3px;
          border-radius: 4px;
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── Navigation ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(255,245,245,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(232,180,184,0.2)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <a href="#hero" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: C.primary }}>
              <LeafIcon size={22} />
            </div>
            <span style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 24,
              fontWeight: 600,
              color: C.text,
              letterSpacing: '0.04em',
            }}>
              Serenity Spa
            </span>
          </a>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="spa-desktop-nav">
            {[['#services', 'Services'], ['#testimonials', 'Reviews'], ['#booking', 'Book'], ['#contact', 'Contact']].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="spa-nav-link"
                style={{
                  textDecoration: 'none',
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.muted,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  transition: 'color 200ms ease',
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="#booking"
              style={{
                background: C.cta,
                color: C.white,
                textDecoration: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                fontFamily: 'var(--font-montserrat)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'background 200ms ease, transform 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLAnchorElement).style.background = C.ctaDark;
                (e.target as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLAnchorElement).style.background = C.cta;
                (e.target as HTMLAnchorElement).style.transform = 'translateY(0)';
              }}
            >
              Book Now
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.text,
              padding: 8,
            }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen
                ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
                : <><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{
            borderTop: '1px solid rgba(232,180,184,0.2)',
            padding: '16px 0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {[['#services', 'Services'], ['#testimonials', 'Reviews'], ['#booking', 'Book Now'], ['#contact', 'Contact']].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  padding: '12px 24px',
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.text,
                  letterSpacing: '0.04em',
                  transition: 'color 200ms ease',
                }}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 72,
        }}
      >
        {/* Organic background shapes */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: 600, height: 600,
            borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
            background: `radial-gradient(circle, rgba(232,180,184,0.28) 0%, transparent 70%)`,
          }} />
          <div style={{
            position: 'absolute', bottom: '-15%', left: '-8%',
            width: 500, height: 500,
            borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%',
            background: `radial-gradient(circle, rgba(168,213,186,0.22) 0%, transparent 70%)`,
          }} />
          <div style={{
            position: 'absolute', top: '30%', left: '15%',
            width: 300, height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)`,
          }} />
        </div>

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '80px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          width: '100%',
        }}>
          {/* Hero text */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: C.primaryTint,
              border: `1px solid rgba(232,180,184,0.3)`,
              borderRadius: 100,
              padding: '6px 16px',
              marginBottom: 28,
            }}>
              <div style={{ color: C.primary }}><SparkleIcon size={14} /></div>
              <span style={{
                fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 600,
                color: C.primary, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                Premium Wellness Sanctuary
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(48px, 6vw, 78px)',
              fontWeight: 600,
              lineHeight: 1.1,
              color: C.text,
              marginBottom: 24,
              letterSpacing: '-0.01em',
            }}>
              Discover{' '}
              <em style={{ color: C.primary, fontStyle: 'italic' }}>Your</em>
              <br />Inner Serenity
            </h1>

            <p style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: 16,
              lineHeight: 1.8,
              color: C.muted,
              marginBottom: 40,
              maxWidth: 440,
            }}>
              A haven of calm in the heart of the city. Where expert hands,
              ancient rituals, and pure intention converge to restore your
              body, mind, and spirit.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a
                href="#booking"
                style={{
                  background: C.cta,
                  color: C.white,
                  textDecoration: 'none',
                  padding: '16px 36px',
                  borderRadius: 12,
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'all 200ms ease',
                  boxShadow: `0 4px 20px rgba(212,175,55,0.35)`,
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.background = C.ctaDark;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = '0 8px 32px rgba(212,175,55,0.45)';
                }}
                onMouseLeave={(e) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.background = C.cta;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = '0 4px 20px rgba(212,175,55,0.35)';
                }}
              >
                Book Your Escape
              </a>

              <a
                href="#services"
                className="spa-outline-btn"
                style={{
                  background: 'transparent',
                  color: C.text,
                  textDecoration: 'none',
                  padding: '16px 36px',
                  borderRadius: 12,
                  border: `1.5px solid rgba(45,52,54,0.2)`,
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'all 200ms ease',
                  display: 'inline-block',
                }}
              >
                Explore Services
              </a>
            </div>

            {/* Trust badges */}
            <div style={{
              display: 'flex', gap: 32, marginTop: 48, paddingTop: 40,
              borderTop: '1px solid rgba(45,52,54,0.08)',
            }}>
              {[['12+', 'Expert Therapists'], ['4.9★', 'Guest Rating'], ['8K+', 'Happy Guests']].map(([val, label]) => (
                <div key={label}>
                  <div style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: 30,
                    fontWeight: 600,
                    color: C.text,
                    lineHeight: 1,
                  }}>
                    {val}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: 11,
                    color: C.muted,
                    marginTop: 4,
                    letterSpacing: '0.04em',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: 460,
              aspectRatio: '4/5',
              borderRadius: '40% 60% 55% 45% / 45% 40% 60% 55%',
              background: `linear-gradient(135deg, rgba(232,180,184,0.5) 0%, rgba(168,213,186,0.4) 50%, rgba(212,175,55,0.15) 100%)`,
              boxShadow: `0 24px 80px rgba(232,180,184,0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Decorative content inside hero visual */}
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ color: C.primary, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <LeafIcon size={64} />
                </div>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: 20,
                  fontStyle: 'italic',
                  color: C.text,
                  opacity: 0.7,
                  lineHeight: 1.6,
                }}>
                  &ldquo;Where stillness becomes your greatest luxury&rdquo;
                </p>
              </div>

              {/* Floating badge */}
              <div style={{
                position: 'absolute',
                bottom: -20,
                right: -20,
                background: C.white,
                borderRadius: 16,
                padding: '16px 20px',
                boxShadow: `0 8px 32px rgba(45,52,54,0.12)`,
                border: `1px solid rgba(232,180,184,0.2)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: C.cta }}>
                    <StarIcon size={14} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.text,
                  }}>
                    Voted #1 Urban Spa 2024
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" style={{ padding: '96px 24px', background: C.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ color: C.secondary }}><FlowerIcon size={20} /></div>
            </div>
            <div style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 600,
              color: C.secondary, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              Our Offerings
            </div>
            <h2 style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 600,
              color: C.text,
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Treatments Crafted{' '}
              <em style={{ color: C.secondary, fontStyle: 'italic' }}>for You</em>
            </h2>
            <p style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: 15,
              color: C.muted,
              lineHeight: 1.8,
              maxWidth: 520,
              margin: '0 auto',
            }}>
              Each service is a carefully composed ritual — drawing from global
              wellness traditions and tailored to your individual needs.
            </p>
          </div>

          {/* Services grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="spa-service-card"
                style={{
                  background: C.bg,
                  borderRadius: 20,
                  padding: 32,
                  border: '1px solid rgba(232,180,184,0.15)',
                  boxShadow: C.shadow,
                  transition: 'transform 250ms ease, box-shadow 250ms ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 14,
                  background: service.accent === C.primary ? C.primaryTint : C.secondaryTint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: service.accent,
                  marginBottom: 20,
                }}>
                  {service.icon}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: 10,
                  lineHeight: 1.2,
                }}>
                  {service.name}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.75,
                  marginBottom: 20,
                }}>
                  {service.desc}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 16,
                  borderTop: '1px solid rgba(45,52,54,0.07)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-montserrat)', fontSize: 12, color: C.muted,
                  }}>
                    {service.duration}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-montserrat)', fontSize: 13, fontWeight: 600,
                    color: service.accent,
                  }}>
                    {service.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a
              href="#booking"
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: C.text,
                textDecoration: 'none',
                padding: '14px 36px',
                borderRadius: 10,
                border: `1.5px solid rgba(45,52,54,0.2)`,
                fontFamily: 'var(--font-montserrat)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 200ms ease',
              }}
              className="spa-outline-btn"
            >
              Book a Treatment
            </a>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="testimonials"
        style={{
          padding: '96px 24px',
          background: `linear-gradient(160deg, rgba(232,180,184,0.08) 0%, rgba(168,213,186,0.08) 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,180,184,0.1), transparent)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ color: C.cta }}><StarIcon size={20} /></div>
            </div>
            <div style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 600,
              color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              Guest Stories
            </div>
            <h2 style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 600,
              color: C.text,
              lineHeight: 1.15,
            }}>
              Words from Our{' '}
              <em style={{ color: C.primary, fontStyle: 'italic' }}>Guests</em>
            </h2>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="spa-testimonial-card"
                style={{
                  background: C.white,
                  borderRadius: 20,
                  padding: 36,
                  boxShadow: C.shadow,
                  border: '1px solid rgba(232,180,184,0.15)',
                  transition: 'transform 250ms ease',
                }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <StarIcon key={s} size={15} filled />
                  ))}
                </div>

                {/* Opening quote mark */}
                <div style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: 72,
                  color: C.primary,
                  lineHeight: 0.6,
                  marginBottom: 16,
                  opacity: 0.6,
                }}>
                  &ldquo;
                </div>

                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: 18,
                  fontStyle: 'italic',
                  color: C.text,
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}>
                  {t.quote}
                </p>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  paddingTop: 20,
                  borderTop: '1px solid rgba(45,52,54,0.07)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: i % 2 === 0 ? C.primaryTint : C.secondaryTint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i % 2 === 0 ? C.primary : C.secondary,
                    flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, fontWeight: 600 }}>
                      {t.name[0]}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, fontWeight: 600, color: C.text }}>
                      {t.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {t.title}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA after testimonials */}
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <a
              href="#booking"
              style={{
                background: C.cta,
                color: C.white,
                textDecoration: 'none',
                padding: '16px 40px',
                borderRadius: 12,
                fontFamily: 'var(--font-montserrat)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 200ms ease',
                boxShadow: `0 4px 20px rgba(212,175,55,0.3)`,
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                const el = e.target as HTMLAnchorElement;
                el.style.background = C.ctaDark;
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.target as HTMLAnchorElement;
                el.style.background = C.cta;
                el.style.transform = 'translateY(0)';
              }}
            >
              Begin Your Journey
            </a>
            <p style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 12,
              color: C.muted, marginTop: 12, letterSpacing: '0.04em',
            }}>
              Join 8,000+ guests who found their calm
            </p>
          </div>
        </div>
      </section>

      {/* ── Booking ── */}
      <section id="booking" style={{ padding: '96px 24px', background: C.white }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start',
        }}>
          {/* Left — info */}
          <div>
            <div style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 600,
              color: C.primary, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              Reserve Your Visit
            </div>
            <h2 style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 600, color: C.text, lineHeight: 1.15, marginBottom: 20,
            }}>
              Your{' '}
              <em style={{ color: C.primary, fontStyle: 'italic' }}>Sanctuary</em>
              <br />Awaits
            </h2>
            <p style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 15, color: C.muted,
              lineHeight: 1.8, marginBottom: 40, maxWidth: 400,
            }}>
              Reserve your treatment and let us prepare a bespoke experience
              for you. We respond to all requests within 24 hours.
            </p>

            {/* What to expect */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: <SparkleIcon size={18} />, title: 'Personalised Welcome', desc: 'A pre-treatment consultation with your therapist to tailor every detail.' },
                { icon: <LeafIcon size={18} />, title: 'Premium Amenities', desc: 'Organic robes, botanical teas, and our signature relaxation lounge.' },
                { icon: <HeartIcon size={18} />, title: 'Aftercare Guidance', desc: 'Post-treatment recommendations to extend your results at home.' },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: C.primaryTint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.primary, flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                      {item.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div style={{
            background: C.bg,
            borderRadius: 24,
            padding: 40,
            boxShadow: C.shadow,
            border: '1px solid rgba(232,180,184,0.15)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-cormorant)', fontSize: 26,
              fontWeight: 600, color: C.text, marginBottom: 24,
            }}>
              Request an Appointment
            </h3>
            <BookingForm />
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section
        id="contact"
        style={{
          padding: '80px 24px 0',
          background: `linear-gradient(180deg, ${C.bg} 0%, rgba(232,180,184,0.08) 100%)`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginBottom: 64,
          }}>
            {/* Brand column */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ color: C.primary }}><LeafIcon size={20} /></div>
                <span style={{
                  fontFamily: 'var(--font-cormorant)', fontSize: 22,
                  fontWeight: 600, color: C.text, letterSpacing: '0.04em',
                }}>
                  Serenity Spa
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-montserrat)', fontSize: 13, color: C.muted,
                lineHeight: 1.8, marginBottom: 24, maxWidth: 240,
              }}>
                A premium wellness sanctuary dedicated to restoring balance and beauty.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[<InstagramIcon key="ig" size={18} />, <FacebookIcon key="fb" size={18} />].map((icon, i) => (
                  <button
                    key={i}
                    className="spa-social-btn"
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      border: '1.5px solid rgba(45,52,54,0.12)',
                      background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.muted, cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                    aria-label={i === 0 ? 'Instagram' : 'Facebook'}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 style={{
                fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 700,
                color: C.text, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20,
              }}>
                Treatments
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SERVICES.slice(0, 4).map((s) => (
                  <a key={s.name} href="#services" style={{
                    textDecoration: 'none', fontFamily: 'var(--font-montserrat)',
                    fontSize: 13, color: C.muted, transition: 'color 200ms ease',
                  }}
                  className="spa-nav-link">
                    {s.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div>
              <h4 style={{
                fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 700,
                color: C.text, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20,
              }}>
                Find Us
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <MapPinIcon size={16} />, text: '240 Tranquil Lane, Suite 5\nNew York, NY 10001' },
                  { icon: <PhoneIcon size={16} />, text: '+1 (212) 555-0180' },
                  { icon: <MailIcon size={16} />, text: 'hello@serenityspa.com' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ color: C.primary, flexShrink: 0, marginTop: 1 }}>{item.icon}</div>
                    <span style={{
                      fontFamily: 'var(--font-montserrat)', fontSize: 13, color: C.muted,
                      lineHeight: 1.6, whiteSpace: 'pre-line',
                    }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 style={{
                fontFamily: 'var(--font-montserrat)', fontSize: 11, fontWeight: 700,
                color: C.text, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20,
              }}>
                Hours
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Mon – Fri', '9:00 am – 8:00 pm'],
                  ['Saturday', '9:00 am – 6:00 pm'],
                  ['Sunday', '10:00 am – 5:00 pm'],
                ].map(([day, time]) => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 12, color: C.text, fontWeight: 500 }}>
                      {day}
                    </span>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 12, color: C.muted }}>
                      {time}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginTop: 8, padding: '8px 12px',
                  background: C.secondaryTint,
                  borderRadius: 8,
                  border: `1px solid rgba(168,213,186,0.25)`,
                }}>
                  <div style={{ color: C.secondary }}><ClockIcon size={13} /></div>
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 11, color: C.secondary, fontWeight: 600 }}>
                    Open Today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div style={{
            borderTop: '1px solid rgba(45,52,54,0.08)',
            padding: '24px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 12, color: C.muted }}>
              &copy; {new Date().getFullYear()} Serenity Spa. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy Policy', 'Terms of Service', 'Gift Cards'].map((link) => (
                <a key={link} href="#" style={{
                  textDecoration: 'none', fontFamily: 'var(--font-montserrat)',
                  fontSize: 12, color: C.muted, transition: 'color 200ms ease',
                }}
                className="spa-nav-link">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Responsive overrides ── */}
      <style>{`
        @media (max-width: 1024px) {
          .spa-desktop-nav { display: none !important; }
          button[aria-label="Toggle menu"] { display: flex !important; }
        }
        @media (max-width: 768px) {
          #hero > div { grid-template-columns: 1fr !important; }
          #hero > div > div:last-child { display: none !important; }
          #services > div > div:last-of-type { grid-template-columns: 1fr !important; }
          #testimonials > div > div:last-of-type { grid-template-columns: 1fr !important; }
          #booking > div { grid-template-columns: 1fr !important; gap: 40px !important; }
          #contact > div > div:first-of-type { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          #contact > div > div:first-of-type { grid-template-columns: 1fr !important; }
          #hero > div { padding: 40px 0 !important; }
        }
      `}</style>
    </div>
  );
}
