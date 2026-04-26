export type ExperimentDomain =
  | 'biosensor'
  | 'cryopreservation'
  | 'microbiome'
  | 'bioelectrochemical'
  | 'cell_culture'
  | 'genomics'
  | 'immunology'
  | 'drug_delivery'
  | 'general';

// Substring keywords — order within each array and across entries is deliberate:
// earlier entries take priority when a hypothesis matches multiple domains.
const DOMAIN_KEYWORDS: Record<ExperimentDomain, string[]> = {
  biosensor:          ['biosensor', 'electrochemical', 'immunoassay', 'elisa', 'lateral flow', 'crp', 'antibod'],
  cryopreservation:   ['cryo', 'dmso', 'trehalose', 'post-thaw', 'viabilit', 'cryoprotect', 'freeze', 'thaw'],
  microbiome:         ['microbiome', 'lactobacillus', 'probiotic', 'intestin', 'tight junction', 'gut', 'permeabilit'],
  bioelectrochemical: ['bioelectrochemical', 'sporomusa', 'cathode', 'anode', 'co₂', 'co2', 'acetate', 'mev'],
  cell_culture:       ['hela', 'cell line', 'confluenc', 'transfect', 'mtt assay', 'cell viabil', 'passage'],
  genomics:           ['crispr', 'rna-seq', 'mrna', 'qpcr', 'sequencing', 'gene expression', 'genome'],
  immunology:         ['cytokine', 'macrophage', 't cell', 'b cell', 'nk cell', 'dendritic', 'ifn', 'il-'],
  drug_delivery:      ['nanoparticle', 'liposome', 'encapsulat', 'drug release', 'bioavailability', 'ic50'],
  general:            [],
};

export const DOMAIN_LABELS: Record<ExperimentDomain, string> = {
  biosensor:          'Diagnostics / Biosensors',
  cryopreservation:   'Cell Preservation',
  microbiome:         'Microbiome / Gut Health',
  bioelectrochemical: 'Bioelectrochemical Systems',
  cell_culture:       'Cell Biology',
  genomics:           'Genomics / Molecular Biology',
  immunology:         'Immunology',
  drug_delivery:      'Drug Delivery',
  general:            'Life Sciences',
};

/**
 * Returns the best-matching experiment domain for a hypothesis using keyword
 * substring matching. Returns 'general' if no domain matches. O(n) — suitable
 * for synchronous client-side use; no API call required.
 */
export function detectDomain(hypothesis: string): ExperimentDomain {
  const lower = hypothesis.toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [ExperimentDomain, string[]][]) {
    if (domain === 'general') continue;
    if (keywords.some(kw => lower.includes(kw))) return domain;
  }
  return 'general';
}
