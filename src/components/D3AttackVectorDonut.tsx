import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AttackVectorTelemetry } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  Radio,
  ExternalLink,
  Lock,
  Flame,
} from 'lucide-react';

interface D3AttackVectorDonutProps {
  vectors: AttackVectorTelemetry[];
  selectedVectorKey?: string | null;
  onSelectVector?: (vector: AttackVectorTelemetry) => void;
}

export const D3AttackVectorDonut: React.FC<D3AttackVectorDonutProps> = ({
  vectors,
  selectedVectorKey,
  onSelectVector,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [hoveredVector, setHoveredVector] = useState<AttackVectorTelemetry | null>(null);
  const [activeVector, setActiveVector] = useState<AttackVectorTelemetry | null>(() => {
    return vectors.length > 0 ? vectors[0] : null;
  });

  // Keep activeVector updated if selectedVectorKey changes
  useEffect(() => {
    if (selectedVectorKey) {
      const match = vectors.find((v) => v.key === selectedVectorKey);
      if (match) setActiveVector(match);
    }
  }, [selectedVectorKey, vectors]);

  const totalBlocked = useMemo(() => {
    return vectors.reduce((sum, v) => sum + v.count, 0);
  }, [vectors]);

  const displayedVector = hoveredVector || activeVector || vectors[0] || null;

  // Render D3 Donut Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || vectors.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const size = Math.min(containerRef.current.clientWidth || 320, 320);
    const width = size;
    const height = size;
    const margin = 20;
    const outerRadius = width / 2 - margin;
    const innerRadius = outerRadius * 0.62;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100% ')
      .attr('height', height);

    const defs = svg.append('defs');

    // Create glow filter
    const filter = defs.append('filter').attr('id', 'donut-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // D3 Pie Generator
    const pie = d3
      .pie<AttackVectorTelemetry>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.035);

    // D3 Arc Generator
    const arc = d3
      .arc<d3.PieArcDatum<AttackVectorTelemetry>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(5);

    // Hover Arc Generator (Expanded)
    const arcHover = d3
      .arc<d3.PieArcDatum<AttackVectorTelemetry>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(outerRadius + 8)
      .cornerRadius(6);

    const pieData = pie(vectors);

    // Slices group
    const sliceGroup = g
      .selectAll('.arc')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer');

    // Render paths
    const paths = sliceGroup
      .append('path')
      .attr('d', (d) => {
        const isHovered = displayedVector?.key === d.data.key;
        return isHovered ? arcHover(d) : arc(d);
      })
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#020617')
      .attr('stroke-width', 2)
      .attr('filter', (d) => (displayedVector?.key === d.data.key ? 'url(#donut-glow)' : 'none'))
      .style('transition', 'all 0.25s ease-out');

    // Hover & Click Handlers
    sliceGroup
      .on('mouseenter', (event: MouseEvent, d) => {
        setHoveredVector(d.data);
        d3.select(event.currentTarget as SVGGElement)
          .select('path')
          .transition()
          .duration(150)
          .attr('d', arcHover(d) || '')
          .attr('filter', 'url(#donut-glow)');
      })
      .on('mouseleave', (event: MouseEvent, d) => {
        setHoveredVector(null);
        const isCurrentActive = activeVector?.key === d.data.key;
        d3.select(event.currentTarget as SVGGElement)
          .select('path')
          .transition()
          .duration(150)
          .attr('d', isCurrentActive ? arcHover(d) || '' : arc(d) || '')
          .attr('filter', isCurrentActive ? 'url(#donut-glow)' : 'none');
      })
      .on('click', (_, d) => {
        setActiveVector(d.data);
        if (onSelectVector) onSelectVector(d.data);
      });

    // Outer subtle ring
    g.append('circle')
      .attr('r', outerRadius + 10)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,6');

    // Inner subtle ring
    g.append('circle')
      .attr('r', innerRadius - 6)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4');
  }, [vectors, displayedVector?.key, activeVector?.key]);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Blocked Attack Vectors Distribution</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 border border-rose-500/40 text-rose-300">
                D3.js Radial Arc
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Taxonomy of malicious payloads neutralized by the Aegis defense subsystems
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* D3 Donut Visual with Center Overlay */}
        <div ref={containerRef} className="lg:col-span-5 relative flex items-center justify-center py-2">
          <svg ref={svgRef} className="max-w-[280px] w-full" />

          {/* Center Hole Information Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              {displayedVector ? displayedVector.name.split(' ')[0] : 'Total Blocked'}
            </span>
            <span
              className="text-2xl font-extrabold font-mono transition-colors tracking-tight"
              style={{ color: displayedVector ? displayedVector.color : '#22d3ee' }}
            >
              {displayedVector ? `${displayedVector.percentage}%` : totalBlocked.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {displayedVector ? `${displayedVector.count} blocked` : 'Neutralized'}
            </span>
          </div>
        </div>

        {/* Selected Vector Deep-Dive Card & Vector Legend */}
        <div className="lg:col-span-7 space-y-3">
          {displayedVector && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: displayedVector.color }}
                  />
                  <h4 className="text-sm font-bold text-slate-100">
                    {displayedVector.name}
                  </h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold ${
                    displayedVector.severity === 'critical'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      : displayedVector.severity === 'high'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {displayedVector.severity}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {displayedVector.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] border-t border-slate-800/80">
                <div className="p-2 rounded-lg bg-slate-950/50">
                  <span className="text-slate-500 text-[10px] block">Aegis Subsystem:</span>
                  <span className="text-cyan-300 font-semibold truncate block">
                    {displayedVector.aegisSubsystem}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/50">
                  <span className="text-slate-500 text-[10px] block">Mitigation Applied:</span>
                  <span className="text-emerald-300 font-semibold truncate block">
                    {displayedVector.mitigationMethod}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Vector List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vectors.map((vec) => {
              const isSelected = activeVector?.key === vec.key;
              return (
                <button
                  key={vec.key}
                  type="button"
                  onClick={() => {
                    setActiveVector(vec);
                    if (onSelectVector) onSelectVector(vec);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    isSelected
                      ? 'bg-slate-800 border-slate-700 shadow-md'
                      : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: vec.color }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {vec.percentage}%
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200 text-[11px] truncate">
                    {vec.name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                    {vec.count.toLocaleString()} blocked
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
