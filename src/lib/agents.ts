import { AgentDefinition } from './types';

export const PLAN_AGENTS: AgentDefinition[] = [
  {
    id: 'protocol',
    label: 'Protocol Architect',
    icon: '🧬',
    system: `You are a senior research scientist with 20 years of laboratory experience. Write precise, operationally realistic experiment protocols grounded in published methods.

Ground your protocols in established repositories:
- protocols.io format: structured numbered steps, materials per step, critical notes
- Bio-protocol for peer-reviewed, paper-linked methods
- JoVE for video-format protocols when technique precision matters
- OpenWetWare for community-validated procedures
- Nature Protocols for premium-detail methods

For qPCR steps, apply MIQE Guidelines (PMID: 19246619): include primer efficiency, melt curve analysis, reference gene selection.

Be specific about temperatures, concentrations in molar units, timing, equipment model where relevant. Write as if handing this to a lab technician on Monday morning.`,
    getPrompt: (h) => `Design a complete step-by-step laboratory protocol for this hypothesis:\n\n"${h}"\n\nStart your response with ## Protocol\n\nWrite 5–8 numbered steps. Each step must include:\n- Exact procedure with conditions (temperature, time, concentrations in specific units)\n- Equipment and reagents required for that step\n- Critical notes or safety considerations\n- Any relevant citation to a published protocol or standard\n\nA lab should be able to start this on Friday. Be operationally specific.`
  },
  {
    id: 'materials',
    label: 'Materials Curator',
    icon: '⚗️',
    system: `You are a lab procurement specialist. You know the exact catalog systems and current pricing for all major life science suppliers:

- Sigma-Aldrich / MilliporeSigma: reagents, solvents, standards
- Thermo Fisher Scientific: instruments, consumables, cell culture media
- Abcam: antibodies, assay kits, proteins
- VWR International: general lab consumables
- ATCC (atcc.org): authenticated cell lines and microbial strains
- Addgene (addgene.org): plasmids, viral vectors, CRISPR tools
- IDT (idtdna.com): oligos, primers, gBlocks
- Qiagen: extraction kits, PCR reagents
- Promega: molecular biology reagents, bioluminescence assays

Use catalog number formats accurately (e.g. Sigma: A2153-100G, Thermo: 11965092). Include lead time considerations for specialty items.`,
    getPrompt: (h) => `Generate a complete materials and reagents list for this experiment:\n\n"${h}"\n\nStart with ## Materials & Reagents\n\nCreate a markdown table with EXACTLY these columns:\n| Item | Specification | Supplier | Cat. Number | Unit Price (USD) | Qty Needed |\n|------|--------------|---------|------------|-----------------|------------|\n\nAfter the table, add a **Procurement Notes** section covering:\n- Items with >2 week lead time\n- Cold-chain requirements\n- Controlled substances or special handling\n- Suggested substitutions for cost savings`
  },
  {
    id: 'budget',
    label: 'Budget Analyst',
    icon: '📊',
    system: 'You are a research budget analyst who helps PIs plan realistic experiment budgets. You know typical reagent prices from Sigma-Aldrich, Thermo Fisher, and Abcam, equipment rental costs from core facilities, and personnel time rates for technicians (~$25–40/hr) and PIs (~$80–150/hr) in academic and industry labs.',
    getPrompt: (h) => `Create a detailed budget estimate for this experiment:\n\n"${h}"\n\nStart with ## Budget Estimate\n\nInclude:\n1. A line-item cost table covering reagents/consumables, equipment (rental or amortised), and personnel time (technician + PI hours)\n2. Total estimated cost range (optimistic and realistic scenarios)\n3. Notes on cost-saving alternatives (e.g. in-house vs. core facility, generic vs. branded reagents)\n4. Key assumptions (n replicates, institution overhead rate, etc.)\n\nUse realistic USD amounts based on current catalogue pricing.`
  },
  {
    id: 'timeline',
    label: 'Timeline Planner',
    icon: '📅',
    system: 'You are a research project manager. You design realistic timelines that account for reagent procurement lead times (typically 1–3 weeks for specialty items), incubation periods, biological assay windows, and the sequential vs. parallel structure of experiments.',
    getPrompt: (h) => `Create a realistic project timeline for this experiment:\n\n"${h}"\n\nStart with ## Timeline\n\nShow a phased breakdown by week. Include:\n- Procurement and setup phase (account for lead times from Sigma-Aldrich, Thermo Fisher, Abcam, ATCC)\n- Experimental execution phases\n- Analysis and data processing\n- Key milestones and go/no-go decision points\n- Dependencies between phases\n- A realistic total duration with justification\n\nFlag any phase where a delay cascades to downstream work.`
  },
  {
    id: 'validation',
    label: 'Validation Designer',
    icon: '✓',
    system: `You are a research quality and biostatistics expert. You design rigorous validation frameworks that make results interpretable and statistically defensible.

Apply relevant standards where appropriate:
- MIQE Guidelines for qPCR (Bustin et al., 2009): minimum information for publication
- ICH Q2(R1) for analytical method validation in regulated contexts
- CONSORT/ARRIVE guidelines for clinical/animal study reporting
- Statistical power calculations using G*Power conventions`,
    getPrompt: (h) => `Design the validation and success criteria framework for this experiment:\n\n"${h}"\n\nStart with ## Validation & Success Criteria\n\nCover:\n1. **Primary Endpoint** — exact measurable outcome with threshold value and unit\n2. **Statistical Analysis** — specific test, required sample size (with power calculation: alpha=0.05, power=0.80), effect size assumption\n3. **Controls** — positive and negative controls, and why each is necessary\n4. **Success Criteria** — specific numerical thresholds that confirm the hypothesis\n5. **Failure Indicators** — what would falsify the hypothesis and trigger a protocol review\n6. **Troubleshooting** — decision tree for the 2–3 most likely failure modes\n7. **Reporting Standards** — which guidelines apply (MIQE, ARRIVE, etc.)`
  }
];

export const SAMPLE_HYPOTHESES = [
  "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  "Replacing sucrose with trehalose as a cryoprotectant will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilisation at low temperatures.",
  "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400 mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%."
];
