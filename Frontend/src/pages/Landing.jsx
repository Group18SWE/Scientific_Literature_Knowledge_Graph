import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '⬡',
    title: 'Interactive Graph Visualization',
    desc: 'Explore a live force-directed D3 graph linking papers, models, datasets, and authors. Drag, zoom, and double-click to focus any subgraph.',
  },
  {
    icon: '⌕',
    title: 'Semantic Paper Search',
    desc: 'Search the Semantic Scholar corpus in natural language. The backend translates your query and returns real academic papers — not just dummy data.',
  },
  {
    icon: '⚙',
    title: 'Automated Knowledge Extraction',
    desc: 'GenAI reads each paper\'s full text and extracts the ML models and datasets it uses, building graph edges automatically via Neo4j.',
  },
  {
    icon: '⊞',
    title: 'Advanced Filtering',
    desc: 'Filter by year range, citation threshold, venue, fields of study, authors, access type, and all edge types — all in real time.',
  },
  {
    icon: '⚡',
    title: 'Derived Metrics & Ranking',
    desc: 'Every paper gets an Impact Score, Citation Density, and Recency Score. Sort by any metric to surface what matters most to you.',
  },
  {
    icon: '↓',
    title: 'Export & Bookmarks',
    desc: 'Download visible graphs as JSON or CSV. Bookmark nodes for later. Top-K mode surfaces the most influential papers at a glance.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter a Query', desc: 'Type any natural language query like "vision transformers for image classification" in the search bar.' },
  { step: '02', title: 'Semantic Scholar Search', desc: 'Your query is translated into an optimized keyword search and sent to the Semantic Scholar Graph API.' },
  { step: '03', title: 'HTML Extraction', desc: 'For each paper with an arXiv ID, the full HTML text is fetched from ar5iv and passed to GenAI for entity extraction.' },
  { step: '04', title: 'Graph Construction', desc: 'Extracted models and datasets are merged into Neo4j — duplicates automatically deduplicated with MERGE.' },
  { step: '05', title: 'Interactive Exploration', desc: 'The resulting knowledge graph is returned and rendered live. Click nodes to explore relationships, filter, and export.' },
];

const TECH_STACK = [
  { name: 'React + D3.js', desc: 'Force-directed graph with zoom, drag, hover tooltips, and glow effects', color: '#5b9df9' },
  { name: 'FastAPI',       desc: 'Async Python backend with concurrent paper processing', color: '#10b981' },
  { name: 'Neo4j AuraDB',  desc: 'Graph database storing papers, models, datasets, and relationships', color: '#fb923c' },
  { name: 'Semantic Scholar', desc: 'Academic paper search API with citation metrics and metadata', color: '#f59e0b' },
  { name: 'Google GenAI',  desc: 'Gemma model extracts structured entities from raw paper text', color: '#22d3ee' },
  { name: 'ar5iv / arXiv', desc: 'HTML versions of arXiv papers for full-text extraction', color: '#a3e635' },
];

const STATS = [
  { value: '200M+', label: 'Papers Indexed (Semantic Scholar)' },
  { value: '4',     label: 'Node Types: Paper, Model, Dataset, Author' },
  { value: '5',     label: 'Edge Types Extracted' },
  { value: '3',     label: 'Derived Metrics per Node' },
];

export default function Landing({ darkMode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-auto" style={{ background: 'var(--bg-base)' }}>
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: darkMode
            ? 'radial-gradient(ellipse 90% 50% at 50% -5%, rgba(91,157,249,0.12) 0%, transparent 65%)'
            : 'radial-gradient(ellipse 90% 50% at 50% -5%, rgba(59,130,246,0.08) 0%, transparent 65%)',
        }}
      />

      <div className="relative" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

        <section style={{ paddingTop: 96, paddingBottom: 80, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999, marginBottom: 28,
            background: 'rgba(91,157,249,0.1)',
            border: '1px solid rgba(91,157,249,0.25)',
            fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }} className="animate-pulse-dot" />
            Scientific Literature Knowledge Graph
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 20,
            fontFamily: 'var(--font-sans)',
          }}>
            Explore How Papers,
            <br />
            <span style={{ color: 'var(--accent-blue)' }}>Models, and Datasets</span>
            <br />
            Connect
          </h1>

          <p style={{
            fontSize: 17, color: 'var(--text-secondary)', maxWidth: 580,
            margin: '0 auto 36px', lineHeight: 1.65,
          }}>
            An interactive knowledge graph explorer for scientific literature. Powered by
            Semantic Scholar, Neo4j, and GenAI extraction.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/graph')}
              style={{
                padding: '12px 28px', borderRadius: 10, fontWeight: 600, fontSize: 14,
                background: 'var(--accent-blue)', color: '#fff',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(91,157,249,0.35)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              Start Exploring →
            </button>
            <button
              onClick={() => navigate('/graph')}
              style={{
                padding: '12px 28px', borderRadius: 10, fontWeight: 500, fontSize: 14,
                background: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              View Demo
            </button>
          </div>
        </section>

        <section style={{ marginBottom: 80 }}>
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                literature-graph — knowledge-explorer
              </span>
            </div>
            <div className="graph-grid" style={{ minHeight: 340, position: 'relative', overflow: 'hidden' }}>
              <GraphPreview darkMode={darkMode} />
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{
                textAlign: 'center', padding: '24px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
              }}>
                <div style={{
                  fontSize: 32, fontWeight: 700, color: 'var(--accent-blue)',
                  fontFamily: 'var(--font-sans)', marginBottom: 6, letterSpacing: '-0.02em',
                }}>{value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 80 }}>
          <SectionHeader title="Built for Researchers" sub="Everything you need to navigate the scientific literature landscape." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  padding: '20px', borderRadius: 12,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(91,157,249,0.45)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(91,157,249,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 9, marginBottom: 14,
                  background: 'rgba(91,157,249,0.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, color: 'var(--accent-blue)',
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 7 }}>{title}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 80 }}>
          <SectionHeader title="How It Works" sub="From natural language query to interactive knowledge graph in seconds." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {HOW_IT_WORKS.map(({ step, title, desc }, idx) => (
              <div key={step} style={{
                display: 'flex', gap: 24, padding: '20px 0',
                borderBottom: idx < HOW_IT_WORKS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                }}>
                  {step}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>{title}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 80 }}>
          <SectionHeader title="Tech Stack" sub="Open, modern, and built to scale." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {TECH_STACK.map(({ name, desc, color }) => (
              <div key={name} style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ width: 3, borderRadius: 2, background: color, alignSelf: 'stretch', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{
          padding: '60px 40px', borderRadius: 16, textAlign: 'center',
          background: darkMode
            ? 'linear-gradient(135deg, rgba(91,157,249,0.08) 0%, rgba(16,185,129,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(16,185,129,0.05) 100%)',
          border: '1px solid var(--border-default)',
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Ready to explore?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
            Dive into the knowledge graph and discover the connections that shape modern machine learning.
          </p>
          <button
            onClick={() => navigate('/graph')}
            style={{
              padding: '13px 32px', borderRadius: 10, fontWeight: 600, fontSize: 14,
              background: 'var(--accent-blue)', color: '#fff',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(91,157,249,0.35)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            Open Graph Explorer →
          </button>
        </section>

        <footer style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Scientific Literature Knowledge Graph · Built with React, D3.js, FastAPI, Neo4j, and GenAI
          </p>
        </footer>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <h2 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function GraphPreview({ darkMode }) {
  const nodes = [
    { x: 220, y: 130, type: 'paper',   label: 'Attention Is All You Need' },
    { x: 420, y: 80,  type: 'paper',   label: 'BERT' },
    { x: 560, y: 160, type: 'paper',   label: 'GPT-3' },
    { x: 140, y: 240, type: 'model',   label: 'Transformer' },
    { x: 470, y: 240, type: 'dataset', label: 'BooksCorpus' },
    { x: 620, y: 90,  type: 'model',   label: 'GPT-3 (175B)' },
    { x: 320, y: 210, type: 'dataset', label: 'GLUE Benchmark' },
    { x: 110, y: 155, type: 'dataset', label: 'WMT 2014' },
    { x: 340, y: 300, type: 'author',  label: 'Ashish Vaswani' },
    { x: 500, y: 310, type: 'author',  label: 'Jacob Devlin' },
  ];

  const edges = [
    [0, 3], [0, 7], [1, 3], [1, 4], [1, 6], [2, 5], [2, 4], [0, 8], [1, 9],
  ];

  const cfg = {
    paper:   { color: '#5b9df9', r: 10 },
    model:   { color: '#f59e0b', r: 8 },
    dataset: { color: '#10b981', r: 8 },
    author:  { color: '#fb923c', r: 7 },
  };

  return (
    <svg width="100%" height="360" viewBox="0 0 740 360" style={{ overflow: 'visible' }}>
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
            <circle r={c.r + 5} fill={c.color + '18'} />
            <circle r={c.r} fill={c.color + '22'} stroke={c.color} strokeWidth="1.5" />
            <circle r={c.r * 0.3} fill={c.color} />
            <text
              y={c.r + 13}
              textAnchor="middle"
              fill={darkMode ? '#374151' : '#94a3b8'}
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {n.label.length > 20 ? n.label.slice(0, 20) + '…' : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
