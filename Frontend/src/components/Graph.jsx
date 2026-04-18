import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { NODE_CONFIG, EDGE_CONFIG } from './Legend';

function buildAdjacency(edges) {
  const adj = new Map();
  edges.forEach((e) => {
    const src = typeof e.source === 'object' ? e.source.id : e.source;
    const tgt = typeof e.target === 'object' ? e.target.id : e.target;
    if (!adj.has(src)) adj.set(src, []);
    if (!adj.has(tgt)) adj.set(tgt, []);
    adj.get(src).push({ neighborId: tgt, edgeId: e.id });
    adj.get(tgt).push({ neighborId: src, edgeId: e.id });
  });
  return adj;
}

export function getSubgraph(startId, edges) {
  const adj = buildAdjacency(edges);
  const visitedNodes = new Set([startId]);
  const visitedEdges = new Set();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adj.get(current) || [];
    neighbors.forEach(({ neighborId, edgeId }) => {
      visitedEdges.add(edgeId);
      if (!visitedNodes.has(neighborId)) {
        visitedNodes.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  const neighborIds = new Set([...visitedNodes].filter((id) => id !== startId));
  return { neighborIds, edgeIds: visitedEdges };
}

export default function Graph({ graphData, selectedNode, onSelectNode, darkMode }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  const buildGraph = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;

    svg.attr('width', W).attr('height', H);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    const defs = svg.append('defs');

    Object.keys(NODE_CONFIG).forEach((type) => {
      const filter = defs.append('filter')
        .attr('id', `glow-${type}`)
        .attr('x', '-50%').attr('y', '-50%')
        .attr('width', '200%').attr('height', '200%');
      filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    const selFilter = defs.append('filter')
      .attr('id', 'glow-selected')
      .attr('x', '-100%').attr('y', '-100%')
      .attr('width', '300%').attr('height', '300%');
    selFilter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const selMerge = selFilter.append('feMerge');
    selMerge.append('feMergeNode').attr('in', 'blur');
    selMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const { nodes, edges } = graphData;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ ...e }));

    const degreeMap = new Map();
    simEdges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id((d) => d.id).distance(130).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius((d) => NODE_CONFIG[d.type]?.radius + 22));

    simulationRef.current = simulation;

    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(simEdges)
      .enter()
      .append('line')
      .attr('class', (d) => `edge edge-${d.id}`)
      .attr('stroke', (d) => EDGE_CONFIG[d.type]?.color || EDGE_CONFIG.connected_to.color)
      .attr('stroke-width', (d) => EDGE_CONFIG[d.type]?.width || 1.5)
      .attr('stroke-dasharray', (d) => d.type === 'uses_dataset' ? '4,2' : '0')
      .attr('stroke-linecap', 'round');

    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', (d) => `node node-${d.id}`)
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        onSelectNode((prev) => (prev?.id === d.id ? null : { ...d }));
      });

    node.each(function (d) {
      const el = d3.select(this);
      const cfg = NODE_CONFIG[d.type] || NODE_CONFIG.paper;
      const r = cfg.radius;

      if (d.type === 'paper') {
        el.append('circle')
          .attr('r', r)
          .attr('fill', cfg.color + '20')
          .attr('stroke', cfg.color)
          .attr('stroke-width', 1.5);
        el.append('circle').attr('r', 4).attr('fill', cfg.color);
      } else if (d.type === 'model') {
        el.append('path')
          .attr('d', `M0,-${r} L${r},0 L0,${r} L-${r},0 Z`)
          .attr('fill', cfg.color + '20')
          .attr('stroke', cfg.color)
          .attr('stroke-width', 1.5);
        el.append('path')
          .attr('d', `M0,-${r * 0.3} L${r * 0.3},0 L0,${r * 0.3} L-${r * 0.3},0 Z`)
          .attr('fill', cfg.color);
      } else {
        el.append('rect')
          .attr('x', -r).attr('y', -r)
          .attr('width', r * 2).attr('height', r * 2)
          .attr('rx', 3)
          .attr('fill', cfg.color + '20')
          .attr('stroke', cfg.color)
          .attr('stroke-width', 1.5);
        el.append('rect')
          .attr('x', -r * 0.28).attr('y', -r * 0.28)
          .attr('width', r * 0.56).attr('height', r * 0.56)
          .attr('rx', 1)
          .attr('fill', cfg.color);
      }
    });

    node.append('text')
      .text((d) => {
        const words = d.label.split(' ');
        return words.length > 3 ? words.slice(0, 3).join(' ') + '…' : d.label;
      })
      .attr('y', (d) => (NODE_CONFIG[d.type]?.radius || 14) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', darkMode ? '#64748b' : '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('pointer-events', 'none');

    node.append('title').text((d) => d.metadata?.title || d.label);

    svg.on('click', () => onSelectNode(null));

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    svgRef.current._simEdges = simEdges;
    svgRef.current._simulation = simulation;

    return () => simulation.stop();
  }, [graphData, darkMode, onSelectNode]);

  useEffect(() => {
    const cleanup = buildGraph();
    return cleanup;
  }, [buildGraph]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const simEdges = svgRef.current._simEdges || [];

    if (!selectedNode) {
      svg.selectAll('.node').attr('filter', null).style('opacity', 1);
      svg.selectAll('.edge')
        .style('opacity', 1)
        .attr('stroke-width', (d) => EDGE_CONFIG[d.type]?.width || 1.5);
      return;
    }

    const { neighborIds, edgeIds } = getSubgraph(selectedNode.id, simEdges);
    const connectedSet = new Set([selectedNode.id, ...neighborIds]);

    svg.selectAll('.node').each(function (d) {
      const el = d3.select(this);
      const isConnected = connectedSet.has(d.id);
      const isSelected = d.id === selectedNode.id;
      el.style('opacity', isConnected ? 1 : 0.07);
      if (isSelected) el.attr('filter', 'url(#glow-selected)');
      else if (isConnected) el.attr('filter', `url(#glow-${d.type})`);
      else el.attr('filter', null);
    });

    svg.selectAll('.edge').each(function (d) {
      const isConnected = edgeIds.has(d.id);
      const cfg = NODE_CONFIG[d.type === 'uses_model' ? 'model' : 'dataset'];
      d3.select(this)
        .style('opacity', isConnected ? 1 : 0.03)
        .attr('stroke', isConnected
          ? (d.type === 'uses_model' ? '#f59e0b' : '#34d399')
          : (EDGE_CONFIG[d.type]?.color || EDGE_CONFIG.connected_to.color))
        .attr('stroke-width', isConnected ? 2.5 : EDGE_CONFIG[d.type]?.width || 1.5);
    });
  }, [selectedNode]);

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />;
}
