import { useState } from 'react';
import { NODE_CONFIG } from './Legend';
import { computeMetrics, getSimilarPapers } from '../services/api';

const CURRENT_YEAR = new Date().getFullYear();
void CURRENT_YEAR;

function ImpactBar({ value, max, color }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div className="impact-bar">
      <div className="impact-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function NodeHoverPreview({ hoverInfo }) {
  if (!hoverInfo) return null;
  const { node, x, y } = hoverInfo;
  const m = node.metadata || {};
  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.paper;
  const metrics = computeMetrics(node);

  const vW = window.innerWidth;
  const vH = window.innerHeight;
  const tW = 260;
  const tH = 140;
  let left = x + 14;
  let top = y + 14;
  if (left + tW > vW - 10) left = x - tW - 14;
  if (top + tH > vH - 10) top = y - tH - 14;

  return (
    <div className="node-tooltip animate-fade-up" style={{ left, top }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700,
          background: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44`,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>{node.type}</span>
        {m.year && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.year}</span>}
        {m.isOpenAccess && <span style={{ fontSize: 9, color: '#10b981', fontWeight: 600 }}>Open</span>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 5 }}>
        {(m.title || m.name || node.label).length > 55
          ? (m.title || m.name || node.label).slice(0, 55) + '…'
          : (m.title || m.name || node.label)}
      </div>
      {m.tldr?.text && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
          {m.tldr.text.length > 90 ? m.tldr.text.slice(0, 90) + '…' : m.tldr.text}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {node.type === 'paper' && (
          <>
            <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {(m.citationCount || 0).toLocaleString()} cites
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Impact: {metrics.impactScore.toLocaleString()}
            </span>
          </>
        )}
        {node.type === 'author' && (
          <>
            <span style={{ fontSize: 11, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
              h-index: {m.hIndex || '—'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.paperCount || 0} papers</span>
          </>
        )}
        {(node.type === 'model' || node.type === 'dataset') && m.task && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.task}</span>
        )}
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>Click to expand details</div>
    </div>
  );
}

export default function NodeDetailsPanel({ node, neighborIds, graphData, onClose, onSelectNode, onBookmark, bookmarks }) {
  const [tab, setTab] = useState('info');
  const [abstractExpanded, setAbstractExpanded] = useState(false);

  if (!node) return null;

  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.paper;
  const m = node.metadata || {};
  const metrics = computeMetrics(node);
  const isBookmarked = bookmarks?.has(node.id);
  const similarPapers = node.type === 'paper' ? getSimilarPapers(node.id, graphData) : [];

  const neighbors = [...(neighborIds || [])]
    .map((id) => graphData.nodes.find((n) => n.id === id))
    .filter(Boolean);

  const buildRows = () => {
    if (node.type === 'paper') return [
      ['Year', m.year],
      ['Published', m.publicationDate],
      ['Venue', m.publicationVenue?.name || m.venue],
      ['arXiv ID', m.arxivId],
      ['Citations', m.citationCount?.toLocaleString()],
      ['Influential', m.influentialCitationCount?.toLocaleString()],
      ['References', m.referenceCount?.toLocaleString()],
      ['Fields', m.fieldsOfStudy?.join(', ')],
    ].filter(([, v]) => v != null && v !== '');
    if (node.type === 'model') return [
      ['Task', m.task],
      ['Framework', m.framework],
      ['Parameters', m.paramCount],
    ].filter(([, v]) => v != null);
    if (node.type === 'author') return [
      ['h-Index', m.hIndex],
      ['Papers', m.paperCount],
      ['Total Citations', m.citationCount?.toLocaleString()],
      ['Affiliations', m.affiliations?.join(', ')],
      ['Fields', m.fieldsOfStudy?.join(', ')],
    ].filter(([, v]) => v != null);
    return [
      ['Task', m.task],
      ['Size', m.size],
    ].filter(([, v]) => v != null);
  };

  const metadataRows = buildRows();
  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'connections', label: `Links (${neighbors.length})` },
    ...(node.type === 'paper' && similarPapers.length > 0 ? [{ id: 'similar', label: 'Similar' }] : []),
  ];

  return (
    <aside
      className="animate-slide-in flex flex-col overflow-hidden shrink-0"
      style={{
        width: 300,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            padding: '2px 9px', borderRadius: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', background: cfg.color + '1a', color: cfg.color, border: `1px solid ${cfg.color}44`,
          }}>
            {node.type}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {onBookmark && (
              <button
                onClick={() => onBookmark(node.id)}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                style={{
                  width: 26, height: 26, borderRadius: 6,
                  border: `1px solid ${isBookmarked ? cfg.color + '44' : 'var(--border-default)'}`,
                  background: isBookmarked ? cfg.color + '15' : 'transparent',
                  color: isBookmarked ? cfg.color : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isBookmarked ? '★' : '☆'}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border-default)',
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
        <h2 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, margin: '0 0 4px' }}>
          {m.title || m.name || node.label}
        </h2>
        {m.authors && m.authors.length > 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {m.authors.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')}
          </p>
        )}
      </div>

      {node.type === 'paper' && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: cfg.color }}>
              {metrics.impactScore >= 1000 ? `${(metrics.impactScore / 1000).toFixed(0)}k` : metrics.impactScore}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Impact</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
              {metrics.citationDensity >= 1000 ? `${(metrics.citationDensity / 1000).toFixed(1)}k` : metrics.citationDensity}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cites/yr</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: m.isOpenAccess ? '#10b981' : '#f87171' }}>
              {m.isOpenAccess ? 'OPEN' : 'CLOSED'}
            </span>
            {m.openAccessPdf?.url && (
              <a href={m.openAccessPdf.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 10, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                PDF ↗
              </a>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div className="tab-bar">
          {tabs.map(({ id, label }) => (
            <button key={id} className={`tab-item${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {m.tldr?.text && (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5 }}>TL;DR</div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{m.tldr.text}</p>
              </div>
            )}

            {metadataRows.length > 0 && (
              <div>
                <div className="section-label">Metadata</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {metadataRows.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 1, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', textAlign: 'right' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {m.abstract && (
              <div>
                <div className="section-label">Abstract</div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 6px' }}>
                  {abstractExpanded ? m.abstract : (m.abstract.length > 260 ? m.abstract.slice(0, 260) + '…' : m.abstract)}
                </p>
                {m.abstract.length > 260 && (
                  <button
                    onClick={() => setAbstractExpanded((e) => !e)}
                    style={{ fontSize: 11, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {abstractExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {node.type === 'paper' && (
              <div>
                <div className="section-label">Impact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Citation Impact', val: metrics.impactScore, max: 200000, color: cfg.color },
                    { label: 'Annual Density', val: metrics.citationDensity, max: 15000, color: 'var(--accent-amber)' },
                  ].map(({ label, val, max, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{val.toLocaleString()}</span>
                      </div>
                      <ImpactBar value={val} max={max} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'connections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {neighbors.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 20 }}>No connections visible</div>
            ) : (
              neighbors.map((n) => {
                const ncfg = NODE_CONFIG[n.type] || NODE_CONFIG.paper;
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelectNode(n)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7,
                      border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.12s', width: '100%',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ncfg.color; e.currentTarget.style.background = ncfg.color + '10'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: ncfg.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(n.metadata?.title || n.metadata?.name || n.label).length > 30
                          ? (n.metadata?.title || n.metadata?.name || n.label).slice(0, 30) + '…'
                          : (n.metadata?.title || n.metadata?.name || n.label)}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{ncfg.label}</div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>→</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {tab === 'similar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Papers sharing models/datasets with this work
            </div>
            {similarPapers.map(({ node: sn, score }) => (
              <button
                key={sn.id}
                onClick={() => onSelectNode(sn)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px', borderRadius: 7,
                  border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.12s', width: '100%',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {(sn.metadata?.title || sn.label).length > 40
                    ? (sn.metadata?.title || sn.label).slice(0, 40) + '…'
                    : (sn.metadata?.title || sn.label)}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 9.5, color: 'var(--accent-blue)' }}>{score} shared</span>
                  {sn.metadata?.year && <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{sn.metadata.year}</span>}
                  {sn.metadata?.citationCount && (
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {sn.metadata.citationCount.toLocaleString()} cites
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
