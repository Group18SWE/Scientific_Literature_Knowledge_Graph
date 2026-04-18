import { NODE_CONFIG } from './Legend';

export default function NodeDetailsPanel({ node, neighborIds, graphData, onClose, onSelectNode, darkMode }) {
  if (!node) return null;

  const bg = darkMode ? '#060d1a' : '#ffffff';
  const border = darkMode ? '#0f1f36' : '#e2e8f0';
  const labelColor = darkMode ? '#1e3a5f' : '#94a3b8';
  const mutedColor = darkMode ? '#334155' : '#94a3b8';
  const textColor = darkMode ? '#94a3b8' : '#475569';
  const titleColor = darkMode ? '#f1f5f9' : '#0f172a';
  const cardBg = darkMode ? '#0a1628' : '#f8fafc';
  const cardBorder = darkMode ? '#1e3a5f' : '#e2e8f0';

  const cfg = NODE_CONFIG[node.type];
  const m = node.metadata || {};

  const neighbors = [...neighborIds]
    .map((id) => graphData.nodes.find((n) => n.id === id))
    .filter(Boolean);

  const rows = [
    ['Year',           m.year],
    ['Published',      m.publicationDate],
    ['Venue',          m.publicationVenue?.name || m.venue],
    ['Pub. Types',     m.publicationTypes?.join(', ')],
    ['arXiv ID',       m.arxivId],
    ['Citations',      m.citationCount?.toLocaleString()],
    ['Influential',    m.influentialCitationCount?.toLocaleString()],
    ['References',     m.referenceCount?.toLocaleString()],
    ['Fields',         m.fieldsOfStudy?.join(', ')],
    ['Task',           m.task],
    ['Framework',      m.framework],
    ['Parameters',     m.paramCount],
    ['Size',           m.size],
  ].filter(([, v]) => v != null && v !== '');

  return (
    <aside
      className="animate-fade-up flex flex-col gap-4 overflow-y-auto shrink-0"
      style={{ width: 290, background: bg, borderLeft: `1px solid ${border}`, padding: '18px 16px' }}
    >
      <div className="flex items-start justify-between">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider"
          style={{
            background: cfg.color + '20',
            color: cfg.color,
            border: `1px solid ${cfg.color}44`,
          }}
        >
          <NodeIcon type={node.type} />
          {node.type.toUpperCase()}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-lg leading-none transition-all"
          style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div>
        <h2
          className="font-semibold leading-snug mb-1.5"
          style={{ fontSize: 14, color: titleColor, fontFamily: 'var(--font-sans)' }}
        >
          {m.title || node.label}
        </h2>
        {m.authors && m.authors.length > 0 && (
          <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
            {m.authors.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')}
          </p>
        )}
      </div>

      {m.tldr?.text && (
        <div
          className="rounded-lg p-3"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="text-xs font-bold tracking-widest mb-1.5" style={{ color: labelColor, fontSize: 9 }}>
            TL;DR
          </div>
          <p className="text-xs leading-relaxed" style={{ color: textColor }}>
            {m.tldr.text}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between items-start gap-3">
              <span
                className="text-xs shrink-0"
                style={{ color: labelColor, fontSize: 9, letterSpacing: '0.08em', paddingTop: 1 }}
              >
                {String(k).toUpperCase()}
              </span>
              <span className="text-xs text-right" style={{ color: textColor }}>
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {m.isOpenAccess != null && (
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold tracking-wider"
            style={{
              background: m.isOpenAccess ? '#22c55e18' : '#ef444418',
              color:      m.isOpenAccess ? '#22c55e'   : '#ef4444',
              border: `1px solid ${m.isOpenAccess ? '#22c55e44' : '#ef444444'}`,
              fontSize: 9,
            }}
          >
            {m.isOpenAccess ? '✓ OPEN ACCESS' : '⊘ CLOSED'}
          </span>
          {m.openAccessPdf?.url && (
            <a
              href={m.openAccessPdf.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs transition-colors"
              style={{ color: '#38bdf8', textDecoration: 'none' }}
            >
              PDF ↗
            </a>
          )}
        </div>
      )}

      {m.abstract && (
        <div>
          <div
            className="text-xs font-semibold tracking-widest mb-1.5"
            style={{ color: labelColor, fontSize: 9 }}
          >
            ABSTRACT
          </div>
          <p className="text-xs leading-relaxed" style={{ color: textColor }}>
            {m.abstract.length > 280 ? m.abstract.slice(0, 280) + '…' : m.abstract}
          </p>
        </div>
      )}

      {neighbors.length > 0 && (
        <div>
          <div
            className="text-xs font-semibold tracking-widest mb-2"
            style={{ color: labelColor, fontSize: 9 }}
          >
            CONNECTIONS ({neighbors.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {neighbors.map((n) => {
              const ncfg = NODE_CONFIG[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => onSelectNode(n)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
                    color: textColor,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = ncfg.color;
                    e.currentTarget.style.color = ncfg.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#1e293b' : '#e2e8f0';
                    e.currentTarget.style.color = textColor;
                  }}
                >
                  <NodeIcon type={n.type} size={8} color={ncfg.color} />
                  {n.label.length > 20 ? n.label.slice(0, 20) + '…' : n.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

function NodeIcon({ type, size = 10, color }) {
  const cfg = NODE_CONFIG[type];
  const c = color || cfg.color;
  if (type === 'paper') return <span style={{ color: c, fontSize: size }}>●</span>;
  if (type === 'model') return <span style={{ color: c, fontSize: size }}>◆</span>;
  return <span style={{ color: c, fontSize: size }}>■</span>;
}
