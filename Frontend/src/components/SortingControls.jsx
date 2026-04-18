export default function SortingControls({ filters, onFiltersChange, graphData, onExport, onTopK, topK, onResetGraph, onExportCSV, onLayoutChange, layout }) {
  const set = (key, val) => onFiltersChange({ ...filters, [key]: val });

  const SORT_OPTIONS = [
    { value: 'citations', label: '📊 Citations' },
    { value: 'year',      label: '📅 Year' },
    { value: 'degree',    label: '🔗 Connections' },
    { value: 'alpha',     label: '🔤 Name (A–Z)' },
  ];

  const LAYOUTS = [
    { value: 'force',    label: '⚛ Force' },
    { value: 'radial',   label: '◎ Radial' },
    { value: 'cluster',  label: '⬡ Cluster' },
  ];

  const TOP_K_OPTIONS = [5, 10, 20, 50];

  const stats = {
    papers:   graphData.nodes.filter(n => n.type === 'paper').length,
    models:   graphData.nodes.filter(n => n.type === 'model').length,
    datasets: graphData.nodes.filter(n => n.type === 'dataset').length,
    edges:    graphData.edges.length,
  };

  const BtnGroup = ({ options, activeValue, onSelect }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {options.map(({ value, label }) => {
        const active = activeValue === value;
        return (
          <button key={value} onClick={() => onSelect(value)}
            style={{
              textAlign: 'left', padding: '6px 10px', borderRadius: 6,
              fontSize: 12, cursor: 'pointer', transition: 'all 0.12s',
              border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
              background: active ? 'var(--glow-blue)' : 'var(--bg-elevated)',
              color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: active ? 600 : 400,
            }}
          >{label}</button>
        );
      })}
    </div>
  );

  return (
    <aside style={{
      width: 205,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-default)',
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* Sort */}
      <div>
        <div className="section-label">Sort By</div>
        <BtnGroup options={SORT_OPTIONS} activeValue={filters.sortBy} onSelect={(v) => set('sortBy', v)} />
      </div>

      {/* Order */}
      <div>
        <div className="section-label">Order</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: 'desc', label: '↓ High → Low' }, { v: 'asc', label: '↑ Low → High' }].map(({ v, label }) => {
            const active = filters.sortOrder === v;
            return (
              <button key={v} onClick={() => set('sortOrder', v)}
                style={{
                  flex: 1, padding: '5px 4px', fontSize: 10.5, borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  background: active ? 'var(--glow-blue)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                }}
              >{label}</button>
            );
          })}
        </div>
      </div>

      {/* Max Nodes */}
      <div>
        <div className="section-label">Max Nodes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[25, 50, 100, 200].map((v) => {
            const active = filters.maxNodes === v;
            return (
              <button key={v} onClick={() => set('maxNodes', v)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  background: active ? 'var(--glow-blue)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                }}
              >{v}</button>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      {onLayoutChange && (
        <div>
          <div className="section-label">Graph Layout</div>
          <BtnGroup options={LAYOUTS} activeValue={layout || 'force'} onSelect={onLayoutChange} />
        </div>
      )}

      {/* Top-K */}
      <div>
        <div className="section-label">Top-K Papers</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {TOP_K_OPTIONS.map((k) => {
            const active = topK === k;
            return (
              <button key={k} onClick={() => onTopK(active ? null : k)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent-amber)' : 'var(--border-default)'}`,
                  background: active ? 'rgba(245,166,35,0.12)' : 'var(--bg-elevated)',
                  color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                }}
              >Top {k}</button>
            );
          })}
        </div>
        {topK !== null && (
          <button onClick={() => onTopK(null)} className="btn btn-ghost" style={{ width: '100%', fontSize: 11 }}>
            Show All
          </button>
        )}
      </div>

      {/* Actions */}
      <div>
        <div className="section-label">Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="btn btn-ghost" onClick={onResetGraph} style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}>
            <span>↺</span> Reset Graph
          </button>
          <button className="btn btn-ghost" onClick={onExport} style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--accent-green)', borderColor: 'rgba(62,207,142,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(62,207,142,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span>↓</span> Export JSON
          </button>
          {onExportCSV && (
            <button className="btn btn-ghost" onClick={onExportCSV} style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}>
              <span>↓</span> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="section-label">Graph Stats</div>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 8, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {[
            { label: 'Papers',   val: stats.papers,   color: '#5b9df9' },
            { label: 'Models',   val: stats.models,   color: '#f5a623' },
            { label: 'Datasets', val: stats.datasets, color: '#3ecf8e' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{val}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total edges</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{stats.edges}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total nodes</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {stats.papers + stats.models + stats.datasets}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}