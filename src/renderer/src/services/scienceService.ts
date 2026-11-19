import { SciencePaper } from '../types';
import { apiUrl } from './apiConfig';

// Inverted index abstract reconstructor per Science Skill guidelines
export function reconstructOpenAlexAbstract(
  abstractInvertedIndex: Record<string, number[]> | undefined
): string {
  if (!abstractInvertedIndex) return '';
  const entries = Object.entries(abstractInvertedIndex);
  const wordsWithPos: Array<{ pos: number; word: string }> = [];
  for (const [word, positions] of entries) {
    for (const pos of positions) {
      wordsWithPos.push({ pos, word });
    }
  }
  wordsWithPos.sort((a, b) => a.pos - b.pos);
  return wordsWithPos.map((item) => item.word).join(' ');
}

// 1. Search PubMed via NCBI E-utilities
export async function searchPubMed(query: string, maxResults = 6): Promise<SciencePaper[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      query
    )}&sort=pub_date&retmode=json&retmax=${maxResults}&tool=AegisSafeBrowser&email=narendra.via.mail@gmail.com`;

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error('PubMed search request failed');
    const data = await res.json();
    const idList = data.esearchresult?.idlist || [];

    if (idList.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(
      ','
    )}&retmode=json&tool=AegisSafeBrowser&email=narendra.via.mail@gmail.com`;

    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) throw new Error('PubMed summary request failed');
    const summaryData = await summaryRes.json();
    const resultObj = summaryData.result || {};

    const papers: SciencePaper[] = [];
    for (const id of idList) {
      const item = resultObj[id];
      if (!item) continue;
      const authors = (item.authors || []).map((a: any) => a.name);
      const doi = (item.articleids || []).find((aid: any) => aid.idtype === 'doi')?.value;

      papers.push({
        id: `pmid-${id}`,
        title: item.title || 'Untitled scientific work',
        authors: authors.slice(0, 4),
        source: item.source || 'PubMed Index',
        pubDate: item.pubdate || 'Recent',
        pmid: id,
        doi,
        abstract: item.title ? `Peer-reviewed biomedical literature indexed in MEDLINE/PubMed under accession PMID:${id}.` : '',
        database: 'PubMed',
        link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        openAccess: true,
      });
    }
    return papers;
  } catch (err) {
    console.warn('PubMed error:', err);
    return [];
  }
}

// 2. Search Europe PMC (Preprints + Open Access)
export async function searchEuropePmc(query: string, maxResults = 6): Promise<SciencePaper[]> {
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      query
    )}&format=json&pageSize=${maxResults}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Europe PMC search failed');
    const data = await res.json();
    const results = data.resultList?.result || [];

    return results.map((item: any) => ({
      id: `epmc-${item.id}`,
      title: item.title || 'Scientific Publication',
      authors: (item.authorString || '').split(',').map((s: string) => s.trim()).slice(0, 4),
      source: item.journalTitle || item.bookOrReportDetails?.publisher || 'Europe PMC',
      pubDate: item.pubYear ? String(item.pubYear) : 'Recent',
      doi: item.doi,
      pmid: item.pmid,
      abstract: item.abstractText ? item.abstractText.replace(/<[^>]+>/g, '').slice(0, 320) + '...' : 'Open access scientific article available via Europe PMC archive.',
      database: 'Europe PMC',
      link: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/${item.source}/${item.id}`,
      openAccess: item.isOpenAccess === 'Y',
    }));
  } catch (err) {
    console.warn('Europe PMC error:', err);
    return [];
  }
}

// 3. Search OpenAlex Scholarly Graph
export async function searchOpenAlex(query: string, maxResults = 6): Promise<SciencePaper[]> {
  try {
    const url = `https://api.openalex.org/works?filter=default.search:${encodeURIComponent(
      query
    )}&sort=cited_by_count:desc&per-page=${maxResults}&mailto=narendra.via.mail@gmail.com`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('OpenAlex search failed');
    const data = await res.json();
    const works = data.results || [];

    return works.map((w: any) => {
      const reconstructedAbstract = reconstructOpenAlexAbstract(w.abstract_inverted_index);
      return {
        id: w.id,
        title: w.title || 'Scholarly Work',
        authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean).slice(0, 4),
        source: w.primary_location?.source?.display_name || 'OpenAlex Graph',
        pubDate: w.publication_year ? String(w.publication_year) : 'Recent',
        doi: w.doi ? w.doi.replace('https://doi.org/', '') : undefined,
        abstract: reconstructedAbstract ? reconstructedAbstract.slice(0, 320) + '...' : `Scholarly work with ${w.cited_by_count || 0} citations across global research indexes.`,
        database: 'OpenAlex',
        link: w.doi || w.id,
        openAccess: w.open_access?.is_oa,
      };
    });
  } catch (err) {
    console.warn('OpenAlex error:', err);
    return [];
  }
}

// 4. Search arXiv (Via Express backend proxy to avoid CORS)
export async function searchArxiv(query: string, maxResults = 5): Promise<SciencePaper[]> {
  try {
    const res = await fetch(apiUrl(`/api/arxiv?query=${encodeURIComponent(query)}&max_results=${maxResults}`));
    if (!res.ok) throw new Error('arXiv proxy failed');
    const xmlText = await res.text();
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const entries = Array.from(doc.getElementsByTagName('entry'));

    return entries.map((entry, idx) => {
      const id = entry.getElementsByTagName('id')[0]?.textContent ?? `arxiv-${idx}`;
      const title = entry.getElementsByTagName('title')[0]?.textContent?.trim() ?? 'arXiv Preprint';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim() ?? '';
      const published = entry.getElementsByTagName('published')[0]?.textContent ?? '';
      const authors = Array.from(entry.getElementsByTagName('author')).map(
        (a) => a.getElementsByTagName('name')[0]?.textContent ?? ''
      ).filter(Boolean).slice(0, 4);

      return {
        id,
        title,
        authors,
        source: 'arXiv.org (q-bio / cs / physics)',
        pubDate: published.split('T')[0] || 'Recent',
        abstract: summary.slice(0, 320) + '...',
        database: 'arXiv',
        link: id,
        openAccess: true,
      };
    });
  } catch (err) {
    console.warn('arXiv error:', err);
    return [];
  }
}

// 5. Unified Multi-Source Science Search
export async function searchAllScientificDatabases(query: string): Promise<SciencePaper[]> {
  const [pubmed, epmc, openAlex, arxiv] = await Promise.all([
    searchPubMed(query, 4),
    searchEuropePmc(query, 4),
    searchOpenAlex(query, 4),
    searchArxiv(query, 3),
  ]);

  const combined = [...pubmed, ...epmc, ...openAlex, ...arxiv];
  return combined;
}
