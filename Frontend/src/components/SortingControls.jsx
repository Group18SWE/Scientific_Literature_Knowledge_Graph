import { computeMetrics } from '../services/api';

const SORT_OPTIONS = [
  { value: 'citations',    label: 'Citations',    icon: '◈' },
  { value: 'influential',  label: 'Influential',  icon: '★' },
  { value: 'year',         label: 'Most Recent',  icon: '◷' },
  { value: 'degree',       label: 'Connections',  icon: '⬡' },
  { value: 'impact',       label: 'Impact Score', icon: '⚡' },
  { value: 'alpha',        label: 'Name A–Z',     icon: 'Az' },
];

const TOP_K_OPTIONS = [5, 10, 20, 50];

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: color || 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

export default function SortingControls({
  filters,
  onFiltersChange,
  graphData,
  onExport,
  onExportCSV,
  onTopK,
  topK,
  onResetGraph,
  bookmarkCount,
  onClearBookmarks,
}) {
  const set = (key, val) => onFiltersChange({ ...filters, [key]: val });

  const papers   = graphData.nodes.filter((n) => n.type === 'paper');
  const models   = graphData.nodes.filter((n) => n.type === 'model');
  const datasets = graphData.nodes.filter((n) => n.type === 'dataset');
  const authors  = graphData.nodes.filter((n) => n.type === 'author');

  const topCited  = papers.slice().sort((a, b) => (b.metadata?.citationCount || 0) - (a.metadata?.citationCount || 0))[0];
  const topInflu  = papers.slice().sort((a, b) => (b.metadata?.influentialCitationCount || 0) - (a.metadata?.influentialCitationCount || 0))[0];

  const totalCitations = papers.reduce((s, p) => s + (p.metadata?.citationCount || 0), 0);
  const avgCitations   = papers.length ? Math.round(totalCitations / papers.length) : 0;

  const openAccessCount = papers.filter((p) => p.metadata?.isOpenAccess).length;

  const topImpact = papers.slice().sort((a, b) => {
    const { impactScore: ia } = computeMetrics(a);
    const { impactScore: ib } = computeMetrics(b);
    return ib - ia;
  })[0];

  const btnStyle = (active) => ({
    textAlign: 'left', padding: '6px 10px', borderRadius: 7,
    fontSize: 11.5, cursor: 'pointer', transition: 'all 0.12s',
    border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
    background: active ? 'var(--glow-blue)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
    fontWeight: active ? 600 : 400,
    width: '100%',
    display: 'flex', alignItems: 'center', gap: 7,
    fontFamily: 'var(--font-sans)',
  });

  return (
    <aside style={{
      width: 210,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-default)',
      padding: '14px 13px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      overflowY: 'auto',
      flexShrink: 0,
    }}>

      <div>
        <div className="section-label">Sort By</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_OPTIONS.map(({ value, label, icon }) => {
            const active = (filters.sortBy || 'citations') === value;
            return (
              <button key={value} onClick={() => set('sortBy', value)} style={btnStyle(active)}>
                <span style={{ fontSize: 11, opacity: 0.7, width: 14, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-label">Order</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[{ v: 'desc', label: '↓ High–Low' }, { v: 'asc', label: '↑ Low–High' }].map(({ v, label }) => {
            const active = (filters.sortOrder || 'desc') === v;
            return (
              <button key={v} onClick={() => set('sortOrder', v)}
                style={{
                  flex: 1, padding: '5px 4px', fontSize: 10.5, borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  background: active ? 'var(--glow-blue)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  fontFamily: 'var(--font-sans)',
                }}
              >{label}</button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-label">Max Nodes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[25, 50, 100, 200].map((v) => {
            const active = (filters.maxNodes || 100) === v;
            return (
              <button key={v} onClick={() => set('maxNodes', v)}
                style={{
                  padding: '4px 10px', borderRadius: 7, fontSize: 11.5, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  background: active ? 'var(--glow-blue)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  fontFamily: 'var(--font-sans)',
                }}
              >{v}</button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-label">Top-K Papers</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {TOP_K_OPTIONS.map((k) => {
            const active = topK === k;
            return (
              <button key={k} onClick={() => onTopK(active ? null : k)}
                style={{
                  padding: '4px 10px', borderRadius: 7, fontSize: 11.5, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent-amber)' : 'var(--border-default)'}`,
                  background: active ? 'var(--glow-amber)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  fontFamily: 'var(--font-sans)',
                }}
              >Top {k}</button>
            );
          })}
        </div>
        {topK !== null && (
          <button onClick={() => onTopK(null)} className="btn btn-ghost" style={{ width: '100%', fontSize: 10.5 }}>
            Show All
          </button>
        )}
      </div>

      <div>
        <div className="section-label">Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <button className="btn btn-ghost" onClick={onResetGraph} style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}>
            <span>↺</span> Reset Graph
          </button>
          <button
            className="btn btn-ghost"
            onClick={onExport}
            style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glow-green)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span>↓</span> Export JSON
          </button>
          {onExportCSV && (
            <button
              className="btn btn-ghost"
              onClick={onExportCSV}
              style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
            >
              <span>↓</span> Export CSV
            </button>
          )}
          {bookmarkCount > 0 && (
            <button
              className="btn btn-ghost"
              onClick={onClearBookmarks}
              style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--accent-amber)', borderColor: 'rgba(245,158,11,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glow-amber)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>☆</span> Clear {bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="section-label">Graph Stats</div>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 9, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <StatRow label="Papers"   value={papers.length}   color="var(--node-paper)"   />
          <StatRow label="Models"   value={models.length}   color="var(--node-model)"   />
          <StatRow label="Datasets" value={datasets.length} color="var(--node-dataset)" />
          {authors.length > 0 && <StatRow label="Authors" value={authors.length} color="var(--node-author)" />}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />
          <StatRow label="Total edges" value={graphData.edges.length} />
          <StatRow label="Total nodes" value={graphData.nodes.length} />
        </div>
      </div>

      {papers.length > 0 && (
        <div>
          <div className="section-label">Insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topCited && (
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
                  Most Cited
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>
                  {topCited.label.length > 28 ? topCited.label.slice(0, 28) + '…' : topCited.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                  {(topCited.metadata?.citationCount || 0).toLocaleString()} citations
                </div>
              </div>
            )}

            {topImpact && topImpact.id !== topCited?.id && (
              <div style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
                  Highest Impact
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>
                  {topImpact.label.length > 28 ? topImpact.label.slice(0, 28) + '…' : topImpact.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                  {computeMetrics(topImpact).impactScore.toLocaleString()} impact
                </div>
              </div>
            )}

            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 8, padding: '8px 10px',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2, fontWeight: 700 }}>
                Summary
              </div>
              <StatRow label="Avg citations" value={avgCitations.toLocaleString()} />
              <StatRow label="Open access"   value={`${openAccessCount}/${papers.length}`} color="var(--accent-green)" />
              <StatRow
                label="Total citations"
                value={totalCitations >= 1000 ? `${(totalCitations / 1000).toFixed(0)}k` : totalCitations}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
