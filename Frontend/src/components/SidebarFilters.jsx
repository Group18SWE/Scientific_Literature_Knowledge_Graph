import { useState } from 'react';
import { NODE_CONFIG, NodeIcon } from './Legend';

const NODE_TYPES = [
  { key: 'paper',   label: 'Papers' },
  { key: 'model',   label: 'Models' },
  { key: 'dataset', label: 'Datasets' },
  { key: 'author',  label: 'Authors' },
];

const EDGE_TOGGLES = [
  { key: 'showModelEdges',   color: '#f59e0b', label: 'Uses Model',   dashed: false },
  { key: 'showDatasetEdges', color: '#10b981', label: 'Uses Dataset', dashed: true  },
  { key: 'showCiteEdges',    color: '#5b9df9', label: 'Cites',        dashed: false },
  { key: 'showAuthorEdges',  color: '#fb923c', label: 'Written By',   dashed: true  },
];

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: open ? 0 : 0,
        }}
      >
        <div className="section-label" style={{ cursor: 'pointer' }}>
          {title}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>
            ▾
          </span>
        </div>
      </button>
      {open && <div style={{ marginBottom: 16 }}>{children}</div>}
    </div>
  );
}

export default function SidebarFilters({ filters, onFiltersChange, graphData, darkMode }) {
  const set = (key, val) => onFiltersChange({ ...filters, [key]: val });

  const papers   = graphData.nodes.filter((n) => n.type === 'paper');
  const allYears = papers.map((p) => p.metadata?.year).filter(Boolean);
  const yearMin  = allYears.length ? Math.min(...allYears) : 2017;
  const yearMax  = allYears.length ? Math.max(...allYears) : 2024;
  const maxCitations = Math.max(...papers.map((p) => p.metadata?.citationCount || 0), 1000);

  const typeCounts = { paper: 0, model: 0, dataset: 0, author: 0 };
  graphData.nodes.forEach((n) => { if (typeCounts[n.type] !== undefined) typeCounts[n.type]++; });

  const allVenues = [...new Set(
    papers.map((p) => p.metadata?.publicationVenue?.name || p.metadata?.venue).filter(Boolean)
  )].sort();

  const allFields = [...new Set(
    papers.flatMap((p) => p.metadata?.fieldsOfStudy || [])
  )].sort();

  const allAuthors = [...new Set(
    papers.flatMap((p) => (p.metadata?.authors || []).map((a) => (typeof a === 'object' ? a.name : a))).filter(Boolean)
  )].sort();

  const selectedVenues  = new Set(filters.venues  || []);
  const selectedFields  = new Set(filters.fields   || []);
  const selectedAuthors = new Set(filters.authors  || []);

  const toggleSet = (filterKey, value, currentSet) => {
    const next = new Set(currentSet);
    if (next.has(value)) next.delete(value); else next.add(value);
    set(filterKey, [...next]);
  };

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 11.5,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    width: 60,
  };

  return (
    <aside style={{
      width: 240,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-default)',
      padding: '14px 13px',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
    }}>

      <CollapsibleSection title="Search">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }}>⌕</span>
          <input
            className="input-field"
            value={filters.search || ''}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Title, abstract, TLDR..."
            style={{ paddingLeft: 28, fontSize: 11.5 }}
          />
          {filters.search && (
            <button onClick={() => set('search', '')} style={{
              position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
            }}>×</button>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Node Types">
        {NODE_TYPES.map(({ key, label }) => {
          const active = filters[key] !== false;
          const cfg = NODE_CONFIG[key];
          return (
            <div
              key={key}
              className={`toggle-row${active ? ' active' : ''}`}
              onClick={() => set(key, !active)}
              style={{
                background: active ? cfg.color + '12' : 'var(--bg-elevated)',
                borderColor: active ? cfg.color + '50' : 'var(--border-default)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NodeIcon type={key} color={active ? cfg.color : undefined} size={13} />
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {label}
                </span>
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                background: active ? cfg.color + '20' : 'var(--border-default)',
                color: active ? cfg.color : 'var(--text-muted)',
                padding: '1px 7px', borderRadius: 20,
              }}>{typeCounts[key]}</span>
            </div>
          );
        })}
      </CollapsibleSection>

      <CollapsibleSection title="Publication Year">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>From</div>
            <input
              type="number"
              min={yearMin} max={filters.yearMax || yearMax}
              value={filters.yearMin || yearMin}
              onChange={(e) => set('yearMin', Math.min(Number(e.target.value), filters.yearMax || yearMax))}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>To</div>
            <input
              type="number"
              min={filters.yearMin || yearMin} max={yearMax}
              value={filters.yearMax || yearMax}
              onChange={(e) => set('yearMax', Math.max(Number(e.target.value), filters.yearMin || yearMin))}
              style={inputStyle}
            />
          </div>
        </div>
        <input
          type="range" min={yearMin} max={yearMax} step={1}
          value={filters.yearMin || yearMin}
          onChange={(e) => set('yearMin', Math.min(Number(e.target.value), filters.yearMax || yearMax))}
          style={{ accentColor: 'var(--accent-blue)', marginBottom: 4 }}
        />
        <input
          type="range" min={yearMin} max={yearMax} step={1}
          value={filters.yearMax || yearMax}
          onChange={(e) => set('yearMax', Math.max(Number(e.target.value), filters.yearMin || yearMin))}
          style={{ accentColor: 'var(--accent-blue)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9.5, color: 'var(--text-muted)' }}>
          <span>{yearMin}</span>
          <span>{yearMax}</span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Min Citations">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>
            {(filters.minCitations || 0) >= 1000
              ? `${((filters.minCitations || 0) / 1000).toFixed(0)}k+`
              : `${filters.minCitations || 0}+`}
          </span>
          <span style={{
            fontSize: 10, color: 'var(--text-muted)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            padding: '2px 7px', borderRadius: 5,
          }}>
            {papers.filter((p) => (p.metadata?.citationCount || 0) >= (filters.minCitations || 0)).length} papers
          </span>
        </div>
        <input
          type="range" min={0} max={maxCitations}
          step={Math.max(100, Math.floor(maxCitations / 50))}
          value={filters.minCitations || 0}
          onChange={(e) => set('minCitations', Number(e.target.value))}
          style={{ accentColor: 'var(--accent-amber)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9.5, color: 'var(--text-muted)' }}>
          <span>0</span>
          <span>{maxCitations >= 1000 ? `${(maxCitations / 1000).toFixed(0)}k` : maxCitations}</span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Access Type">
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'openAccess',   label: 'Open',   icon: '🔓', color: 'var(--accent-green)' },
            { key: 'closedAccess', label: 'Closed', icon: '🔒', color: 'var(--accent-red)'   },
          ].map(({ key, label, icon, color }) => {
            const active = filters[key] !== false;
            return (
              <button key={key} onClick={() => set(key, !active)}
                style={{
                  flex: 1, padding: '5px 6px', fontSize: 11, borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${active ? color : 'var(--border-default)'}`,
                  background: active ? color.replace(')', '').replace('var(--accent-', '') + ', 0.1)' : 'var(--bg-elevated)',
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                  opacity: active ? 1 : 0.5,
                }}
              >
                {icon} {label}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Edge Visibility">
        {EDGE_TOGGLES.map(({ key, color, label, dashed }) => {
          const active = filters[key] !== false;
          return (
            <div key={key} onClick={() => set(key, !active)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7,
                cursor: 'pointer', opacity: active ? 1 : 0.28, transition: 'opacity 0.15s',
              }}
            >
              <svg width="22" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="22" y2="4"
                  stroke={color} strokeWidth="2"
                  strokeDasharray={dashed ? '3,2' : '0'} />
              </svg>
              <span style={{ fontSize: 11.5, color: active ? 'var(--text-secondary)' : 'var(--text-muted)', flex: 1 }}>{label}</span>
              <span style={{ fontSize: 9, color: active ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {active ? 'on' : 'off'}
              </span>
            </div>
          );
        })}
      </CollapsibleSection>

      {allVenues.length > 0 && (
        <CollapsibleSection title="Venue" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
            {allVenues.map((venue) => {
              const selected = selectedVenues.has(venue);
              return (
                <div key={venue} onClick={() => toggleSet('venues', venue, selectedVenues)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                    padding: '4px 7px', borderRadius: 6,
                    background: selected ? 'var(--glow-blue)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    border: `1.5px solid ${selected ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
                    background: selected ? 'var(--accent-blue)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 11, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: selected ? 600 : 400 }}>
                    {venue}
                  </span>
                </div>
              );
            })}
          </div>
          {selectedVenues.size > 0 && (
            <button onClick={() => set('venues', [])} className="btn btn-ghost" style={{ width: '100%', fontSize: 10.5, marginTop: 6 }}>
              Clear ({selectedVenues.size})
            </button>
          )}
        </CollapsibleSection>
      )}

      {allFields.length > 0 && (
        <CollapsibleSection title="Fields of Study" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {allFields.map((field) => {
              const selected = selectedFields.has(field);
              return (
                <button key={field} onClick={() => toggleSet('fields', field, selectedFields)}
                  style={{
                    padding: '3px 9px', borderRadius: 20, fontSize: 10.5, cursor: 'pointer',
                    border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                    background: selected ? 'var(--glow-blue)' : 'var(--bg-elevated)',
                    color: selected ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: selected ? 600 : 400,
                    transition: 'all 0.1s',
                  }}
                >{field}</button>
              );
            })}
          </div>
          {selectedFields.size > 0 && (
            <button onClick={() => set('fields', [])} className="btn btn-ghost" style={{ width: '100%', fontSize: 10.5, marginTop: 6 }}>
              Clear ({selectedFields.size})
            </button>
          )}
        </CollapsibleSection>
      )}

      {allAuthors.length > 0 && (
        <CollapsibleSection title="Authors" defaultOpen={false}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input
              className="input-field"
              placeholder="Filter authors..."
              id="author-search"
              style={{ fontSize: 11 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
            {allAuthors.slice(0, 20).map((author) => {
              const selected = selectedAuthors.has(author);
              return (
                <div key={author} onClick={() => toggleSet('authors', author, selectedAuthors)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                    padding: '4px 7px', borderRadius: 6,
                    background: selected ? 'rgba(251,146,60,0.08)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    border: `1.5px solid ${selected ? '#fb923c' : 'var(--border-strong)'}`,
                    background: selected ? '#fb923c' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 11, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: selected ? 600 : 400 }}>
                    {author}
                  </span>
                </div>
              );
            })}
          </div>
          {selectedAuthors.size > 0 && (
            <button onClick={() => set('authors', [])} className="btn btn-ghost" style={{ width: '100%', fontSize: 10.5, marginTop: 6 }}>
              Clear ({selectedAuthors.size})
            </button>
          )}
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Controls" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            ['Scroll', 'Zoom in/out'],
            ['Drag bg', 'Pan canvas'],
            ['Click', 'Select node'],
            ['Drag node', 'Reposition'],
            ['Dbl-click', 'Focus subgraph'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                padding: '1px 7px', borderRadius: 4, color: 'var(--text-primary)',
              }}>{k}</span>
              <span style={{ color: 'var(--text-muted)' }}>{v}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <button
          className="btn btn-ghost"
          style={{ width: '100%' }}
          onClick={() => onFiltersChange({
            search: '',
            paper: true, model: true, dataset: true, author: true,
            yearMin, yearMax,
            minCitations: 0,
            openAccess: true, closedAccess: true,
            showModelEdges: true, showDatasetEdges: true, showCiteEdges: true, showAuthorEdges: true,
            venues: [], fields: [], authors: [],
            sortBy: 'citations', sortOrder: 'desc', maxNodes: 100,
          })}
        >
          ↺ Reset All Filters
        </button>
      </div>
    </aside>
  );
}
