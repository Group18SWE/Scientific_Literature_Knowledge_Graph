import { Link, useLocation } from 'react-router-dom';

const NODE_COLORS = { paper: '#5b9df9', model: '#f5a623', dataset: '#3ecf8e' };

export default function Navbar({ darkMode, onToggleDark, graphMeta }) {
  const location = useLocation();
  const isGraph = location.pathname === '/graph';

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
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #5b9df9 0%, #3ecf8e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
          boxShadow: '0 2px 12px rgba(91,157,249,0.35)',
        }}>R</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            ResearchGraph
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Knowledge Explorer
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[{ path: '/', label: 'Home' }, { path: '/graph', label: 'Graph' }].map(({ path, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} style={{
              padding: '5px 14px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: active ? 'var(--glow-blue)' : 'transparent',
              border: `1px solid ${active ? 'rgba(91,157,249,0.25)' : 'transparent'}`,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {isGraph && graphMeta && graphMeta.total > 0 && (
          <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
            {['paper', 'model', 'dataset'].map((t) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: NODE_COLORS[t], display: 'inline-block', boxShadow: `0 0 5px ${NODE_COLORS[t]}80` }} />
                <span style={{ color: NODE_COLORS[t], fontWeight: 600 }}>{graphMeta[t]}</span>
                {' '}{t}s
              </span>
            ))}
          </div>
        )}

        <button onClick={onToggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {darkMode ? '☀' : '◑'}
        </button>
      </div>
    </nav>
  );
}