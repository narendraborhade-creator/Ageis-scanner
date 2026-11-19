import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { RealtimeTrendPoint } from '../types';
import {
  TrendingUp,
  Activity,
  Filter,
  Eye,
  Zap,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface D3RealtimeTrendChartProps {
  data: RealtimeTrendPoint[];
  onSelectPoint?: (point: RealtimeTrendPoint) => void;
  selectedTimestamp?: number | null;
}

type ActiveVectorSeries = 'all' | 'phishing' | 'xss' | 'malware' | 'tracker' | 'insecureHttp' | 'dnsSpoof';

interface SeriesConfig {
  key: ActiveVectorSeries;
  label: string;
  color: string;
  gradientId: string;
}

const SERIES_CONFIGS: SeriesConfig[] = [
  { key: 'all', label: 'All Vectors (Aggregate)', color: '#06b6d4', gradientId: 'grad-all' },
  { key: 'phishing', label: 'Phishing Harvesters', color: '#f43f5e', gradientId: 'grad-phishing' },
  { key: 'xss', label: 'DOM/URL XSS Injections', color: '#f59e0b', gradientId: 'grad-xss' },
  { key: 'malware', label: 'Cryptominers & Malware', color: '#a855f7', gradientId: 'grad-malware' },
  { key: 'tracker', label: 'Trackers & Fingerprinters', color: '#10b981', gradientId: 'grad-tracker' },
  { key: 'insecureHttp', label: 'Insecure HTTP Traffic', color: '#ef4444', gradientId: 'grad-http' },
  { key: 'dnsSpoof', label: 'DNS Spoof / Typosquats', color: '#38bdf8', gradientId: 'grad-dns' },
];

function getSeriesValue(d: RealtimeTrendPoint, series: ActiveVectorSeries): number {
  if (series === 'all') return d.total;
  if (series === 'phishing') return d.phishing;
  if (series === 'xss') return d.xss;
  if (series === 'malware') return d.malware;
  if (series === 'tracker') return d.tracker;
  if (series === 'insecureHttp') return d.insecureHttp;
  if (series === 'dnsSpoof') return d.dnsSpoof;
  return d.total;
}

export const D3RealtimeTrendChart: React.FC<D3RealtimeTrendChartProps> = ({
  data,
  onSelectPoint,
  selectedTimestamp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeSeries, setActiveSeries] = useState<ActiveVectorSeries>('all');
  const [hoveredPoint, setHoveredPoint] = useState<RealtimeTrendPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '12h' | '6h'>('24h');

  // Filtered dataset based on selected time window
  const displayData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === '6h') return data.slice(-6);
    if (timeRange === '12h') return data.slice(-12);
    return data;
  }, [data, timeRange]);

  // Aggregate stats
  const totalCount = useMemo(() => {
    return displayData.reduce((acc, d) => acc + getSeriesValue(d, activeSeries), 0);
  }, [displayData, activeSeries]);

  const peakPoint = useMemo(() => {
    if (displayData.length === 0) return null;
    return [...displayData].sort((a, b) => {
      const valA = getSeriesValue(a, activeSeries);
      const valB = getSeriesValue(b, activeSeries);
      return valB - valA;
    })[0];
  }, [displayData, activeSeries]);

  const averagePerHour = useMemo(() => {
    if (displayData.length === 0) return 0;
    return Math.round(totalCount / displayData.length);
  }, [totalCount, displayData.length]);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || displayData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 300;
    const margin = { top: 25, right: 30, bottom: 45, left: 45 };
    const innerWidth = Math.max(200, containerWidth - margin.left - margin.right);
    const innerHeight = Math.max(100, height - margin.top - margin.bottom);

    svg
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'neon-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create linear gradients for area fills
    SERIES_CONFIGS.forEach((cfg) => {
      const grad = defs
        .append('linearGradient')
        .attr('id', cfg.gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad.append('stop').attr('offset', '0%').attr('stop-color', cfg.color).attr('stop-opacity', 0.45);
      grad.append('stop').attr('offset', '65%').attr('stop-color', cfg.color).attr('stop-opacity', 0.12);
      grad.append('stop').attr('offset', '100%').attr('stop-color', cfg.color).attr('stop-opacity', 0.0);
    });

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale
    const xScale = d3
      .scalePoint<string>()
      .domain(displayData.map((d) => d.timeLabel))
      .range([0, innerWidth])
      .padding(0.1);

    // Max value for Y scale
    const maxY = d3.max(displayData, (d) => getSeriesValue(d, activeSeries)) || 10;

    const yScale = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxY * 1.25)])
      .nice()
      .range([innerHeight, 0]);

    // Gridlines
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-dasharray', '2,4');
    g.selectAll('.grid .domain').remove();

    // Active series config
    const currentCfg = SERIES_CONFIGS.find((c) => c.key === activeSeries) || SERIES_CONFIGS[0];

    // Area Generator
    const areaGenerator = d3
      .area<RealtimeTrendPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(getSeriesValue(d, activeSeries)))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const lineGenerator = d3
      .line<RealtimeTrendPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y((d) => yScale(getSeriesValue(d, activeSeries)))
      .curve(d3.curveMonotoneX);

    // Render Area Fill
    g.append('path')
      .datum(displayData)
      .attr('fill', `url(#${currentCfg.gradientId})`)
      .attr('d', areaGenerator);

    // Render Line Path
    const path = g
      .append('path')
      .datum(displayData)
      .attr('fill', 'none')
      .attr('stroke', currentCfg.color)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#neon-glow)')
      .attr('d', lineGenerator);

    // Path stroke-dash transition animation
    const pathLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Multi-series subtle background lines if "all" is active
    if (activeSeries === 'all') {
      const subKeys: ActiveVectorSeries[] = ['phishing', 'xss', 'malware', 'tracker'];
      subKeys.forEach((subKey) => {
        const subCfg = SERIES_CONFIGS.find((c) => c.key === subKey);
        if (!subCfg) return;

        const subLine = d3
          .line<RealtimeTrendPoint>()
          .x((d) => xScale(d.timeLabel) || 0)
          .y((d) => yScale(getSeriesValue(d, subKey)))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(displayData)
          .attr('fill', 'none')
          .attr('stroke', subCfg.color)
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-dasharray', '3,3')
          .attr('d', subLine);
      });
    }

    // Axes
    const xAxis = d3.axisBottom(xScale).tickValues(
      xScale.domain().filter((_, i) => {
        if (displayData.length <= 8) return true;
        if (displayData.length <= 16) return i % 2 === 0;
        return i % 3 === 0;
      })
    );

    const yAxis = d3.axisLeft(yScale).ticks(5);

    const gx = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b');

    gx.selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('dy', '1em');

    gx.select('.domain').attr('stroke', '#334155');

    const gy = g.append('g').call(yAxis).attr('color', '#64748b');
    gy.selectAll('text').attr('font-size', '10px').attr('font-family', 'ui-monospace, monospace');
    gy.select('.domain').attr('stroke', '#334155');

    // Interactive Hover Tracking Group
    const hoverGroup = g.append('g').style('display', 'none');

    // Guide crosshair line
    const guideLine = hoverGroup
      .append('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight);

    // Glowing dot on active curve
    const hoverDot = hoverGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', currentCfg.color)
      .attr('stroke', '#020617')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#neon-glow)');

    // Overlay rect for mouse interception
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event);

        // Find nearest data point
        const domain = xScale.domain();
        let closestPoint = displayData[0];
        let minDiff = Infinity;

        displayData.forEach((d) => {
          const x = xScale(d.timeLabel) || 0;
          const diff = Math.abs(x - mouseX);
          if (diff < minDiff) {
            minDiff = diff;
            closestPoint = d;
          }
        });

        if (closestPoint) {
          const cx = xScale(closestPoint.timeLabel) || 0;
          const val = getSeriesValue(closestPoint, activeSeries);
          const cy = yScale(val);

          hoverGroup.style('display', null);
          guideLine.attr('x1', cx).attr('x2', cx);
          hoverDot.attr('cx', cx).attr('cy', cy);

          setHoveredPoint(closestPoint);
          setTooltipPos({ x: event.clientX, y: event.clientY });
        }
      })
      .on('mouseleave', () => {
        hoverGroup.style('display', 'none');
        setHoveredPoint(null);
        setTooltipPos(null);
      })
      .on('click', () => {
        if (hoveredPoint && onSelectPoint) {
          onSelectPoint(hoveredPoint);
        }
      });
  }, [displayData, activeSeries]);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Real-Time Threat Detection Trends</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  D3.js Monotone Curve
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Continuous telemetry generated by the Aegis Zero-Trust Threat Sandbox engine
              </p>
            </div>
          </div>
        </div>

        {/* Time Window Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {(['6h', '12h', '24h'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Window Blocked
          </span>
          <span className="text-lg font-mono font-bold text-cyan-300">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">Threat vectors intercepted</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Hourly Velocity
          </span>
          <span className="text-lg font-mono font-bold text-teal-300">
            ~{averagePerHour} / hr
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">Avg neutralizations</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Peak Attack Surge
          </span>
          <span className="text-lg font-mono font-bold text-rose-400">
            {peakPoint ? (activeSeries === 'all' ? peakPoint.total : peakPoint[activeSeries] || 0) : 0}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">
            {peakPoint ? peakPoint.timeLabel : 'N/A'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Mitigation Ratio
          </span>
          <span className="text-lg font-mono font-bold text-emerald-400">
            100%
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">Zero-trust quarantine</span>
        </div>
      </div>

      {/* Series Filter Selector Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-cyan-400" />
          Filter Vector:
        </span>
        {SERIES_CONFIGS.map((cfg) => {
          const isActive = activeSeries === cfg.key;
          return (
            <button
              key={cfg.key}
              type="button"
              onClick={() => setActiveSeries(cfg.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
              }`}
              style={{
                borderColor: isActive ? cfg.color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main D3 Chart Canvas */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950/60 rounded-xl border border-slate-900 pt-2">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Live Tracking Crosshair Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 pointer-events-none p-3 rounded-xl bg-slate-900/95 border border-cyan-500/40 backdrop-blur-md shadow-2xl text-xs space-y-2 min-w-[210px] z-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono">
              <span className="text-slate-300 font-bold">{hoveredPoint.timeLabel}</span>
              <span className="text-cyan-400 font-semibold">{hoveredPoint.total} total</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-rose-400">
                <span>Phishing Harvesters:</span>
                <span className="font-bold">{hoveredPoint.phishing}</span>
              </div>
              <div className="flex items-center justify-between text-amber-400">
                <span>DOM/URL XSS:</span>
                <span className="font-bold">{hoveredPoint.xss}</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Cryptominers:</span>
                <span className="font-bold">{hoveredPoint.malware}</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400">
                <span>Canvas Trackers:</span>
                <span className="font-bold">{hoveredPoint.tracker}</span>
              </div>
              <div className="flex items-center justify-between text-red-400">
                <span>Insecure HTTP:</span>
                <span className="font-bold">{hoveredPoint.insecureHttp}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>DNS Spoof / Typos:</span>
                <span className="font-bold">{hoveredPoint.dnsSpoof}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
