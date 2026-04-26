import { AgentDefinition } from './types';

export const PLAN_AGENTS: AgentDefinition[] = [
  {
    id: 'protocol',
    label: 'Protocol Architect',
    icon: '🧬',
    system: 'You are a senior research scientist with 20 years of laboratory experience. Write precise, operationally realistic experiment protocols grounded in established scientific methods. Be specific about temperatures, concentrations, and timings.',
    getPrompt: (h) => `Design a complete step-by-step laboratory protocol for this hypothesis:\n\n"${h}"\n\nStart your response with ## Protocol\n\nWrite 5–8 numbered steps. Each step must include:\n- Exact procedure with conditions (temperature, time, concentrations in specific units)\n- Equipment and reagents required for that step\n- Critical notes or safety considerations\n\nBe scientifically accurate and operationally specific. A lab should be able to start Friday.`
  },
  {
    id: 'materials',
    label: 'Materials Curator',
    icon: '⚗️',
    system: 'You are a lab procurement specialist with deep knowledge of Sigma-Aldrich, Thermo Fisher Scientific, Abcam, VWR, and other major life science suppliers. You know real catalog numbers and current pricing.',
    getPrompt: (h) => `Generate a complete materials and reagents list for this experiment:\n\n"${h}"\n\nStart with ## Materials & Reagents\n\nCreate a markdown table with EXACTLY these columns:\n| Item | Specification | Supplier | Cat. Number | Unit Price (USD) | Qty Needed |\n|------|--------------|---------|------------|-----------------|------------|\n\nUse real supplier names and realistic catalog numbers and prices. Include all reagents, key consumables, and any specialized equipment.`
  },
  {
    id: 'budget',
    label: 'Budget Analyst',
    icon: '📊',
    system: 'You are a research budget analyst who helps PIs plan realistic experiment budgets. You know typical reagent prices, equipment rental costs, and personnel time for academic and industry labs.',
    getPrompt: (h) => `Create a detailed budget estimate for this experiment:\n\n"${h}"\n\nStart with ## Budget Estimate\n\nInclude:\n1. A line-item cost table covering reagents/consumables, equipment (rental or amortised), and personnel time (technician + PI hours)\n2. Total estimated cost range (optimistic and realistic)\n3. Notes on cost-saving alternatives\n4. Key assumptions\n\nUse realistic USD amounts based on current market rates.`
  },
  {
    id: 'timeline',
    label: 'Timeline Planner',
    icon: '📅',
    system: 'You are a research project manager. You design realistic timelines that account for reagent procurement lead times, incubation periods, and the sequential vs. parallel structure of biological experiments.',
    getPrompt: (h) => `Create a realistic project timeline for this experiment:\n\n"${h}"\n\nStart with ## Timeline\n\nShow a phased breakdown by week. Include:\n- Procurement and setup phase (account for lead times)\n- Experimental execution phases\n- Analysis and data processing\n- Key milestones and go/no-go decision points\n- Dependencies between phases\n- A realistic total duration with a brief justification`
  },
  {
    id: 'validation',
    label: 'Validation Designer',
    icon: '✓',
    system: 'You are a research quality and biostatistics expert. You design rigorous validation frameworks that make experimental results interpretable and statistically defensible.',
    getPrompt: (h) => `Design the validation and success criteria framework for this experiment:\n\n"${h}"\n\nStart with ## Validation & Success Criteria\n\nCover:\n1. **Primary Endpoint** — exact measurable outcome with threshold value\n2. **Statistical Analysis** — test to use, required sample size, power calculation\n3. **Controls** — positive and negative controls required\n4. **Success Criteria** — specific numerical thresholds that confirm the hypothesis\n5. **Failure Indicators** — what would falsify the hypothesis\n6. **Troubleshooting** — a short decision tree for the 2–3 most likely failure modes`
  }
];

export const SAMPLE_HYPOTHESES = [
  "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  "Replacing sucrose with trehalose as a cryoprotectant will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilisation at low temperatures.",
  "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400 mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%."
];
