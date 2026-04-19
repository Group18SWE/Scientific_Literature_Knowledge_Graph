import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { NODE_CONFIG, EDGE_CONFIG } from './Legend';
import { computeMetrics } from '../services/api';

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

  return {
    neighborIds: new Set([...visitedNodes].filter((id) => id !== startId)),
    edgeIds: visitedEdges,
  };
}

function computeNodeRadius(node, degreeMap) {
  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.paper;
  const baseR = cfg.radius;
  if (node.type === 'paper') {
    const { impactScore } = computeMetrics(node);
    const scale = Math.min(1 + Math.log10(Math.max(impactScore, 1)) * 0.2, 2.4);
    return baseR * scale;
  }
  const degree = degreeMap.get(node.id) || 0;
  return baseR + Math.min(degree * 1.4, 9);
}

function drawNodeShape(el, d, r, cfg) {
  if (d.type === 'paper') {
    el.append('circle').attr('r', r).attr('fill', cfg.color + '1a').attr('stroke', cfg.color).attr('stroke-width', 1.8);
    el.append('circle').attr('r', r * 0.28).attr('fill', cfg.color);
  } else if (d.type === 'model') {
    const h = r * 1.1;
    el.append('path').attr('d', `M0,${-h} L${h * 0.87},${h * 0.5} L${-h * 0.87},${h * 0.5} Z`).attr('fill', cfg.color + '1a').attr('stroke', cfg.color).attr('stroke-width', 1.8);
    el.append('path').attr('d', `M0,${-h * 0.38} L${h * 0.33},${h * 0.19} L${-h * 0.33},${h * 0.19} Z`).attr('fill', cfg.color);
  } else if (d.type === 'dataset') {
    el.append('path').attr('d', `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`).attr('fill', cfg.color + '1a').attr('stroke', cfg.color).attr('stroke-width', 1.8);
    el.append('circle').attr('r', r * 0.28).attr('fill', cfg.color);
  } else {
    el.append('rect').attr('x', -r).attr('y', -r).attr('width', r * 2).attr('height', r * 2).attr('rx', 3).attr('fill', cfg.color + '1a').attr('stroke', cfg.color).attr('stroke-width', 1.8);
    el.append('rect').attr('x', -r * 0.3).attr('y', -r * 0.3).attr('width', r * 0.6).attr('height', r * 0.6).attr('rx', 1).attr('fill', cfg.color);
  }
}

export default function Graph({ graphData, selectedNode, onSelectNode, onHoverNode, darkMode, filters }) {
  const svgRef = useRef(null);

  const buildGraph = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;
    svg.attr('width', W).attr('height', H);

    const g = svg.append('g');

    const zoom = d3.zoom().scaleExtent([0.05, 8]).on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const defs = svg.append('defs');
    ['paper', 'model', 'dataset', 'author'].forEach((type) => {
      const f = defs.append('filter').attr('id', `glow-${type}`).attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
      f.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in', 'blur');
      m.append('feMergeNode').attr('in', 'SourceGraphic');
    });
    const sf = defs.append('filter').attr('id', 'glow-selected').attr('x', '-80%').attr('y', '-80%').attr('width', '360%').attr('height', '360%');
    sf.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    const sm = sf.append('feMerge');
    sm.append('feMergeNode').attr('in', 'blur');
    sm.append('feMergeNode').attr('in', 'SourceGraphic');

    const { nodes, edges } = graphData;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const degreeMap = new Map();
    edges.forEach((e) => {
      const src = typeof e.source === 'object' ? e.source.id : e.source;
      const tgt = typeof e.target === 'object' ? e.target.id : e.target;
      degreeMap.set(src, (degreeMap.get(src) || 0) + 1);
      degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);
    });

    const radiiMap = new Map(nodes.map((n) => [n.id, computeNodeRadius(n, degreeMap)]));

    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges
      .filter((e) => {
        const src = typeof e.source === 'object' ? e.source.id : e.source;
        const tgt = typeof e.target === 'object' ? e.target.id : e.target;
        if (!nodeMap.has(src) || !nodeMap.has(tgt)) return false;
        if (filters?.showModelEdges === false && e.type === 'uses_model') return false;
        if (filters?.showDatasetEdges === false && e.type === 'uses_dataset') return false;
        if (filters?.showCiteEdges === false && e.type === 'cites') return false;
        if (filters?.showAuthorEdges === false && e.type === 'written_by') return false;
        return true;
      })
      .map((e) => ({ ...e }));

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id((d) => d.id).distance(150).strength(0.35))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius((d) => (radiiMap.get(d.id) || 16) + 22));

    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('line').data(simEdges).enter().append('line')
      .attr('class', (d) => `edge edge-${d.id}`)
      .attr('stroke', (d) => EDGE_CONFIG[d.type]?.color || EDGE_CONFIG.connected_to.color)
      .attr('stroke-width', (d) => EDGE_CONFIG[d.type]?.width || 1)
      .attr('stroke-dasharray', (d) => EDGE_CONFIG[d.type]?.dashed ? '4,2' : '0')
      .attr('stroke-linecap', 'round')
      .style('opacity', 0.75);

    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('g').data(simNodes).enter().append('g')
      .attr('class', (d) => `node node-${d.id}`)
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('mouseenter', (event, d) => { if (onHoverNode) onHoverNode({ node: { ...d }, x: event.clientX, y: event.clientY }); })
      .on('mousemove', (event, d) => { if (onHoverNode) onHoverNode({ node: { ...d }, x: event.clientX, y: event.clientY }); })
      .on('mouseleave', () => { if (onHoverNode) onHoverNode(null); })
      .on('click', (event, d) => {
        event.stopPropagation();
        onSelectNode((prev) => (prev?.id === d.id ? null : { ...d }));
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        const { neighborIds } = getSubgraph(d.id, simEdges);
        const connectedSet = new Set([d.id, ...neighborIds]);
        svg.selectAll('.node').style('opacity', (nd) => connectedSet.has(nd.id) ? 1 : 0.04);
        svg.selectAll('.edge').style('opacity', (ed) => {
          const src = typeof ed.source === 'object' ? ed.source.id : ed.source;
          const tgt = typeof ed.target === 'object' ? ed.target.id : ed.target;
          return connectedSet.has(src) && connectedSet.has(tgt) ? 1 : 0.02;
        });
      });

    node.each(function (d) {
      const el = d3.select(this);
      const cfg = NODE_CONFIG[d.type] || NODE_CONFIG.paper;
      const r = radiiMap.get(d.id) || cfg.radius;
      drawNodeShape(el, d, r, cfg);
    });

    node.append('text')
      .text((d) => {
        const words = (d.label || '').split(' ');
        return words.length > 3 ? words.slice(0, 3).join(' ') + '…' : d.label;
      })
      .attr('y', (d) => (radiiMap.get(d.id) || 14) + 13)
      .attr('text-anchor', 'middle')
      .attr('fill', darkMode ? '#6b7280' : '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('pointer-events', 'none');

    node.append('title').text((d) => d.metadata?.title || d.label);

    svg.on('click', () => {
      onSelectNode(null);
      svg.selectAll('.node').style('opacity', 1).attr('filter', null);
      svg.selectAll('.edge').style('opacity', 0.75).attr('stroke', (d) => EDGE_CONFIG[d.type]?.color || EDGE_CONFIG.connected_to.color).attr('stroke-width', (d) => EDGE_CONFIG[d.type]?.width || 1);
    });

    simulation.on('tick', () => {
      link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    svgRef.current._simEdges = simEdges;
    svgRef.current._simulation = simulation;

    return () => simulation.stop();
  }, [graphData, darkMode, onSelectNode, onHoverNode, filters]);

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
      svg.selectAll('.edge').style('opacity', 0.75).attr('stroke', (d) => EDGE_CONFIG[d.type]?.color || EDGE_CONFIG.connected_to.color).attr('stroke-width', (d) => EDGE_CONFIG[d.type]?.width || 1);
      return;
    }

    const { neighborIds, edgeIds } = getSubgraph(selectedNode.id, simEdges);
    const connectedSet = new Set([selectedNode.id, ...neighborIds]);

    svg.selectAll('.node').each(function (d) {
      const el = d3.select(this);
      const isConnected = connectedSet.has(d.id);
      const isSelected = d.id === selectedNode.id;
      el.style('opacity', isConnected ? 1 : 0.06);
      if (isSelected) el.attr('filter', 'url(#glow-selected)');
      else if (isConnected) el.attr('filter', `url(#glow-${d.type})`);
      else el.attr('filter', null);
    });

    svg.selectAll('.edge').each(function (d) {
      const isConnected = edgeIds.has(d.id);
      const baseColor = EDGE_CONFIG[d.type]?.color || EDGE_CONFIG.connected_to.color;
      d3.select(this)
        .style('opacity', isConnected ? 1 : 0.03)
        .attr('stroke-width', isConnected ? 2.5 : EDGE_CONFIG[d.type]?.width || 1)
        .attr('stroke', isConnected ? baseColor.replace('99', 'ee').replace('55', 'aa') : baseColor);
    });
  }, [selectedNode]);

  return <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
