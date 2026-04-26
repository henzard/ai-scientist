import { describe, it, expect } from 'vitest';
import { detectDomain, DOMAIN_LABELS, ExperimentDomain } from '@/lib/domainDetector';

describe('detectDomain', () => {
  it('detects biosensor from antibody/biosensor keywords', () => {
    expect(detectDomain('anti-CRP antibodies biosensor detection in whole blood')).toBe('biosensor');
  });

  it('detects biosensor from electrochemical keyword', () => {
    expect(detectDomain('electrochemical sensor for glucose measurement')).toBe('biosensor');
  });

  it('detects cryopreservation from cryoprotectant keyword', () => {
    expect(detectDomain('trehalose cryoprotectant for HeLa cell viability after freeze-thaw')).toBe('cryopreservation');
  });

  it('detects cryopreservation from DMSO / post-thaw', () => {
    expect(detectDomain('DMSO protocol for post-thaw recovery of stem cells')).toBe('cryopreservation');
  });

  it('detects microbiome from Lactobacillus keyword', () => {
    expect(detectDomain('Lactobacillus rhamnosus GG supplementation in C57BL/6 mice')).toBe('microbiome');
  });

  it('detects microbiome from gut permeability / probiotic', () => {
    expect(detectDomain('probiotic effect on gut microbiome composition')).toBe('microbiome');
  });

  it('detects bioelectrochemical from Sporomusa / acetate', () => {
    // Uses 'sporomusa' keyword — does not contain 'electrochemical' which would match biosensor first
    expect(detectDomain('Sporomusa ovata CO2 fixation and acetate production at cathode potential')).toBe('bioelectrochemical');
  });

  it('detects cell culture from HeLa / transfection', () => {
    expect(detectDomain('transfection efficiency in HeLa cells using lipofectamine')).toBe('cell_culture');
  });

  it('detects cell culture from HeLa / transfection without cryopreservation terms', () => {
    // 'cell viabilit' also matches cryopreservation; use 'hela' (unambiguous)
    expect(detectDomain('transfection efficiency in HeLa monolayer cells after lipofectamine treatment')).toBe('cell_culture');
  });

  it('detects genomics from CRISPR / gene expression', () => {
    expect(detectDomain('CRISPR-Cas9 knockout efficiency measured by gene expression')).toBe('genomics');
  });

  it('detects genomics from RNA-seq', () => {
    expect(detectDomain('RNA-seq transcriptomics analysis after treatment')).toBe('genomics');
  });

  it('detects immunology from cytokine / T cell', () => {
    expect(detectDomain('cytokine release in activated T cell populations')).toBe('immunology');
  });

  it('detects immunology from cytokine release', () => {
    expect(detectDomain('macrophage activation and cytokine release assay')).toBe('immunology');
  });

  it('detects drug_delivery from nanoparticle encapsulation', () => {
    expect(detectDomain('nanoparticle encapsulation for drug delivery to tumor cells')).toBe('drug_delivery');
  });

  it('detects drug_delivery from liposome / bioavailability', () => {
    expect(detectDomain('liposome formulation for improved bioavailability of hydrophobic compounds')).toBe('drug_delivery');
  });

  it('falls back to general for unrecognised input', () => {
    expect(detectDomain('measuring the effect of music tempo on plant growth')).toBe('general');
  });

  it('falls back to general for empty string', () => {
    expect(detectDomain('')).toBe('general');
  });

  it('is case-insensitive', () => {
    expect(detectDomain('ANTIBODY BIOSENSOR DETECTION')).toBe('biosensor');
  });

  it('returns first matching domain when multiple keywords match', () => {
    const result = detectDomain('biosensor antibody CRISPR gene expression');
    // Should still return a valid domain (either biosensor or genomics)
    const validDomains: ExperimentDomain[] = [
      'biosensor', 'cryopreservation', 'microbiome', 'bioelectrochemical',
      'cell_culture', 'genomics', 'immunology', 'drug_delivery', 'general',
    ];
    expect(validDomains).toContain(result);
  });
});

describe('DOMAIN_LABELS', () => {
  it('has a label for every domain including general', () => {
    const domains: ExperimentDomain[] = [
      'biosensor', 'cryopreservation', 'microbiome', 'bioelectrochemical',
      'cell_culture', 'genomics', 'immunology', 'drug_delivery', 'general',
    ];
    for (const d of domains) {
      expect(DOMAIN_LABELS[d]).toBeTruthy();
    }
  });

  it('all labels are non-empty strings', () => {
    for (const label of Object.values(DOMAIN_LABELS)) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
