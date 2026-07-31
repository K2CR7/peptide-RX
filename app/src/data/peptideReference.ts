// Ported from legacy/peptide_rx.jsx (PEPTIDE_DB + PEPTIDE_INFO + EVIDENCE_TIERS).
// All dosing-calculation fields (baseDose, multipliers, min/max dose, priority)
// were intentionally dropped: this app no longer calculates or recommends
// doses, only tracks what the user has already decided to take. Fields like
// typicalScheduleDays / typicalCycleOnDays are reference info to help a user
// fill in their own stack entry, not a generated protocol.

export interface PeptideInteraction {
  substance: string;
  note: string;
  severity: "avoid" | "caution" | "info";
}

export interface PeptideEvidenceTier {
  tier: string;
  label: string;
  fdaFlag: boolean;
  fdaNote: string;
}

export interface PeptideReference {
  name: string;
  aka: string;
  goals: string[];
  frequency: string;
  timing?: string;
  primaryRoute: string;
  typicalScheduleDays: number[];
  typicalCycleOnDays?: number;
  typicalCycleOffDays?: number;
  cycleNote?: string;
  contraindications: string[];
  interactions: PeptideInteraction[];
  synergies: string[];
  description: string | null;
  upsides: string[];
  risks: string[];
  evidenceTier: PeptideEvidenceTier | null;
}

export const PEPTIDE_REFERENCE: Record<string, PeptideReference> =
{
  "BPC-157": {
    "name": "BPC-157",
    "aka": "Body Protection Compound",
    "goals": [
      "Recovery & Healing",
      "Gut Health",
      "Skin & Anti-Aging",
      "Muscle / Bulk"
    ],
    "frequency": "Twice daily",
    "timing": "Morning fasted + 30 min before bed",
    "primaryRoute": "SubQ injection",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 6,
    "typicalCycleOffDays": 4,
    "contraindications": [
      "Cancer History"
    ],
    "interactions": [
      {
        "substance": "Blood thinners",
        "note": "May potentiate anticoagulant effect.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "TB-500",
      "GHK-Cu"
    ],
    "description": "Synthetic 15-amino-acid peptide (C62H98N16O22) derived from a gastric protective protein. Studied for angiogenesis, VEGFR2/Akt-eNOS signaling, tissue repair, and gut protection. A 2025 systematic review found 544 articles but only 36 met inclusion criteria — almost all preclinical. One weak retrospective human report exists (7/12 patients with knee pain).",
    "upsides": [
      "Strong preclinical data for tendon, ligament & muscle repair",
      "Improved vascularity and VEGF expression in animal models",
      "Reduced inflammation in arthritis and injury models",
      "Interesting gut-protective signaling through nitric oxide pathways"
    ],
    "risks": [
      "Almost entirely animal data — only one weak human report",
      "FDA flags as compounding safety-risk substance",
      "No validated clinical dosing regimen exists",
      "May theoretically promote tumor angiogenesis",
      "Phase I oral PK study listed but does not establish efficacy"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA flags as compounding safety-risk substance. Almost all evidence is from animal models; one weak retrospective human report exists."
    }
  },
  "TB-500": {
    "name": "TB-500",
    "aka": "Thymosin Beta-4 Fragment",
    "goals": [
      "Recovery & Healing",
      "Skin & Anti-Aging",
      "Muscle / Bulk"
    ],
    "frequency": "2×/week → 1×/week maintenance",
    "timing": "Anytime, consistent days",
    "primaryRoute": "SubQ or IM",
    "typicalScheduleDays": [
      1,
      4
    ],
    "typicalCycleOnDays": 6,
    "typicalCycleOffDays": 4,
    "contraindications": [
      "Cancer History",
      "Autoimmune Disease"
    ],
    "interactions": [
      {
        "substance": "Blood thinners",
        "note": "Increased bleeding risk.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "BPC-157",
      "GHK-Cu"
    ],
    "description": "Marketed as a thymosin beta-4 fragment, but TB-500 sold online is not standardized or equivalent to clinical-grade thymosin beta-4. The parent molecule (thymosin beta-4) is involved in actin regulation, cell migration, angiogenesis, and wound repair — acting as a repair-signaling peptide rather than a hormone.",
    "upsides": [
      "Parent molecule has real human studies in heart injury and eye disease",
      "Phase 1 safety study found thymosin beta-4 well tolerated IV",
      "Ophthalmic trials showed improvement in dry eye",
      "Biologically plausible mechanism for tissue repair"
    ],
    "risks": [
      "TB-500 online ≠ standardized thymosin beta-4",
      "FDA flags thymosin beta-4 fragment as compounding safety risk",
      "Limited direct evidence for bodybuilder-style recovery uses",
      "Quality and purity vary wildly between suppliers",
      "Contraindicated with cancer history and autoimmune disease"
    ],
    "evidenceTier": {
      "tier": "Limited Human",
      "label": "Limited Human Data",
      "fdaFlag": true,
      "fdaNote": "FDA flags thymosin beta-4 fragment (LKKTETQ) as compounding safety-risk substance. TB-500 sold online is not standardized or equivalent to clinical-grade thymosin beta-4."
    }
  },
  "CJC-1295": {
    "name": "CJC-1295",
    "aka": "GHRH Analog (DAC)",
    "goals": [
      "Muscle / Bulk",
      "Sleep & GH Optimization",
      "Recovery & Healing",
      "Skin & Anti-Aging",
      "Longevity"
    ],
    "frequency": "2×/week (DAC)",
    "timing": "Pre-sleep or fasted AM",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      4
    ],
    "typicalCycleOnDays": 12,
    "typicalCycleOffDays": 6,
    "contraindications": [
      "Cancer History",
      "Diabetes / Insulin Resistance",
      "Thyroid Disorder"
    ],
    "interactions": [
      {
        "substance": "HGH (exogenous)",
        "note": "Additive GH — reduce CJC 50%.",
        "severity": "caution"
      },
      {
        "substance": "Insulin",
        "note": "GH reduces insulin sensitivity.",
        "severity": "caution"
      },
      {
        "substance": "TRT / Testosterone",
        "note": "Synergistic for body composition.",
        "severity": "info"
      },
      {
        "substance": "SARMs",
        "note": "Compatible — monitor water retention.",
        "severity": "info"
      }
    ],
    "synergies": [
      "Ipamorelin",
      "MK-677"
    ],
    "description": "Growth hormone–releasing hormone (GHRH) analog that activates pituitary somatotroph GHRH receptors, increasing cAMP/PKA signaling, GH release, and downstream IGF-1. The DAC version binds albumin for a half-life of 6–8 days, enabling 1–2× weekly dosing in research contexts.",
    "upsides": [
      "Long-acting — only 1–2 injections per week needed",
      "Designed to elevate baseline GH and IGF-1",
      "Potential benefits for recovery, sleep, and body composition",
      "Established mechanism via GHRH receptor pathway"
    ],
    "risks": [
      "FDA lists as compounding safety-risk substance",
      "Concerns about immunogenicity and impurities",
      "No mainstream endocrinology guideline recommends it",
      "Water retention, joint stiffness, carpal tunnel at higher doses",
      "Contraindicated with cancer, diabetes, thyroid disorders"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA lists as compounding safety-risk substance citing immunogenicity, impurity concerns, and adverse reactions. No mainstream endocrinology guideline recommends it."
    }
  },
  "Ipamorelin": {
    "name": "Ipamorelin",
    "aka": "Selective GH Secretagogue",
    "goals": [
      "Muscle / Bulk",
      "Sleep & GH Optimization",
      "Recovery & Healing",
      "Fat Loss / Lean Out"
    ],
    "frequency": "1–3× daily",
    "timing": "Fasted, avoid 2hrs post-meal",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 12,
    "typicalCycleOffDays": 4,
    "contraindications": [
      "Cancer History"
    ],
    "interactions": [
      {
        "substance": "HGH (exogenous)",
        "note": "Cap at 100mcg when on HGH.",
        "severity": "caution"
      },
      {
        "substance": "Insulin",
        "note": "GH blunts insulin action.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "CJC-1295",
      "MK-677"
    ],
    "description": "Selective ghrelin receptor / growth hormone secretagogue peptide intended to raise pulsatile GH release with less cortisol or prolactin stimulation than older GH secretagogues. The evidence base is not robust enough for routine medical use.",
    "upsides": [
      "More selective GH release than GHRP-2/GHRP-6",
      "Less cortisol and prolactin elevation than alternatives",
      "Designed for cleaner GH pulses, especially pre-sleep",
      "Commonly paired with CJC-1295 in research protocols"
    ],
    "risks": [
      "FDA flags as compounding safety-risk substance",
      "Serious adverse events including death reported in IV studies",
      "Human evidence base is thin vs. approved GH therapies",
      "Multiple daily injections required",
      "Long-term GH axis effects unclear"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA flags as compounding safety-risk substance. Serious adverse events including death reported in IV gastric motility studies."
    }
  },
  "Semaglutide": {
    "name": "Semaglutide",
    "aka": "GLP-1 Agonist (Ozempic/Wegovy)",
    "goals": [
      "Fat Loss / Lean Out"
    ],
    "frequency": "Once weekly",
    "timing": "Same day each week",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1
    ],
    "cycleNote": "Titrate: 0.25→0.5→1.0→2.4mg/wk",
    "contraindications": [
      "Thyroid Disorder",
      "Kidney Disease",
      "Liver Disease",
      "Pancreatitis History"
    ],
    "interactions": [
      {
        "substance": "Insulin",
        "note": "Severe hypoglycemia risk.",
        "severity": "avoid"
      },
      {
        "substance": "Metformin",
        "note": "Monitor GI side effects.",
        "severity": "caution"
      },
      {
        "substance": "Blood pressure meds",
        "note": "Weight loss may lower BP.",
        "severity": "caution"
      },
      {
        "substance": "Alcohol",
        "note": "Heightened nausea.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "AOD-9604"
    ],
    "description": "GLP-1 receptor agonist and one of the most scientifically mature compounds on this list. Engineered for long duration and once-weekly dosing. Core science: glucose-dependent insulin secretion, delayed gastric emptying, appetite reduction, and central satiety signaling. Enormous clinical evidence base.",
    "upsides": [
      "FDA-approved with clear labeled titration schedule",
      "15–20% body weight reduction in clinical trials",
      "Cardioprotective benefits demonstrated",
      "Convenient once-weekly dosing",
      "The most defensible dosing and monitoring logic of any peptide here"
    ],
    "risks": [
      "Thyroid C-cell tumor warning (boxed)",
      "Pancreatitis and gallbladder disease risk",
      "Nausea/vomiting common during titration — improves over time",
      "Muscle loss risk without resistance training",
      "Weight typically returns if stopped without lifestyle changes",
      "Hypoglycemia risk when combined with insulin or sulfonylureas"
    ],
    "evidenceTier": {
      "tier": "FDA Approved",
      "label": "FDA Approved",
      "fdaFlag": false,
      "fdaNote": "FDA-approved for type 2 diabetes (Ozempic) and weight management (Wegovy). Clear titration schedule and extensive clinical evidence."
    }
  },
  "PT-141": {
    "name": "PT-141",
    "aka": "Bremelanotide MC3R/MC4R",
    "goals": [
      "Libido & Hormones"
    ],
    "frequency": "As needed (max 1×/72h)",
    "timing": "45–90 min before activity",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [],
    "cycleNote": "As needed. Cycle for sensitivity.",
    "contraindications": [
      "Cardiovascular Disease",
      "Hypertension"
    ],
    "interactions": [
      {
        "substance": "Blood pressure meds",
        "note": "Transiently raises BP — avoid.",
        "severity": "avoid"
      },
      {
        "substance": "SSRIs / Antidepressants",
        "note": "Blunts effects.",
        "severity": "caution"
      },
      {
        "substance": "Alcohol",
        "note": "Increased nausea.",
        "severity": "caution"
      }
    ],
    "synergies": [],
    "description": "Bremelanotide — a melanocortin receptor agonist (especially MC4R) that affects sexual desire through central neuroendocrine signaling rather than blood flow. FDA-approved specifically for hypoactive sexual desire disorder (HSDD) in premenopausal women, not as a general-purpose sexual enhancer.",
    "upsides": [
      "FDA-approved with defined labeled dose (1.75 mg SubQ)",
      "Central mechanism of action — works on desire, not just blood flow",
      "Effective in the indicated population when PDE5 inhibitors fail",
      "Effects can last 6–72 hours from a single dose"
    ],
    "risks": [
      "Approved only for premenopausal women with HSDD — off-label for men",
      "Transient blood pressure increase — contraindicated with CVD/HTN",
      "Nausea is common, especially at higher doses",
      "Max 1 dose per 24 hours, max 8 doses per month on label",
      "Receptor desensitization requires cycling for sustained effect"
    ],
    "evidenceTier": {
      "tier": "FDA Approved",
      "label": "FDA Approved",
      "fdaFlag": false,
      "fdaNote": "FDA-approved as bremelanotide (Vyleesi) for hypoactive sexual desire disorder in premenopausal women. Labeled dose: 1.75 mg SubQ, max 8 doses/month."
    }
  },
  "Epithalon": {
    "name": "Epithalon",
    "aka": "Telomerase Activator",
    "goals": [
      "Longevity",
      "Skin & Anti-Aging",
      "Sleep & GH Optimization"
    ],
    "frequency": "Daily during cycle",
    "timing": "Morning or evening",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "cycleNote": "10–20 days on, 4–6mo off",
    "contraindications": [
      "Cancer History"
    ],
    "interactions": [],
    "synergies": [
      "GHK-Cu",
      "Thymosin Alpha-1",
      "MOTS-c",
      "SS-31"
    ],
    "description": "Synthetic tetrapeptide marketed for aging, sleep, and telomere-related claims. The research reputation is much stronger in marketing than in clinical medicine — there is no robust modern human evidence base. FDA flags it as a compounding safety-risk substance.",
    "upsides": [
      "Interesting biological hypothesis around telomerase activation",
      "Some preclinical data on circadian rhythm normalization",
      "Antioxidant activity observed in animal models",
      "Short-course protocol (10–20 days) limits exposure"
    ],
    "risks": [
      "FDA flags as compounding safety-risk substance",
      "Immunogenicity and peptide impurity concerns",
      "Research reputation far exceeds actual clinical evidence",
      "No robust human evidence base for any claimed benefit",
      "Contraindicated with cancer history"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA lists as compounding safety-risk substance citing immunogenicity and peptide impurity concerns. No robust modern human evidence base."
    }
  },
  "Selank": {
    "name": "Selank",
    "aka": "GABA-A Anxiolytic",
    "goals": [
      "Cognitive / Nootropic",
      "Immune Support"
    ],
    "frequency": "2–3× daily",
    "timing": "AM + early afternoon",
    "primaryRoute": "Nasal spray",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 3,
    "typicalCycleOffDays": 2,
    "contraindications": [],
    "interactions": [
      {
        "substance": "SSRIs / Antidepressants",
        "note": "Potentiates SSRI effects.",
        "severity": "caution"
      },
      {
        "substance": "Alcohol",
        "note": "Additive sedation.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "Semax"
    ],
    "description": "Synthetic peptide developed as an anxiolytic/neuroactive compound, framed as GABA-linked or stress-modulating with possible effects on cognition, anxiety, and immune signaling. No validated human dosing framework suitable for consumer use.",
    "upsides": [
      "Interesting pharmacology around anxiety and stress modulation",
      "Non-sedating anxiolytic mechanism (unlike benzodiazepines)",
      "Available as nasal spray — no injection needed",
      "No tolerance or withdrawal reported in limited studies"
    ],
    "risks": [
      "FDA flags as compounding safety-risk substance",
      "No strong, standardized human evidence base",
      "No validated dosing framework for consumer use",
      "Potentiates SSRI effects — combination risk",
      "Degrades quickly — requires refrigeration"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA lists as compounding safety-risk substance. No validated human dosing framework suitable for consumer protocol generation."
    }
  },
  "Semax": {
    "name": "Semax",
    "aka": "BDNF Upregulator",
    "goals": [
      "Cognitive / Nootropic",
      "Recovery & Healing"
    ],
    "frequency": "1–2× daily",
    "timing": "AM primary, early PM 2nd",
    "primaryRoute": "Nasal spray",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 4,
    "typicalCycleOffDays": 2,
    "contraindications": [],
    "interactions": [
      {
        "substance": "SSRIs / Antidepressants",
        "note": "Upregulates serotonin.",
        "severity": "caution"
      },
      {
        "substance": "Stimulants (Adderall, etc.)",
        "note": "Additive CNS stimulation.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "Selank"
    ],
    "description": "Short synthetic neuroactive peptide related to ACTH, commonly discussed for cognition, neuroprotection, and BDNF-related effects. Falls in the 'interesting biology, weak standardized clinical evidence' category. FDA lists it as a compounding safety risk.",
    "upsides": [
      "Interesting neurotrophic / BDNF research",
      "Rapid onset — effects felt within 15–30 minutes",
      "Neuroprotective data in stroke recovery models",
      "Nasal administration — no injection required"
    ],
    "risks": [
      "FDA flags as compounding safety-risk substance",
      "Research-only from a clinical standpoint",
      "No standardized human dosing protocol",
      "Potentiates serotonin — interaction risk with SSRIs",
      "Additive CNS stimulation with stimulant medications"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA lists as compounding safety-risk substance. Research-only from a clinical standpoint."
    }
  },
  "AOD-9604": {
    "name": "AOD-9604",
    "aka": "GH Fragment 176–191",
    "goals": [
      "Fat Loss / Lean Out"
    ],
    "frequency": "Once daily",
    "timing": "Morning fasted / pre-workout",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 12,
    "typicalCycleOffDays": 6,
    "contraindications": [
      "Cancer History"
    ],
    "interactions": [
      {
        "substance": "Semaglutide",
        "note": "Additive — reduce AOD 25%.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "Semaglutide",
      "Tesamorelin"
    ],
    "description": "Modified fragment of growth hormone amino acids 176–191, designed to isolate potential lipolytic effects without broader anabolic and glucose effects of full GH signaling. The evidence base has not produced a widely accepted clinical role.",
    "upsides": [
      "Intended to separate fat-loss effects from full GH effects",
      "No blood sugar impact or IGF-1 elevation in theory",
      "FDA granted GRAS status for oral supplement use (2014)",
      "Preclinical data on targeted lipolysis"
    ],
    "risks": [
      "FDA flags injectable form as compounding safety-risk substance",
      "Has not produced a widely accepted clinical role",
      "Modest standalone results — needs diet and training",
      "Oral bioavailability is poor",
      "Weak human evidence supporting marketed claims"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA flags as compounding safety-risk substance. Has not produced a widely accepted clinical role despite GRAS status for oral supplements."
    }
  },
  "GHK-Cu": {
    "name": "GHK-Cu",
    "aka": "Copper Peptide",
    "goals": [
      "Skin & Anti-Aging",
      "Recovery & Healing",
      "Longevity"
    ],
    "frequency": "Once daily SubQ / 2× topical",
    "timing": "AM SubQ. Topical AM + PM",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 8,
    "typicalCycleOffDays": 4,
    "contraindications": [],
    "interactions": [],
    "synergies": [
      "BPC-157",
      "TB-500",
      "Epithalon"
    ],
    "description": "Copper-binding tripeptide complex involved in wound healing, skin repair, collagen signaling, and oxidative stress modulation. Chemically distinct because it is a metal-peptide complex, not just a free peptide — making route, formulation, and purity especially important.",
    "upsides": [
      "Participates in collagen/elastin synthesis pathways",
      "Interesting wound healing and skin repair biology",
      "Works both topically and systemically in animal models",
      "Antioxidant enzyme activation in preclinical data"
    ],
    "risks": [
      "FDA specifically flags injectable GHK-Cu as compounding safety risk",
      "Route of administration significantly changes safety profile",
      "Copper overload risk at excessive doses",
      "Topical product quality varies wildly between suppliers",
      "Long-term copper balance effects unclear"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA specifically flags injectable GHK-Cu as compounding safety risk. Route and formulation significantly affect safety profile."
    }
  },
  "Thymosin Alpha-1": {
    "name": "Thymosin Alpha-1",
    "aka": "Thymic Immune Modulator",
    "goals": [
      "Immune Support",
      "Longevity"
    ],
    "frequency": "2× per week",
    "timing": "Anytime, consistent days",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      4
    ],
    "typicalCycleOnDays": 6,
    "typicalCycleOffDays": 4,
    "contraindications": [
      "Autoimmune Disease"
    ],
    "interactions": [
      {
        "substance": "Other prescription medications",
        "note": "May counter immunosuppressants.",
        "severity": "avoid"
      }
    ],
    "synergies": [
      "Epithalon",
      "KPV"
    ],
    "description": "28-amino-acid thymic peptide that acts as an immune modulator, interacting with both innate and adaptive immune responses. The most clinically mature 'immune peptide' on this list — approved in 37+ countries for hepatitis B/C with real immunology literature behind it, not just wellness marketing.",
    "upsides": [
      "Approved in 37+ countries for hepatitis B/C",
      "Legitimate immunology literature — not just marketing",
      "Enhances T-cell maturation and immune function",
      "Literature dosing: 0.8–6.4 mg SubQ twice weekly in studies",
      "Decades of clinical use data in some regions"
    ],
    "risks": [
      "FDA still flags for US compounded products (route/quality concerns)",
      "Contraindicated with autoimmune disease",
      "May counter immunosuppressant medications",
      "Gradual onset — 4–8 weeks for immune effects",
      "More expensive than most peptides on this list"
    ],
    "evidenceTier": {
      "tier": "Limited Human",
      "label": "Limited Human Data",
      "fdaFlag": true,
      "fdaNote": "Used clinically in 37+ countries for hepatitis B/C. FDA still lists among compounding safety concerns for US compounded products, reflecting route/quality issues."
    }
  },
  "MOTS-c": {
    "name": "MOTS-c",
    "aka": "Mitochondrial AMPK Activator",
    "goals": [
      "Longevity",
      "Fat Loss / Lean Out",
      "Muscle / Bulk"
    ],
    "frequency": "3× per week",
    "timing": "Pre-workout / morning fasted",
    "primaryRoute": "SubQ or IM",
    "typicalScheduleDays": [
      1,
      3,
      5
    ],
    "typicalCycleOnDays": 8,
    "typicalCycleOffDays": 4,
    "contraindications": [],
    "interactions": [
      {
        "substance": "Metformin",
        "note": "Synergistic AMPK — monitor glucose.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "Epithalon",
      "SS-31"
    ],
    "description": "Mitochondrial-derived peptide — scientifically interesting because it originates from mitochondrial DNA rather than nuclear genes. Discussed in metabolism, exercise adaptation, insulin sensitivity, and cellular stress responses. FDA says no human exposure data exists sufficient to evaluate safety.",
    "upsides": [
      "Novel biology — mitochondrial-derived signaling peptide",
      "AMPK activation associated with metabolic flexibility",
      "Exercise-mimetic properties in animal models",
      "Interesting research on insulin sensitivity and aging"
    ],
    "risks": [
      "FDA: no identified human exposure data sufficient to evaluate safety",
      "Very early-stage science — not clinically settled",
      "No established human dosing protocol",
      "Expensive with limited supply",
      "Potentiates Metformin — combination monitoring needed"
    ],
    "evidenceTier": {
      "tier": "Speculative",
      "label": "Speculative",
      "fdaFlag": true,
      "fdaNote": "FDA says no identified human exposure data sufficient to evaluate safety. Very early-stage science with no clinically settled dosing."
    }
  },
  "KPV": {
    "name": "KPV",
    "aka": "Anti-inflammatory Tripeptide",
    "goals": [
      "Gut Health",
      "Immune Support",
      "Skin & Anti-Aging"
    ],
    "frequency": "Once daily",
    "timing": "AM or PM, consistent",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 8,
    "typicalCycleOffDays": 4,
    "contraindications": [],
    "interactions": [
      {
        "substance": "Other prescription medications",
        "note": "Check if on immunosuppressants.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "BPC-157",
      "Thymosin Alpha-1"
    ],
    "description": "Anti-inflammatory tripeptide (alpha-MSH fragment) discussed for gut inflammation, skin, and immune modulation. One of the clearest examples of a peptide with speculative interest but almost no clinical foundation. FDA notes no identified human exposure data.",
    "upsides": [
      "Targeted anti-inflammatory mechanism (NF-κB pathway)",
      "Oral route may work for gut — no injection needed in theory",
      "Short peptide — chemically simple",
      "Interesting preclinical data on IL-6 and TNF-α reduction"
    ],
    "risks": [
      "FDA: no identified human exposure data whatsoever",
      "Almost no clinical foundation for any claim",
      "Speculative interest only — not validated in humans",
      "Oral vs. injection bioavailability not established",
      "Immunomodulatory effects not characterized in people"
    ],
    "evidenceTier": {
      "tier": "Speculative",
      "label": "Speculative",
      "fdaFlag": true,
      "fdaNote": "FDA notes no identified human exposure data and insufficient safety information. Speculative interest with almost no clinical foundation."
    }
  },
  "SS-31": {
    "name": "SS-31",
    "aka": "Mitochondrial Antioxidant",
    "goals": [
      "Longevity",
      "Recovery & Healing",
      "Cognitive / Nootropic"
    ],
    "frequency": "Once daily",
    "timing": "Morning fasted",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 8,
    "typicalCycleOffDays": 4,
    "contraindications": [
      "Kidney Disease"
    ],
    "interactions": [],
    "synergies": [
      "MOTS-c",
      "Epithalon"
    ],
    "description": "Elamipretide (MTP-131) — a mitochondria-targeted tetrapeptide designed to interact with cardiolipin in the inner mitochondrial membrane. One of the more sophisticated peptides here from a medicinal chemistry perspective: not just 'a peptide' but a targeted mitochondrial drug candidate with real human trials.",
    "upsides": [
      "Real clinical development with human trials (40 mg/day studied)",
      "Targets mitochondrial dysfunction at the cardiolipin level",
      "Improved exercise capacity demonstrated in human studies",
      "More legitimate as an investigational drug than most peptides here"
    ],
    "risks": [
      "Contraindicated with kidney disease",
      "Very expensive compound",
      "SubQ administration less validated than IV in trials",
      "Requires cold-chain storage",
      "Still investigational — not approved for any indication"
    ],
    "evidenceTier": {
      "tier": "Clinical Trials",
      "label": "Active Clinical Trials",
      "fdaFlag": false,
      "fdaNote": "Elamipretide has real clinical development with human trials (40 mg/day studied). More legitimate as a candidate investigational drug than most peptides on this list."
    }
  },
  "Retatrutide": {
    "name": "Retatrutide",
    "aka": "Triple GIP/GLP-1/Glucagon Agonist",
    "goals": [
      "Fat Loss / Lean Out",
      "Muscle / Bulk"
    ],
    "frequency": "Once weekly",
    "timing": "Same day each week",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1
    ],
    "cycleNote": "Titrate: 0.5→1→2→4→8mg/wk",
    "contraindications": [
      "Thyroid Disorder",
      "Cancer History",
      "Kidney Disease",
      "Pancreatitis History"
    ],
    "interactions": [
      {
        "substance": "Insulin",
        "note": "Severe hypoglycemia risk.",
        "severity": "avoid"
      },
      {
        "substance": "Semaglutide",
        "note": "NEVER combine GLP-1 agonists.",
        "severity": "avoid"
      },
      {
        "substance": "Metformin",
        "note": "Monitor glucose.",
        "severity": "caution"
      }
    ],
    "synergies": [],
    "description": "Triple receptor agonist for GIP, GLP-1, and glucagon — a polyagonist metabolic peptide combining appetite suppression, glucose control, energy expenditure, and weight-loss effects. Phase 2 trial showed ~24% body weight reduction. Among the most advanced obesity peptides in development.",
    "upsides": [
      "~24% weight reduction in phase 2 trials",
      "Triple receptor agonism — more pathways than semaglutide",
      "Glucagon component raises thermogenesis",
      "Among the most watched obesity drugs in development"
    ],
    "risks": [
      "Still investigational — not FDA-approved",
      "Not interchangeable with or addable to semaglutide",
      "GI side effects may be severe during titration",
      "Long-term safety data not yet available",
      "NEVER combine with other GLP-1 agonists — pancreatitis risk"
    ],
    "evidenceTier": {
      "tier": "Clinical Trials",
      "label": "Phase 2 Trials",
      "fdaFlag": false,
      "fdaNote": "Phase 2 trial showed ~24% body weight reduction. Still investigational — not approved or interchangeable with semaglutide."
    }
  },
  "Tesamorelin": {
    "name": "Tesamorelin",
    "aka": "FDA-Approved GHRH Analog",
    "goals": [
      "Fat Loss / Lean Out",
      "Muscle / Bulk",
      "Cognitive / Nootropic",
      "Sleep & GH Optimization"
    ],
    "frequency": "Once daily",
    "timing": "Bedtime or morning fasted",
    "primaryRoute": "SubQ",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 12,
    "typicalCycleOffDays": 8,
    "contraindications": [
      "Cancer History",
      "Thyroid Disorder",
      "Diabetes / Insulin Resistance"
    ],
    "interactions": [
      {
        "substance": "HGH (exogenous)",
        "note": "Additive — use one or the other.",
        "severity": "caution"
      },
      {
        "substance": "Insulin",
        "note": "Raises glucose via GH.",
        "severity": "caution"
      }
    ],
    "synergies": [
      "Ipamorelin",
      "AOD-9604"
    ],
    "description": "Synthetic GHRH analog engineered to stimulate endogenous pituitary GH release. The only FDA-approved GHRH analog, indicated for HIV-associated lipodystrophy. Maintains physiologic pulsatile GH release pattern rather than constant elevation.",
    "upsides": [
      "FDA-approved — the most validated GHRH analog available",
      "Specifically targets visceral fat reduction",
      "Maintains physiologic GH pulse pattern",
      "Cognitive improvement signals in clinical trials",
      "Labeled dosing: 2 mg/day (older) or 1.4 mg/day (newer)"
    ],
    "risks": [
      "Contraindicated with cancer history or diabetes",
      "Daily SubQ injection required",
      "Glucose effects and IGF-1 elevation require monitoring",
      "Joint pain and water retention common",
      "Requires appropriate medical oversight — not a wellness peptide"
    ],
    "evidenceTier": {
      "tier": "FDA Approved",
      "label": "FDA Approved",
      "fdaFlag": false,
      "fdaNote": "FDA-approved for HIV-associated lipodystrophy. Labeled regimens: 2 mg/day (older) or 1.4 mg/day (newer formulation)."
    }
  },
  "MK-677": {
    "name": "MK-677",
    "aka": "Oral GH Secretagogue",
    "goals": [
      "Muscle / Bulk",
      "Sleep & GH Optimization",
      "Skin & Anti-Aging",
      "Recovery & Healing",
      "Longevity"
    ],
    "frequency": "Once daily (oral)",
    "timing": "Bedtime",
    "primaryRoute": "Oral",
    "typicalScheduleDays": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "typicalCycleOnDays": 16,
    "typicalCycleOffDays": 8,
    "contraindications": [
      "Diabetes / Insulin Resistance",
      "Cancer History",
      "Cardiovascular Disease"
    ],
    "interactions": [
      {
        "substance": "Insulin",
        "note": "Worsens insulin resistance.",
        "severity": "avoid"
      },
      {
        "substance": "HGH (exogenous)",
        "note": "Lower MK-677 to 10mg.",
        "severity": "caution"
      },
      {
        "substance": "SARMs",
        "note": "Compatible, monitor retention.",
        "severity": "info"
      },
      {
        "substance": "TRT / Testosterone",
        "note": "Synergistic.",
        "severity": "info"
      }
    ],
    "synergies": [
      "CJC-1295",
      "Ipamorelin"
    ],
    "description": "Oral small-molecule ghrelin receptor agonist (not technically a peptide) that stimulates GH and IGF-1. Heavily discussed in performance and anti-aging circles due to oral convenience. FDA flags it as a compounding safety-risk substance and notes a clinical trial signal for congestive heart failure.",
    "upsides": [
      "Oral administration — no injections required",
      "Convenient once-daily dosing at bedtime",
      "Raises GH and IGF-1 systemically",
      "May improve sleep quality via GH pulse timing"
    ],
    "risks": [
      "FDA flags as compounding safety-risk substance",
      "Clinical trial signal for congestive heart failure — major red flag",
      "Significantly increases hunger via ghrelin pathway",
      "Worsens insulin resistance — contraindicated with diabetes",
      "Water retention and bloating common",
      "Risk/benefit far more serious than internet hype suggests"
    ],
    "evidenceTier": {
      "tier": "Preclinical",
      "label": "Preclinical Only",
      "fdaFlag": true,
      "fdaNote": "FDA flags as compounding safety-risk substance. A clinical trial signal for congestive heart failure was identified — this is a major safety concern."
    }
  }
};
