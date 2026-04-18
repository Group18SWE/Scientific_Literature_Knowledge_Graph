export const NODE_CONFIG = {
  paper:   { color: '#5b9df9', glow: '#3b82f6', radius: 18, label: 'Paper' },
  model:   { color: '#f5a623', glow: '#d97706', radius: 14, label: 'Model' },
  dataset: { color: '#3ecf8e', glow: '#10b981', radius: 14, label: 'Dataset' },
};

export const EDGE_CONFIG = {
  uses_model:   { color: '#f5a62399', width: 1.5, label: 'Uses Model',   dashed: false },
  uses_dataset: { color: '#3ecf8e99', width: 1.5, label: 'Uses Dataset', dashed: true },
  connected_to: { color: '#5b9df955', width: 1.5, label: 'Connected',    dashed: false },
  cites:        { color: '#a78bfa99', width: 1.5, label: 'Cites',        dashed: false },
  written_by:   { color: '#f8717199', width: 1.5, label: 'Written By',   dashed: true },
};

export default function Legend() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      padding: '12px 14px',
      minWidth: 155,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div className="section-label">Legend</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
          Nodes
        </div>
        {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <NodeIcon type={type} color={cfg.color} />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
          Edges
        </div>
        {Object.entries(EDGE_CONFIG).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <svg width="22" height="8">
              <line x1="0" y1="4" x2="22" y2="4"
                stroke={cfg.color} strokeWidth="1.5"
                strokeDasharray={cfg.dashed ? '3,2' : '0'} />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NodeIcon({ type, color, size = 14 }) {
  const cfg = NODE_CONFIG[type];
  const c = color || cfg?.color || '#888';
  if (type === 'paper') return (
    <svg width={size} height={size} viewBox="-7 -7 14 14">
      <circle r="6" fill={c + '22'} stroke={c} strokeWidth="1.5" />
      <circle r="2.5" fill={c} />
    </svg>
  );
  if (type === 'model') return (
    <svg width={size} height={size} viewBox="-7 -7 14 14">
      <path d="M0,-6 L6,0 L0,6 L-6,0 Z" fill={c + '22'} stroke={c} strokeWidth="1.5" />
      <path d="M0,-2.5 L2.5,0 L0,2.5 L-2.5,0 Z" fill={c} />
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="-7 -7 14 14">
      <rect x="-6" y="-6" width="12" height="12" rx="2" fill={c + '22'} stroke={c} strokeWidth="1.5" />
      <rect x="-2.5" y="-2.5" width="5" height="5" rx="1" fill={c} />
    </svg>
  );
}