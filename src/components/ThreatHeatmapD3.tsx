import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DailyThreatData } from '../types';
import {
  Calendar,
  ShieldAlert,
  Flame,
  Activity,
  Filter,
  Info,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ThreatHeatmapD3Props {
  data: DailyThreatData[];
  onSelectDay?: (day: DailyThreatData) => void;
  selectedDate?: string | null;
}

type ThreatFilter = 'all' | 'phishing' | 'xss' | 'tracker' | 'malware';

export const ThreatHeatmapD3: React.FC<ThreatHeatmapD3Props> = ({
  data,
  onSelectDay,
  selectedDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeFilter, setActiveFilter] = useState<ThreatFilter>('all');
  const [hoveredDay, setHoveredDay] = useState<DailyThreatData | null>(null);
  const [activeDay, setActiveDay] = useState<DailyThreatData | null>(
    () => (data.length > 0 ? data[data.length - 1] : null)
  );

  // Sync external selectedDate
  useEffect(() => {
    if (selectedDate) {
      const match = data.find((d) => d.date === selectedDate);
      if (match) setActiveDay(match);
    }
  }, [selectedDate, data]);

  // Aggregate stats
  const totalBlocked = data.reduce((acc, d) => {
    if (activeFilter === 'phishing') return acc + d.breakdown.phishing;
    if (activeFilter === 'xss') return acc + d.breakdown.xss;
    if (activeFilter === 'tracker') return acc + d.breakdown.tracker;
    if (activeFilter === 'malware') return acc + d.breakdown.malware;
    return acc + d.totalBlocked;
  }, 0);

  const dailyAvg = Math.round(totalBlocked / Math.max(1, data.length));
  const peakDay = [...data].sort((a, b) => {
    const valA =
      activeFilter === 'all' ? a.totalBlocked : a.breakdown[activeFilter];
    const valB =
      activeFilter === 'all' ? b.totalBlocked : b.breakdown[activeFilter];
    return valB - valA;
  })[0];

  const minDay = [...data].sort((a, b) => {
    const valA =
      activeFilter === 'all' ? a.totalBlocked : a.breakdown[activeFilter];
    const valB =
      activeFilter === 'all' ? b.totalBlocked : b.breakdown[activeFilter];
    return valA - valB;
  })[0];

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 28, right: 24, bottom: 40, left: 44 };
    const width = Math.max(340, containerWidth);
    const height = 180;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', '100%');

    // Group data by weeks / days
    // 30 days can be arranged in a calendar-like layout (7 rows for days of week Sun-Sat, ~5 columns for weeks)
    // Or 30 distinct columns if width is ample, but multi-row week grid provides clean SIEM dashboard feel
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Map each item to weekIndex and dayOfWeek
    const firstDate = new Date(data[0].date);
    const dayOfWeekOffset = firstDate.getDay();

    const mappedData = data.map((d, index) => {
      const globalSlot = index + dayOfWeekOffset;
      const weekIndex = Math.floor(globalSlot / 7);
      const rowDayIndex = d.dayIndex;
      const value =
        activeFilter === 'all'
          ? d.totalBlocked
          : d.breakdown[activeFilter];
      return {
        ...d,
        weekIndex,
        rowDayIndex,
        filteredValue: value,
      };
    });

    const maxWeeks = d3.max(mappedData, (d) => d.weekIndex) ?? 5;
    const totalCols = maxWeeks + 1;

    // Calculate cell dimensions
    const availableWidth = width - margin.left - margin.right;
    const availableHeight = height - margin.top - margin.bottom;

    const cellSize = Math.min(
      Math.floor(availableWidth / totalCols) - 4,
      Math.floor(availableHeight / 7) - 3,
      28
    );
    const cellPadding = 4;

    const maxVal = Math.max(
      1,
      d3.max(mappedData, (d) => d.filteredValue) || 50
    );

    // Color Scale with Cyber Glow Palette
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxVal])
      .interpolator(
        activeFilter === 'phishing'
          ? d3.interpolateRgbBasis(['#0f172a', '#3b0764', '#9333ea', '#ec4899', '#f43f5e'])
          : activeFilter === 'xss'
          ? d3.interpolateRgbBasis(['#0f172a', '#451a03', '#d97706', '#f59e0b', '#fbbf24'])
          : activeFilter === 'tracker'
          ? d3.interpolateRgbBasis(['#0f172a', '#064e3b', '#059669', '#10b981', '#34d399'])
          : d3.interpolateRgbBasis(['#0f172a', '#083344', '#0891b2', '#06b6d4', '#f43f5e'])
      );

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Render Row Labels (Days of week)
    const dayIndicesToShow = [1, 3, 5]; // Mon, Wed, Fri
    dayIndicesToShow.forEach((dayIdx) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', dayIdx * (cellSize + cellPadding) + cellSize / 2 + 3)
        .attr('text-anchor', 'end')
        .attr('class', 'text-[10px] font-mono fill-slate-400')
        .style('font-size', '10px')
        .style('font-family', 'monospace')
        .text(dayLabels[dayIdx]);
    });

    // Render Column Week / Month Headers
    const weekHeaders = new Map<number, string>();
    mappedData.forEach((d) => {
      if (!weekHeaders.has(d.weekIndex)) {
        weekHeaders.set(d.weekIndex, d.displayDate);
      }
    });

    weekHeaders.forEach((label, weekIdx) => {
      g.append('text')
        .attr('x', weekIdx * (cellSize + cellPadding) + cellSize / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[10px] font-mono fill-slate-400')
        .style('font-size', '9px')
        .style('font-family', 'monospace')
        .text(label.split(' ')[0] + ' ' + label.split(' ')[1]);
    });

    // Render Heatmap Cells
    const cells = g
      .selectAll('rect')
      .data(mappedData)
      .enter()
      .append('rect')
      .attr('x', (d) => d.weekIndex * (cellSize + cellPadding))
      .attr('y', (d) => d.rowDayIndex * (cellSize + cellPadding))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => (d.filteredValue === 0 ? '#0b1329' : colorScale(d.filteredValue)))
      .attr('stroke', (d) =>
        activeDay?.date === d.date
          ? '#38bdf8'
          : d.filteredValue > 35
          ? 'rgba(244,63,94,0.4)'
          : 'rgba(30, 41, 59, 0.8)'
      )
      .attr('stroke-width', (d) => (activeDay?.date === d.date ? 2 : 1))
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease');

    // Interactive Hover & Click Effects
    cells
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('transform', `scale(1.1)`)
          .attr('transform-origin', `${d.weekIndex * (cellSize + cellPadding) + cellSize / 2}px ${d.rowDayIndex * (cellSize + cellPadding) + cellSize / 2}px`)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2);

        setHoveredDay(d);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('transform', 'scale(1)')
          .attr('stroke', activeDay?.date === d.date ? '#38bdf8' : d.filteredValue > 35 ? 'rgba(244,63,94,0.4)' : 'rgba(30, 41, 59, 0.8)')
          .attr('stroke-width', activeDay?.date === d.date ? 2 : 1);

        setHoveredDay(null);
      })
      .on('click', (event, d) => {
        setActiveDay(d);
        if (onSelectDay) onSelectDay(d);
      });

    // Render Heatmap Legend in D3
    const legendWidth = 140;
    const legendHeight = 8;
    const legendX = width - margin.right - legendWidth - 10;
    const legendY = height - 16;

    const legendG = svg.append('g').attr('transform', `translate(${legendX}, ${legendY})`);

    // Legend gradient definition
    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient');

    linearGradient
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#0f172a' },
        { offset: '35%', color: activeFilter === 'phishing' ? '#9333ea' : activeFilter === 'xss' ? '#d97706' : '#0891b2' },
        { offset: '70%', color: activeFilter === 'phishing' ? '#ec4899' : activeFilter === 'xss' ? '#f59e0b' : '#06b6d4' },
        { offset: '100%', color: '#f43f5e' },
      ])
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    legendG
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 3)
      .attr('fill', 'url(#heatmap-legend-gradient)')
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.5);

    legendG
      .append('text')
      .attr('x', 0)
      .attr('y', -4)
      .attr('class', 'text-[9px] font-mono fill-slate-400')
      .style('font-size', '9px')
      .style('font-family', 'monospace')
      .text('Low (0)');

    legendG
      .append('text')
      .attr('x', legendWidth)
      .attr('y', -4)
      .attr('text-anchor', 'end')
      .attr('class', 'text-[9px] font-mono fill-slate-400')
      .style('font-size', '9px')
      .style('font-family', 'monospace')
      .text(`Surge (${maxVal})`);
  }, [data, activeFilter, activeDay]);

  const displayedDay = hoveredDay || activeDay;

  return (
    <div className="glass-panel rounded-2xl border border-cyan-500/20 p-5 space-y-4">
      {/* Heatmap Top Bar with Title & Threat Type Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>30-Day Blocked Malicious Ingress Heatmap</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-normal">
                D3.js SVG Vector Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive timeline visualizing blocked exploits, phishing traps, and tracker payloads across the last 30 days.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs font-mono overflow-x-auto scrollbar-none">
          <span className="text-slate-500 pl-1 pr-1.5 hidden md:inline text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(
            [
              { id: 'all', label: 'All Vectors' },
              { id: 'phishing', label: 'Phishing' },
              { id: 'xss', label: 'DOM XSS' },
              { id: 'tracker', label: 'Trackers' },
              { id: 'malware', label: 'Malware' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                activeFilter === filter.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 font-mono block">30-Day Blocked Requests</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{totalBlocked.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 font-mono block">Daily Block Average</span>
          <div className="text-xl font-bold font-mono text-teal-300 mt-0.5 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>{dailyAvg} / day</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 font-mono block">Peak Attack Surge</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-0.5 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>{peakDay?.totalBlocked || 0} reqs</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{peakDay?.displayDate}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          <span className="text-[10px] text-slate-400 font-mono block">Cleanest Observation</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{minDay?.totalBlocked || 0} reqs</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{minDay?.displayDate}</span>
        </div>
      </div>

      {/* D3 SVG Heatmap Container */}
      <div
        ref={containerRef}
        className="w-full h-48 sm:h-52 rounded-xl bg-slate-950/90 border border-slate-800/80 p-2 overflow-x-auto overflow-y-hidden relative flex items-center justify-center"
      >
        <svg ref={svgRef} className="max-w-full" />
      </div>

      {/* Interactive Day Telemetry Inspection Card */}
      {displayedDay && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                displayedDay.totalBlocked > 45
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : displayedDay.totalBlocked > 25
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-100 font-bold text-sm">
                  {displayedDay.displayDate} ({displayedDay.dayOfWeek})
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    displayedDay.peakSeverity === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : displayedDay.peakSeverity === 'high'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {displayedDay.peakSeverity} Risk Surge
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Total Blocked Requests:{' '}
                <strong className="text-cyan-300 font-bold text-sm">
                  {displayedDay.totalBlocked}
                </strong>
              </div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500/30 text-purple-300">
              Phishing: <strong>{displayedDay.breakdown.phishing}</strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300">
              DOM XSS: <strong>{displayedDay.breakdown.xss}</strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300">
              Trackers: <strong>{displayedDay.breakdown.tracker}</strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-rose-500/30 text-rose-300">
              Malware: <strong>{displayedDay.breakdown.malware}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
