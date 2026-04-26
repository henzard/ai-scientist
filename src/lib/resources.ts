import { ExperimentDomain } from './domainDetector';

export interface Resource {
  name: string;
  url: string;
  description: string;
}

export interface ResourceSection {
  category: string;
  resources: Resource[];
}

// ─── Resource catalogues ──────────────────────────────────────────────────────

const PROTOCOL_REPOSITORIES: Resource[] = [
  { name: 'protocols.io',     url: 'https://www.protocols.io',              description: 'Largest active repository — structured, citable format' },
  { name: 'Bio-protocol',     url: 'https://bio-protocol.org',              description: 'Peer-reviewed, paper-linked methods' },
  { name: 'Nature Protocols', url: 'https://www.nature.com/nprot',          description: 'Premium-detail, high-impact methods' },
  { name: 'JoVE',             url: 'https://www.jove.com',                  description: 'Video protocols with written transcripts' },
  { name: 'OpenWetWare',      url: 'https://openwetware.org',               description: 'Community-validated open-access procedures' },
];

const SUPPLIER_REFERENCES: Resource[] = [
  { name: 'Thermo Fisher App Notes', url: 'https://www.thermofisher.com/us/en/home/technical-resources/application-notes.html', description: 'Application notes for instruments & assays' },
  { name: 'Sigma-Aldrich Bulletins', url: 'https://www.sigmaaldrich.com/US/en/technical-documents',                            description: 'Technical bulletins, reagent grades, SDS' },
  { name: 'Promega Protocols',       url: 'https://www.promega.com/resources/protocols',                                        description: 'Molecular biology & bioluminescence protocols' },
  { name: 'Qiagen Protocols',        url: 'https://www.qiagen.com/us/resources/resourcedetail?id=protocols',                    description: 'Extraction, PCR, and NGS protocols' },
  { name: 'IDT Design Tools',        url: 'https://www.idtdna.com/pages/tools',                                                 description: 'Primer design, qPCR efficiency, oligo calculator' },
];

const REAGENT_REFERENCES: Resource[] = [
  { name: 'ATCC',    url: 'https://www.atcc.org',              description: 'Authenticated cell lines and microbial strains' },
  { name: 'Addgene', url: 'https://www.addgene.org/protocols', description: 'Plasmids, CRISPR tools, cloning protocols' },
];

const SCIENTIFIC_STANDARDS: Resource[] = [
  { name: 'MIQE Guidelines (qPCR)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2737408', description: 'Minimum information for publication of qPCR experiments' },
];

// ─── Domain highlights ────────────────────────────────────────────────────────
// Resource names that should be visually emphasised for each domain.

const DOMAIN_HIGHLIGHTS: Partial<Record<ExperimentDomain, string[]>> = {
  biosensor:          ['protocols.io', 'Sigma-Aldrich Bulletins', 'Thermo Fisher App Notes', 'ATCC'],
  cryopreservation:   ['protocols.io', 'Sigma-Aldrich Bulletins', 'ATCC', 'Thermo Fisher App Notes'],
  microbiome:         ['ATCC', 'protocols.io', 'Bio-protocol', 'Promega Protocols'],
  bioelectrochemical: ['protocols.io', 'Sigma-Aldrich Bulletins', 'Bio-protocol'],
  cell_culture:       ['ATCC', 'Thermo Fisher App Notes', 'Addgene', 'protocols.io'],
  genomics:           ['Addgene', 'IDT Design Tools', 'MIQE Guidelines (qPCR)', 'Qiagen Protocols'],
  immunology:         ['Thermo Fisher App Notes', 'Bio-protocol', 'Promega Protocols', 'ATCC'],
  drug_delivery:      ['Sigma-Aldrich Bulletins', 'protocols.io', 'Thermo Fisher App Notes'],
  general:            ['protocols.io', 'Bio-protocol', 'Sigma-Aldrich Bulletins'],
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getResourceSections(): ResourceSection[] {
  return [
    { category: 'Protocol Repositories', resources: PROTOCOL_REPOSITORIES },
    { category: 'Supplier References',   resources: SUPPLIER_REFERENCES },
    { category: 'Reagents & Cell Lines', resources: REAGENT_REFERENCES },
    { category: 'Scientific Standards',  resources: SCIENTIFIC_STANDARDS },
  ];
}

export function getDomainHighlights(domain: ExperimentDomain): Set<string> {
  return new Set(DOMAIN_HIGHLIGHTS[domain] ?? DOMAIN_HIGHLIGHTS.general ?? []);
}

/** Returns a flat list of all resource URLs with labels — for injecting into LLM prompts. */
export function getResourceLinksForPrompt(): string {
  const all = [
    ...PROTOCOL_REPOSITORIES,
    ...SUPPLIER_REFERENCES,
    ...REAGENT_REFERENCES,
    ...SCIENTIFIC_STANDARDS,
  ];
  return all.map(r => `- ${r.name}: ${r.url} — ${r.description}`).join('\n');
}
