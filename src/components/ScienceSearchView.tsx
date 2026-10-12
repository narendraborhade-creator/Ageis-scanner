import React, { useState, useEffect } from 'react';
import { searchAllScientificDatabases, searchPubMed, searchEuropePmc, searchOpenAlex, searchArxiv } from '../services/scienceService';
import { SciencePaper } from '../types';
import { Atom, ExternalLink, RefreshCw, BookOpen, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ScienceSearchViewProps {
  initialQuery?: string;
}

export const ScienceSearchView: React.FC<ScienceSearchViewProps> = ({
  initialQuery = 'AlphaFold structural biology',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedDb, setSelectedDb] = useState<'all' | 'PubMed' | 'Europe PMC' | 'OpenAlex' | 'arXiv'>('all');
  const [papers, setPapers] = useState<SciencePaper[]>([]);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (term: string, db: string) => {
    setLoading(true);
    try {
      let results: SciencePaper[] = [];
      if (db === 'PubMed') results = await searchPubMed(term);
      else if (db === 'Europe PMC') results = await searchEuropePmc(term);
      else if (db === 'OpenAlex') results = await searchOpenAlex(term);
      else if (db === 'arXiv') results = await searchArxiv(term);
      else results = await searchAllScientificDatabases(term);
      setPapers(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(query, selectedDb);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    executeSearch(query.trim(), selectedDb);
  };

  const handleDbChange = (db: 'all' | 'PubMed' | 'Europe PMC' | 'OpenAlex' | 'arXiv') => {
    setSelectedDb(db);
    executeSearch(query, db);
  };

  return (
    <div className="space-y-6">
      {/* Header and Science Search Box */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Science Skills Safe Literature & Research Portal
            </h2>
            <p className="text-xs text-slate-400">
              Zero-unverified web research: Search peer-reviewed PubMed (MEDLINE), Europe PMC preprints, OpenAlex scholarly graph, and arXiv preprints with verified scientific DOI citations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 mt-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scientific topics (e.g., AlphaFold 3, CRISPR Cas9, Quantum DNSSEC, mRNA delivery)..."
              className="w-full glass-input rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{loading ? 'Searching...' : 'Search Science'}</span>
          </button>
        </form>

        {/* Quick-Try Example Chips */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 whitespace-nowrap">Examples:</span>
          {[
            'AlphaFold structural biology',
            'CRISPR Cas9 safety',
            'Quantum cryptography DNSSEC',
            'Biosensor nanotechnology',
            'mRNA lipid nanoparticles',
          ].map((topic) => (
            <button
              key={topic}
              onClick={() => {
                setQuery(topic);
                executeSearch(topic, selectedDb);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 text-[11px] whitespace-nowrap transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Database Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto">
        {(['all', 'PubMed', 'Europe PMC', 'OpenAlex', 'arXiv'] as const).map((db) => (
          <button
            key={db}
            onClick={() => handleDbChange(db)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selectedDb === db
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {db === 'all' ? 'Unified Multi-DB Index' : db}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-mono">
              Querying peer-reviewed scientific repositories via Science Skill protocols...
            </p>
          </div>
        ) : papers.length > 0 ? (
          papers.map((paper) => (
            <div
              key={paper.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-teal-500/30 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono text-teal-400 font-bold uppercase">
                      [{paper.database}]
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">{paper.source}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500">{paper.pubDate}</span>
                    {paper.openAccess && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400 text-[10px] font-mono">Open Access</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 hover:text-teal-300 transition-colors">
                    <a href={paper.link} target="_blank" rel="noopener noreferrer">
                      {paper.title}
                    </a>
                  </h3>

                  {paper.authors.length > 0 && (
                    <div className="text-xs text-slate-400">
                      Authors: {paper.authors.join(', ')}
                    </div>
                  )}
                </div>

                <a
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-teal-300 shrink-0 transition-colors"
                  title="View Full Record"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {paper.abstract && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                  {paper.abstract}
                </p>
              )}

              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
                {paper.doi && <span>DOI: {paper.doi}</span>}
                {paper.pmid && <span>PMID: {paper.pmid}</span>}
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">No scientific papers found</h4>
            <p className="text-xs text-slate-500">
              Try adjusting your query or click one of the preset example topics above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
