import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/',      label: 'Home'  },
  { path: '/graph', label: 'Graph' },
];

export default function Navbar({ darkMode, onToggleDark }) {
  const location = useLocation();

  return (
    <nav style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
      padding: '0 20px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, #5b9df9 0%, #10b981 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
          boxShadow: '0 2px 10px rgba(91,157,249,0.35)',
        }}>R</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            ResearchGraph
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
            Knowledge Explorer
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3 }}>
        {NAV_LINKS.map(({ path, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: active ? 'var(--glow-blue)' : 'transparent',
                border: `1px solid ${active ? 'rgba(91,157,249,0.25)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onToggleDark}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.background = 'var(--glow-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
        >
          {darkMode ? '☀' : '◑'}
        </button>
      </div>
    </nav>
  );
}
