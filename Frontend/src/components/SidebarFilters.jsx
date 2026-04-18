import { NODE_CONFIG, NodeIcon } from './Legend';

const NODE_TYPES = [
  { key: 'paper',   label: 'Papers' },
  { key: 'model',   label: 'Models' },
  { key: 'dataset', label: 'Datasets' },
];

export default function SidebarFilters({ filters, onFiltersChange, graphData }) {
  const papers = graphData.nodes.filter((n) => n.type === 'paper');
  const yearMin = Math.min(...papers.map((p) => p.metadata?.year).filter(Boolean), 2017);
  const yearMax = Math.max(...papers.map((p) => p.metadata?.year).filter(Boolean), 2024);
  const maxCitations = Math.max(...papers.map((p) => p.metadata?.citationCount || 0), 1000);

  const set = (key, val) => onFiltersChange({ ...filters, [key]: val });

  const typeCounts = { paper: 0, model: 0, dataset: 0 };
  graphData.nodes.forEach((n) => { if (typeCounts[n.type] !== undefined) typeCounts[n.type]++; });

  return (
    <aside style={{
      width: 235,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-default)',
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* Search */}
      <div>
        <div className="section-label">Search Nodes</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>⌕</span>
          <input
            className="input-field"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Filter by title..."
            style={{ paddingLeft: 30 }}
          />
          {filters.search && (
            <button onClick={() => set('search', '')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
            }}>×</button>
          )}
        </div>
      </div>

      {/* Node Types */}
      <div>
        <div className="section-label">Node Types</div>
        {NODE_TYPES.map(({ key, label }) => {
          const active = filters[key];
          const cfg = NODE_CONFIG[key];
          const count = typeCounts[key];
          return (
            <div
              key={key}
              className={`toggle-row${active ? ' active' : ''}`}
              onClick={() => set(key, !active)}
              style={{
                background: active ? cfg.color + '15' : 'var(--bg-elevated)',
                borderColor: active ? cfg.color + '55' : 'var(--border-default)',
                color: active ? cfg.color : 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NodeIcon type={key} color={active ? cfg.color : undefined} />
                <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 600, fontFamily: 'var(--font-mono)',
                background: active ? cfg.color + '22' : 'var(--border-default)',
                color: active ? cfg.color : 'var(--text-muted)',
                padding: '1px 7px', borderRadius: 20,
              }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Year Range */}
      <div>
        <div className="section-label">Publication Year</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
          {[filters.yearMin, filters.yearMax].map((val, i) => (
            <span key={i} style={{
              background: 'var(--accent-blue)', color: '#fff',
              fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
              fontFamily: 'var(--font-mono)', flex: 1, textAlign: 'center',
            }}>{val}</span>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>From</div>
          <input type="range" min={yearMin} max={yearMax} step={1}
            value={filters.yearMin}
            onChange={(e) => set('yearMin', Math.min(Number(e.target.value), filters.yearMax))}
            style={{ accentColor: 'var(--accent-blue)' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>To</div>
          <input type="range" min={yearMin} max={yearMax} step={1}
            value={filters.yearMax}
            onChange={(e) => set('yearMax', Math.max(Number(e.target.value), filters.yearMin))}
            style={{ accentColor: 'var(--accent-blue)' }}
          />
        </div>
      </div>

      {/* Min Citations */}
      <div>
        <div className="section-label">Min Citations</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>
            {filters.minCitations >= 1000 ? `${(filters.minCitations / 1000).toFixed(0)}k+` : `${filters.minCitations}+`}
          </span>
          <span style={{
            fontSize: 10.5, color: 'var(--text-muted)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            padding: '2px 8px', borderRadius: 5,
          }}>
            {papers.filter((p) => (p.metadata?.citationCount || 0) >= filters.minCitations).length} papers
          </span>
        </div>
        <input type="range" min={0} max={maxCitations} step={Math.max(100, Math.floor(maxCitations / 50))}
          value={filters.minCitations}
          onChange={(e) => set('minCitations', Number(e.target.value))}
          style={{ accentColor: 'var(--accent-amber)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9.5, color: 'var(--text-muted)' }}>
          <span>0</span>
          <span>{maxCitations >= 1000 ? `${(maxCitations / 1000).toFixed(0)}k` : maxCitations}</span>
        </div>
      </div>

      {/* Open Access */}
      <div>
        <div className="section-label">Access Type</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'openAccess',   label: '🔓 Open',   color: 'var(--accent-green)' },
            { key: 'closedAccess', label: '🔒 Closed',  color: 'var(--accent-red)' },
          ].map(({ key, label, color }) => {
            const active = filters[key] !== false;
            return (
              <button key={key} onClick={() => set(key, !active)}
                style={{
                  flex: 1, padding: '5px 6px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${active ? color.replace(')', ', 0.5)').replace('var(', 'var(') : 'var(--border-default)'}`,
                  background: active ? color.replace(')', '')
                    .replace('var(--accent-green', 'rgba(62,207,142,0.12')
                    .replace('var(--accent-red', 'rgba(248,113,113,0.12') + ')' : 'var(--bg-elevated)',
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                }}
              >{label}</button>
            );
          })}
        </div>
      </div>

      {/* Edge Types */}
      <div>
        <div className="section-label">Edge Visibility</div>
        {[
          { key: 'showModelEdges',   colorHex: '#f5a623', label: 'Uses Model',   dashed: false },
          { key: 'showDatasetEdges', colorHex: '#3ecf8e', label: 'Uses Dataset', dashed: true  },
          { key: 'showOtherEdges',   colorHex: '#5b9df9', label: 'Other Links',  dashed: false },
        ].map(({ key, colorHex, label, dashed }) => {
          const active = filters[key] !== false;
          return (
            <div key={key} onClick={() => set(key, !active)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7,
                cursor: 'pointer', opacity: active ? 1 : 0.3, transition: 'opacity 0.15s',
              }}
            >
              <svg width="22" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="22" y2="4"
                  stroke={colorHex} strokeWidth="2"
                  strokeDasharray={dashed ? '3,2' : '0'} />
              </svg>
              <span style={{ fontSize: 11.5, color: active ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9.5, color: active ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {active ? 'on' : 'off'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div>
        <div className="section-label">Controls</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            ['Scroll', 'Zoom'],
            ['Drag bg', 'Pan'],
            ['Click node', 'Select'],
            ['Drag node', 'Move'],
            ['Dbl-click', 'Focus'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                padding: '1px 7px', borderRadius: 4, color: 'var(--text-primary)',
              }}>{k}</span>
              <span style={{ color: 'var(--text-muted)' }}>→ {v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
        <button
          className="btn btn-ghost"
          style={{ width: '100%' }}
          onClick={() => onFiltersChange({
            search: '', paper: true, model: true, dataset: true,
            yearMin, yearMax, minCitations: 0,
            sortBy: 'citations', sortOrder: 'desc', maxNodes: 100,
            openAccess: true, closedAccess: true,
            showModelEdges: true, showDatasetEdges: true, showOtherEdges: true,
          })}
        >
          ↺ Reset All Filters
        </button>
      </div>
    </aside>
  );
}