import { useState, useCallback, useMemo } from 'react';
import Graph, { getSubgraph } from '../components/Graph';
import SidebarFilters from '../components/SidebarFilters';
import SortingControls from '../components/SortingControls';
import NodeDetailsPanel, { NodeHoverPreview } from '../components/NodeDetailsPanel';
import Legend from '../components/Legend';
import { DUMMY_DATA, normalizeGraphData, searchGraph, exportCSV, computeMetrics } from '../services/api';

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_FILTERS = {
  search: '',
  paper: true, model: true, dataset: true, author: true,
  yearMin: 2015, yearMax: CURRENT_YEAR,
  minCitations: 0,
  openAccess: true, closedAccess: true,
  showModelEdges: true, showDatasetEdges: true, showCiteEdges: true, showAuthorEdges: true,
  venues: [], fields: [], authors: [],
  sortBy: 'citations', sortOrder: 'desc', maxNodes: 100,
};

export default function ResearchGraph({ darkMode }) {
  const [rawData, setRawData]         = useState(DUMMY_DATA);
  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverInfo, setHoverInfo]     = useState(null);
  const [apiQuery, setApiQuery]       = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [topK, setTopK]               = useState(null);
  const [graphKey, setGraphKey]       = useState(0);
  const [bookmarks, setBookmarks]     = useState(new Set());

  const handleApiSearch = useCallback(async () => {
    const q = apiQuery.trim();
    if (!q) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await searchGraph({ query: q });
      const normalized = normalizeGraphData(result?.graph || result);
      if (normalized.nodes.length > 0) {
        setRawData(normalized);
        setSelectedNode(null);
        setTopK(null);
      } else {
        setError('No results found. Showing demo data.');
      }
    } catch {
      setError('Backend unavailable — showing demo data.');
    } finally {
      setIsLoading(false);
    }
  }, [apiQuery]);

  const degreeMap = useMemo(() => {
    const map = new Map();
    rawData.edges.forEach((e) => {
      map.set(e.source, (map.get(e.source) || 0) + 1);
      map.set(e.target, (map.get(e.target) || 0) + 1);
    });
    return map;
  }, [rawData]);

  const graphData = useMemo(() => {
    const q = (filters.search || '').toLowerCase();
    const selectedVenues  = new Set(filters.venues  || []);
    const selectedFields  = new Set(filters.fields   || []);
    const selectedAuthors = new Set(filters.authors  || []);

    let nodes = rawData.nodes.filter((n) => {
      if (filters[n.type] === false) return false;

      if (q) {
        const titleMatch   = (n.label || '').toLowerCase().includes(q);
        const titleMeta    = (n.metadata?.title || '').toLowerCase().includes(q);
        const tldrMatch    = (n.metadata?.tldr?.text || '').toLowerCase().includes(q);
        const abstractMatch = (n.metadata?.abstract || '').toLowerCase().includes(q);
        if (!titleMatch && !titleMeta && !tldrMatch && !abstractMatch) return false;
      }

      if (n.type === 'paper') {
        const year = n.metadata?.year;
        if (year != null && (year < filters.yearMin || year > filters.yearMax)) return false;

        const citations = n.metadata?.citationCount;
        if (citations != null && citations < (filters.minCitations || 0)) return false;

        if (filters.openAccess === false && n.metadata?.isOpenAccess === true) return false;
        if (filters.closedAccess === false && n.metadata?.isOpenAccess === false) return false;

        if (selectedVenues.size > 0) {
          const venue = n.metadata?.publicationVenue?.name || n.metadata?.venue;
          if (!venue || !selectedVenues.has(venue)) return false;
        }

        if (selectedFields.size > 0) {
          const fields = n.metadata?.fieldsOfStudy || [];
          if (!fields.some((f) => selectedFields.has(f))) return false;
        }

        if (selectedAuthors.size > 0) {
          const authors = (n.metadata?.authors || []).map((a) => (typeof a === 'object' ? a.name : a));
          if (!authors.some((a) => selectedAuthors.has(a))) return false;
        }
      }

      return true;
    });

    if (topK !== null) {
      const papers = nodes
        .filter((n) => n.type === 'paper')
        .sort((a, b) => (b.metadata?.citationCount || 0) - (a.metadata?.citationCount || 0))
        .slice(0, topK);
      const paperIds = new Set(papers.map((p) => p.id));
      const nonPapers = nodes.filter((n) => n.type !== 'paper');
      nodes = [
        ...papers,
        ...nonPapers.filter((n) => {
          return rawData.edges.some(
            (e) => (e.source === n.id || e.target === n.id) &&
                   (paperIds.has(e.source) || paperIds.has(e.target))
          );
        }),
      ];
    }

    const { sortBy, sortOrder } = filters;
    nodes = [...nodes].sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'citations') {
        aVal = a.metadata?.citationCount || 0;
        bVal = b.metadata?.citationCount || 0;
      } else if (sortBy === 'influential') {
        aVal = a.metadata?.influentialCitationCount || 0;
        bVal = b.metadata?.influentialCitationCount || 0;
      } else if (sortBy === 'year') {
        aVal = a.metadata?.year || 0;
        bVal = b.metadata?.year || 0;
      } else if (sortBy === 'degree') {
        aVal = degreeMap.get(a.id) || 0;
        bVal = degreeMap.get(b.id) || 0;
      } else if (sortBy === 'impact') {
        aVal = a.type === 'paper' ? computeMetrics(a).impactScore : 0;
        bVal = b.type === 'paper' ? computeMetrics(b).impactScore : 0;
      } else if (sortBy === 'alpha') {
        return sortOrder === 'asc'
          ? (a.label || '').localeCompare(b.label || '')
          : (b.label || '').localeCompare(a.label || '');
      } else {
        return 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    nodes = nodes.slice(0, filters.maxNodes || 100);

    const visibleIds = new Set(nodes.map((n) => n.id));
    const edges = rawData.edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    return { nodes, edges };
  }, [rawData, filters, topK, degreeMap]);

  const neighborIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const { neighborIds } = getSubgraph(selectedNode.id, graphData.edges);
    return neighborIds;
  }, [selectedNode, graphData.edges]);

  const graphMeta = useMemo(() => ({
    paper:   graphData.nodes.filter((n) => n.type === 'paper').length,
    model:   graphData.nodes.filter((n) => n.type === 'model').length,
    dataset: graphData.nodes.filter((n) => n.type === 'dataset').length,
    author:  graphData.nodes.filter((n) => n.type === 'author').length,
    total:   graphData.nodes.length,
  }), [graphData.nodes]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'literature-graph.json'; a.click();
    URL.revokeObjectURL(url);
  }, [graphData]);

  const handleExportCSV = useCallback(() => {
    const csv = exportCSV(graphData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'literature-graph.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [graphData]);

  const handleResetGraph = useCallback(() => {
    setRawData(DUMMY_DATA);
    setSelectedNode(null);
    setTopK(null);
    setApiQuery('');
    setError('');
    setGraphKey((k) => k + 1);
  }, []);

  const handleBookmark = useCallback((nodeId) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
      return next;
    });
  }, []);

  const NODE_COLORS = { paper: '#5b9df9', model: '#f59e0b', dataset: '#10b981', author: '#fb923c' };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 52px)',
        background: 'var(--bg-base)', overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
          <span style={{
            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none',
          }}>⌕</span>
          <input
            value={apiQuery}
            onChange={(e) => setApiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApiSearch()}
            placeholder="Search papers via Semantic Scholar..."
            style={{
              width: '100%', background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 8, padding: '6px 10px 6px 28px',
              fontSize: 12.5, fontFamily: 'var(--font-mono)',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; }}
          />
        </div>

        <button
          onClick={handleApiSearch}
          disabled={isLoading || !apiQuery.trim()}
          className="btn btn-primary"
          style={{ flexShrink: 0 }}
        >
          {isLoading ? (
            <>
              <span className="animate-spin-slow" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />
              Searching
            </>
          ) : 'Search'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 4 }}>
          {Object.entries(NODE_COLORS).map(([t, c]) => {
            const count = graphMeta[t];
            if (!count) return null;
            return (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0, boxShadow: `0 0 5px ${c}80` }} />
                <span style={{ color: c, fontWeight: 600 }}>{count}</span> {t}s
              </span>
            );
          })}
        </div>

        {bookmarks.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 6,
            background: 'var(--glow-amber)',
            border: '1px solid rgba(245,158,11,0.3)',
            fontSize: 11.5, color: 'var(--accent-amber)',
          }}>
            ☆ {bookmarks.size} bookmark{bookmarks.size !== 1 ? 's' : ''}
          </div>
        )}

        {error && (
          <div style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11.5,
            background: 'var(--glow-red)', border: '1px solid rgba(248,113,113,0.3)',
            color: 'var(--accent-red)',
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SidebarFilters
          filters={filters}
          onFiltersChange={setFilters}
          graphData={rawData}
          darkMode={darkMode}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} className="graph-grid">
          {graphData.nodes.length === 0 ? (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              color: 'var(--text-faint)',
            }}>
              <div style={{ fontSize: 40 }}>⬡</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No nodes match the current filters</div>
              <button className="btn btn-ghost" onClick={handleResetGraph}>
                ↺ Reset Filters
              </button>
            </div>
          ) : (
            <Graph
              key={graphKey}
              graphData={graphData}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onHoverNode={setHoverInfo}
              darkMode={darkMode}
              filters={filters}
            />
          )}

          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <Legend />
          </div>

          {topK !== null && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', borderRadius: 999,
              background: 'var(--bg-surface)',
              border: '1px solid rgba(245,158,11,0.35)',
              fontSize: 11.5, color: 'var(--accent-amber)',
              boxShadow: 'var(--shadow-md)',
            }}>
              <span>Top {topK} most cited papers</span>
              <button
                onClick={() => setTopK(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          )}

          {hoverInfo && <NodeHoverPreview hoverInfo={hoverInfo} />}
        </div>

        <SortingControls
          filters={filters}
          onFiltersChange={setFilters}
          graphData={graphData}
          onExport={handleExport}
          onExportCSV={handleExportCSV}
          onTopK={setTopK}
          topK={topK}
          onResetGraph={handleResetGraph}
          bookmarkCount={bookmarks.size}
          onClearBookmarks={() => setBookmarks(new Set())}
        />

        {selectedNode && (
          <NodeDetailsPanel
            node={selectedNode}
            neighborIds={neighborIds}
            graphData={graphData}
            onClose={() => setSelectedNode(null)}
            onSelectNode={setSelectedNode}
            onBookmark={handleBookmark}
            bookmarks={bookmarks}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}
