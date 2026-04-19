export const NODE_CONFIG = {
  paper:   { color: '#5b9df9', glow: '#3b82f6', radius: 16, label: 'Paper',   shape: 'circle'   },
  model:   { color: '#f59e0b', glow: '#d97706', radius: 13, label: 'Model',   shape: 'triangle'  },
  dataset: { color: '#10b981', glow: '#059669', radius: 13, label: 'Dataset', shape: 'diamond'   },
  author:  { color: '#fb923c', glow: '#ea580c', radius: 11, label: 'Author',  shape: 'square'    },
};

export const EDGE_CONFIG = {
  uses_model:   { color: '#f59e0b99', width: 1.5, label: 'Uses Model',   dashed: false },
  uses_dataset: { color: '#10b98199', width: 1.5, label: 'Uses Dataset', dashed: true  },
  cites:        { color: '#5b9df999', width: 1.2, label: 'Cites',        dashed: false },
  written_by:   { color: '#fb923c99', width: 1.2, label: 'Written By',   dashed: true  },
  connected_to: { color: '#6b728055', width: 1.0, label: 'Connected',    dashed: false },
};

export default function Legend() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      padding: '12px 14px',
      minWidth: 155,
      boxShadow: 'var(--shadow-md)',
    }}>
      <div className="section-label">Legend</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
          Nodes
        </div>
        {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <NodeIcon type={type} color={cfg.color} size={13} />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{cfg.label}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
          Edges
        </div>
        {Object.entries(EDGE_CONFIG).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <svg width="22" height="8">
              <line x1="0" y1="4" x2="22" y2="4"
                stroke={cfg.color} strokeWidth="1.5"
                strokeDasharray={cfg.dashed ? '3,2' : '0'} />
            </svg>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NodeIcon({ type, color, size = 13 }) {
  const cfg = NODE_CONFIG[type] || NODE_CONFIG.paper;
  const c = color || cfg.color;
  const r = size / 2;

  if (type === 'paper') {
    return (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
        <circle r={r - 0.5} fill={c + '22'} stroke={c} strokeWidth="1.5" />
        <circle r={r * 0.35} fill={c} />
      </svg>
    );
  }
  if (type === 'model') {
    return (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
        <path d={`M0,${-(r - 0.5)} L${r - 0.5},${r - 0.5} L${-(r - 0.5)},${r - 0.5} Z`} fill={c + '22'} stroke={c} strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === 'dataset') {
    return (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
        <path d={`M0,${-(r - 0.5)} L${r - 0.5},0 L0,${r - 0.5} L${-(r - 0.5)},0 Z`} fill={c + '22'} stroke={c} strokeWidth="1.5" />
        <circle r={r * 0.28} fill={c} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
      <rect x={-r + 0.5} y={-r + 0.5} width={size - 1} height={size - 1} rx="2" fill={c + '22'} stroke={c} strokeWidth="1.5" />
      <rect x={-r * 0.4} y={-r * 0.4} width={r * 0.8} height={r * 0.8} rx="1" fill={c} />
    </svg>
  );
}
