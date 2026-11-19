import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { AttackVectorTelemetry } from '../types';
import { BarChart3, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface D3SeverityVelocityChartProps {
  vectors: AttackVectorTelemetry[];
}

interface SeverityGroup {
  tier: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  count: number;
  color: string;
  subVectors: string[];
}

export const D3SeverityVelocityChart: React.FC<D3SeverityVelocityChartProps> = ({ vectors }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const severityData: SeverityGroup[] = useMemo(() => {
    const groups: Record<string, { count: number; subVectors: string[] }> = {
      critical: { count: 0, subVectors: [] },
      high: { count: 0, subVectors: [] },
      medium: { count: 0, subVectors: [] },
      low: { count: 0, subVectors: [] },
    };

    vectors.forEach((v) => {
      if (groups[v.severity]) {
        groups[v.severity].count += v.count;
        groups[v.severity].subVectors.push(v.name.split(' ')[0]);
      }
    });

    return [
      {
        tier: 'critical',
        label: 'Critical Threats',
        count: groups.critical.count,
        color: '#f43f5e',
        subVectors: groups.critical.subVectors,
      },
      {
        tier: 'high',
        label: 'High Severity',
        count: groups.high.count,
        color: '#f59e0b',
        subVectors: groups.high.subVectors,
      },
      {
        tier: 'medium',
        label: 'Medium Risk',
        count: groups.medium.count,
        color: '#06b6d4',
        subVectors: groups.medium.subVectors,
      },
      {
        tier: 'low',
        label: 'Low / Informational',
        count: Math.max(12, groups.low.count),
        color: '#10b981',
        subVectors: ['Beacons', 'Telemetry'],
      },
    ];
  }, [vectors]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || severityData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth || 400;
    const height = 180;
    const margin = { top: 15, right: 35, bottom: 25, left: 110 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxCount = d3.max(severityData, (d) => d.count) || 100;
    const xScale = d3.scaleLinear().domain([0, maxCount * 1.15]).range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(severityData.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.3);

    // Defs gradients
    const defs = svg.append('defs');
    severityData.forEach((d) => {
      const grad = defs
        .append('linearGradient')
        .attr('id', `sev-grad-${d.tier}`)
        .attr('x1', '0%')
        .attr('x2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', d.color).attr('stop-opacity', 0.8);
      grad.append('stop').attr('offset', '100%').attr('stop-color', d.color).attr('stop-opacity', 1.0);
    });

    // Background track bars
    g.selectAll('.bg-bar')
      .data(severityData)
      .enter()
      .append('rect')
      .attr('class', 'bg-bar')
      .attr('y', (d) => yScale(d.label) || 0)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', innerWidth)
      .attr('rx', 4)
      .attr('fill', '#0f172a');

    // Animated data bars
    g.selectAll('.data-bar')
      .data(severityData)
      .enter()
      .append('rect')
      .attr('class', 'data-bar')
      .attr('y', (d) => yScale(d.label) || 0)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('fill', (d) => `url(#sev-grad-${d.tier})`)
      .attr('width', 0)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => xScale(d.count));

    // Value labels
    g.selectAll('.val-label')
      .data(severityData)
      .enter()
      .append('text')
      .attr('class', 'val-label')
      .attr('x', (d) => xScale(d.count) + 8)
      .attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('fill', (d) => d.color)
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', 'bold')
      .text((d) => d.count.toLocaleString());

    // Y Axis labels
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const gy = g.append('g').call(yAxis).attr('color', '#94a3b8');
    gy.select('.domain').remove();
    gy.selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '600')
      .attr('dx', '-6');
  }, [severityData]);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Attack Severity Spectrum</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950/80 border border-teal-500/40 text-teal-300">
                D3.js Bar Spectrum
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Distribution of blocked attack vectors by risk classification
            </p>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full bg-slate-950/50 rounded-xl p-2 border border-slate-900">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
};
