import { useState, useCallback, useMemo, useEffect } from 'react';
import Graph, { getSubgraph } from '../components/Graph';
import SidebarFilters from '../components/SidebarFilters';
import SortingControls from '../components/SortingControls';
import NodeDetailsPanel from '../components/NodeDetailsPanel';
import Legend from '../components/Legend';
import { DUMMY_DATA, normalizeGraphData, searchGraph } from '../services/api';

const DEFAULT_FILTERS = {
  search: '',
  paper: true,
  model: true,
  dataset: true,
  yearMin: 2017,
  yearMax: 2024,
  minCitations: 0,
  sortBy: 'citations',
  sortOrder: 'desc',
  maxNodes: 100,
};

export default function ResearchGraph({ darkMode }) {
  const [rawData, setRawData] = useState(DUMMY_DATA);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedNode, setSelectedNode] = useState(null);
  const [apiQuery, setApiQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [topK, setTopK] = useState(null);
  const [graphKey, setGraphKey] = useState(0);

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
    const q = filters.search.toLowerCase();

    let nodes = rawData.nodes.filter((n) => {
      if (!filters[n.type]) return false;
      if (q && !n.label.toLowerCase().includes(q) && !(n.metadata?.title || '').toLowerCase().includes(q)) return false;
      if (n.type === 'paper' && n.metadata?.year != null) {
        if (n.metadata.year < filters.yearMin || n.metadata.year > filters.yearMax) return false;
      }
      if (n.type === 'paper' && n.metadata?.citationCount != null) {
        if (n.metadata.citationCount < filters.minCitations) return false;
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
      nodes = [...papers, ...nonPapers.filter((n) => {
        const edges = rawData.edges.filter(
          (e) => (e.source === n.id || e.target === n.id) &&
                 (paperIds.has(e.source) || paperIds.has(e.target))
        );
        return edges.length > 0;
      })];
    }

    const { sortBy, sortOrder } = filters;
    nodes = [...nodes].sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'citations') {
        aVal = a.metadata?.citationCount || 0;
        bVal = b.metadata?.citationCount || 0;
      } else if (sortBy === 'year') {
        aVal = a.metadata?.year || 0;
        bVal = b.metadata?.year || 0;
      } else if (sortBy === 'degree') {
        aVal = degreeMap.get(a.id) || 0;
        bVal = degreeMap.get(b.id) || 0;
      } else {
        return 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    nodes = nodes.slice(0, filters.maxNodes);

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

  const graphMeta = {
    paper:   graphData.nodes.filter((n) => n.type === 'paper').length,
    model:   graphData.nodes.filter((n) => n.type === 'model').length,
    dataset: graphData.nodes.filter((n) => n.type === 'dataset').length,
    total:   graphData.nodes.length,
  };

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'literature-graph.json';
    a.click();
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

  const bg = darkMode ? '#050a14' : '#f1f5f9';
  const headerBg = darkMode ? '#060d1a' : '#ffffff';
  const headerBorder = darkMode ? '#0f1f36' : '#e2e8f0';
  const inputBg = darkMode ? '#0a1628' : '#ffffff';
  const inputBorder = darkMode ? '#1e3a5f' : '#e2e8f0';
  const textColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 49px)', background: bg, overflow: 'hidden' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-2.5 shrink-0"
        style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
      >
        <div className="relative flex-1 max-w-md">
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: textColor }}
          >
            ⌕
          </span>
          <input
            value={apiQuery}
            onChange={(e) => setApiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApiSearch()}
            placeholder="Search papers via backend API..."
            className="w-full rounded-lg text-xs pl-7 pr-3 py-1.5 outline-none"
            style={{
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              color: textColor,
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
        <button
          onClick={handleApiSearch}
          disabled={isLoading || !apiQuery.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
          style={{
            background: isLoading ? inputBg : '#0ea5e9',
            border: `1px solid ${isLoading ? inputBorder : '#0ea5e9'}`,
            color: isLoading ? textColor : '#ffffff',
            cursor: isLoading || !apiQuery.trim() ? 'not-allowed' : 'pointer',
            opacity: !apiQuery.trim() ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-transparent border-t-current animate-spin-slow inline-block" />
              Searching
            </>
          ) : 'Search'}
        </button>

        <div className="flex items-center gap-3 ml-2 text-xs" style={{ color: textColor }}>
          {['paper', 'model', 'dataset'].map((t) => {
            const colors = { paper: '#38bdf8', model: '#f59e0b', dataset: '#34d399' };
            return (
              <span key={t} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[t] }} />
                {graphMeta[t]} {t}s
              </span>
            );
          })}
        </div>

        {error && (
          <div
            className="text-xs px-3 py-1 rounded-lg"
            style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <SidebarFilters
          filters={filters}
          onFiltersChange={setFilters}
          graphData={rawData}
          darkMode={darkMode}
        />

        <div className="flex-1 relative overflow-hidden graph-grid">
          {graphData.nodes.length === 0 ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ color: darkMode ? '#1e3a5f' : '#94a3b8' }}
            >
              <div className="text-4xl">⬡</div>
              <div className="text-sm">No nodes match the current filters</div>
              <button
                onClick={handleResetGraph}
                className="text-xs px-4 py-2 rounded-lg transition-all"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textColor,
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <Graph
              key={graphKey}
              graphData={graphData}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              darkMode={darkMode}
            />
          )}

          <div className="absolute bottom-4 left-4">
            <Legend darkMode={darkMode} />
          </div>

          {topK !== null && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs flex items-center gap-2"
              style={{
                background: darkMode ? '#0a1628' : '#ffffff',
                border: `1px solid ${darkMode ? '#1e3a5f' : '#e2e8f0'}`,
                color: '#f59e0b',
              }}
            >
              <span>Top {topK} most cited papers</span>
              <button
                onClick={() => setTopK(null)}
                className="ml-1"
                style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', fontSize: 14 }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <SortingControls
          filters={filters}
          onFiltersChange={setFilters}
          graphData={graphData}
          darkMode={darkMode}
          onExport={handleExport}
          onTopK={setTopK}
          topK={topK}
          onResetGraph={handleResetGraph}
        />

        {selectedNode && (
          <NodeDetailsPanel
            node={selectedNode}
            neighborIds={neighborIds}
            graphData={graphData}
            onClose={() => setSelectedNode(null)}
            onSelectNode={setSelectedNode}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}
