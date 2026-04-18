import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '⬡',
    title: 'Interactive Graph Visualization',
    desc: 'Explore research papers, models, and datasets through a live force-directed D3 graph with zoom, pan, and drag.',
  },
  {
    icon: '⇅',
    title: 'Sorting & Ranking',
    desc: 'Rank nodes by citation count, publication year, or connection degree. Ascending or descending — your call.',
  },
  {
    icon: '⚙',
    title: 'Model & Dataset Extraction',
    desc: 'Each paper node links directly to the ML models and datasets it uses, extracted from the full paper text.',
  },
  {
    icon: '⊞',
    title: 'Powerful Filtering',
    desc: 'Filter by node type, year range, citation threshold, and search by name to focus on what matters.',
  },
  {
    icon: '↓',
    title: 'Export & Analysis',
    desc: 'Download the full graph as JSON for offline analysis. Use Top-K view to surface the most cited work instantly.',
  },
  {
    icon: '◐',
    title: 'Dark & Light Mode',
    desc: 'Persistent theme preference. Switch between dark mode for late-night deep dives or light mode for presentations.',
  },
];

const STATS = [
  { value: '20+', label: 'Research Papers' },
  { value: '6+',  label: 'ML Models' },
  { value: '10+', label: 'Datasets' },
  { value: '22+', label: 'Graph Edges' },
];

export default function Landing({ darkMode }) {
  const navigate = useNavigate();

  const bg = darkMode ? '#050a14' : '#f8fafc';
  const cardBg = darkMode ? '#060d1a' : '#ffffff';
  const border = darkMode ? '#0f1f36' : '#e2e8f0';
  const titleColor = darkMode ? '#f1f5f9' : '#0f172a';
  const textColor = darkMode ? '#64748b' : '#64748b';
  const accentColor = '#0ea5e9';

  return (
    <div
      className="min-h-screen overflow-auto"
      style={{ background: bg }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: darkMode
            ? 'radial-gradient(ellipse 80% 40% at 50% -10%, #0ea5e920 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 40% at 50% -10%, #bae6fd50 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{
              background: accentColor + '15',
              border: `1px solid ${accentColor}33`,
              color: accentColor,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: accentColor }} />
            Scientific Literature Knowledge Graph
          </div>

          <h1
            className="text-5xl font-bold tracking-tight mb-6 leading-tight"
            style={{ color: titleColor, fontFamily: 'var(--font-sans)' }}
          >
            Explore Research
            <br />
            <span style={{ color: accentColor }}>Like Never Before</span>
          </h1>

          <p
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: textColor }}
          >
            An interactive knowledge graph explorer for scientific literature. Discover connections
            between papers, models, and datasets through a beautiful force-directed visualization.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/graph')}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 24px #0ea5e940',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px #0ea5e950'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px #0ea5e940'; }}
            >
              Explore Graph →
            </button>
            <button
              onClick={() => navigate('/graph')}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'transparent',
                color: textColor,
                border: `1px solid ${border}`,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textColor; }}
            >
              View Demo
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden mb-20"
          style={{ border: `1px solid ${border}`, background: cardBg }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: `1px solid ${border}`, background: darkMode ? '#080f1e' : '#f1f5f9' }}
          >
            <div className="flex gap-1.5">
              {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <span className="text-xs font-mono" style={{ color: textColor }}>literature-graph — explorer</span>
          </div>
          <div className="p-8 graph-grid" style={{ minHeight: 320, position: 'relative' }}>
            <GraphPreview darkMode={darkMode} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-20 md:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl p-5 text-center"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: accentColor, fontFamily: 'var(--font-sans)' }}
              >
                {value}
              </div>
              <div className="text-xs" style={{ color: textColor }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2
            className="text-3xl font-bold text-center mb-3 tracking-tight"
            style={{ color: titleColor }}
          >
            Built for Researchers
          </h2>
          <p className="text-center mb-12" style={{ color: textColor }}>
            Everything you need to navigate the scientific literature landscape.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-5 transition-all"
                style={{ background: cardBg, border: `1px solid ${border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor + '55'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4"
                  style={{ background: accentColor + '15', color: accentColor }}
                >
                  {icon}
                </div>
                <h3
                  className="font-semibold text-sm mb-2"
                  style={{ color: titleColor }}
                >
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: textColor }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: darkMode
              ? 'linear-gradient(135deg, #0f2744 0%, #0a1628 100%)'
              : 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)',
            border: `1px solid ${border}`,
          }}
        >
          <h2
            className="text-3xl font-bold mb-4 tracking-tight"
            style={{ color: titleColor }}
          >
            Ready to explore?
          </h2>
          <p className="mb-8 text-sm" style={{ color: textColor }}>
            Dive into the knowledge graph and discover connections between landmark AI papers.
          </p>
          <button
            onClick={() => navigate('/graph')}
            className="px-10 py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px #0ea5e940',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Open Graph Explorer →
          </button>
        </div>
      </div>
    </div>
  );
}

function GraphPreview({ darkMode }) {
  const nodes = [
    { x: 200, y: 120, type: 'paper',   label: 'Attention Is All You Need' },
    { x: 380, y: 80,  type: 'paper',   label: 'BERT' },
    { x: 500, y: 160, type: 'paper',   label: 'GPT-3' },
    { x: 130, y: 230, type: 'model',   label: 'Transformer' },
    { x: 430, y: 220, type: 'dataset', label: 'BooksCorpus' },
    { x: 580, y: 100, type: 'model',   label: 'GPT-3 (175B)' },
    { x: 300, y: 200, type: 'dataset', label: 'GLUE Benchmark' },
    { x: 100, y: 140, type: 'dataset', label: 'WMT 2014' },
  ];

  const edges = [
    [0, 3], [0, 7], [1, 3], [1, 4], [1, 6], [2, 5], [2, 4],
  ];

  const cfg = {
    paper:   { color: '#38bdf8', r: 10 },
    model:   { color: '#f59e0b', r: 8 },
    dataset: { color: '#34d399', r: 8 },
  };

  return (
    <svg width="100%" height="280" viewBox="0 0 680 280" style={{ overflow: 'visible' }}>
      {edges.map(([s, t], i) => (
        <line
          key={i}
          x1={nodes[s].x} y1={nodes[s].y}
          x2={nodes[t].x} y2={nodes[t].y}
          stroke={darkMode ? '#1e3a5f' : '#cbd5e1'}
          strokeWidth="1"
          strokeOpacity="0.6"
        />
      ))}
      {nodes.map((n, i) => {
        const c = cfg[n.type];
        return (
          <g key={i} transform={`translate(${n.x},${n.y})`}>
            <circle r={c.r} fill={c.color + '25'} stroke={c.color} strokeWidth="1.5" />
            <circle r={3} fill={c.color} />
            <text
              y={c.r + 12}
              textAnchor="middle"
              fill={darkMode ? '#334155' : '#94a3b8'}
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {n.label.length > 18 ? n.label.slice(0, 18) + '…' : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
