import { useState, useEffect } from "react";

// ── DATA ─────────────────────────────────────────────────────────
const PEPTIDE_DB = {
  "BPC-157": { name:"BPC-157",aka:"Body Protection Compound",goals:["Recovery & Healing","Gut Health","Skin & Anti-Aging","Muscle / Bulk"],baseDose:250,unit:"mcg",usePerKg:true,perKgBase:3.3,frequency:"Twice daily",timing:"Morning fasted + 30 min before bed",primaryRoute:"SubQ injection",scheduleDays:[1,2,3,4,5,6,7],cycleOn:6,cycleOff:4,sexMult:{Male:1.0,Female:0.85},ageMult:[[18,35,1.0],[35,50,1.0],[50,65,0.9],[65,100,0.8]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.12,over110:1.25},bfType:"neutral",expMult:{beginner:0.55,intermediate:0.78,advanced:1.0},firstCycleMult:0.7,minDose:100,maxDose:600,contraindications:["Cancer History"],interactions:[{substance:"Blood thinners",note:"May potentiate anticoagulant effect.",severity:"caution"}],synergies:["TB-500","GHK-Cu"],priority:{"Recovery & Healing":5,"Gut Health":5,"Skin & Anti-Aging":3,"Muscle / Bulk":2} },
  "TB-500": { name:"TB-500",aka:"Thymosin Beta-4 Fragment",goals:["Recovery & Healing","Skin & Anti-Aging","Muscle / Bulk"],baseDose:2000,unit:"mcg",usePerKg:false,frequency:"2×/week → 1×/week maintenance",timing:"Anytime, consistent days",primaryRoute:"SubQ or IM",scheduleDays:[1,4],cycleOn:6,cycleOff:4,sexMult:{Male:1.0,Female:0.9},ageMult:[[18,35,1.0],[35,50,1.0],[50,65,0.95],[65,100,0.9]],weightMult:{under60:0.8,"60-90":1.0,"90-110":1.15,over110:1.25},bfType:"neutral",expMult:{beginner:0.5,intermediate:0.75,advanced:1.0},firstCycleMult:0.75,minDose:1000,maxDose:5000,contraindications:["Cancer History","Autoimmune Disease"],interactions:[{substance:"Blood thinners",note:"Increased bleeding risk.",severity:"caution"}],synergies:["BPC-157","GHK-Cu"],priority:{"Recovery & Healing":5,"Skin & Anti-Aging":3,"Muscle / Bulk":2} },
  "CJC-1295": { name:"CJC-1295",aka:"GHRH Analog (DAC)",goals:["Muscle / Bulk","Sleep & GH Optimization","Recovery & Healing","Skin & Anti-Aging","Longevity"],baseDose:500,unit:"mcg",usePerKg:false,frequency:"2×/week (DAC)",timing:"Pre-sleep or fasted AM",primaryRoute:"SubQ",scheduleDays:[1,4],cycleOn:12,cycleOff:6,sexMult:{Male:1.0,Female:0.8},ageMult:[[18,30,0.8],[30,50,1.0],[50,65,1.1],[65,100,1.15]],weightMult:{under60:0.8,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"gh-release",expMult:{beginner:0.5,intermediate:0.75,advanced:1.0},firstCycleMult:0.6,minDose:250,maxDose:2000,contraindications:["Cancer History","Diabetes / Insulin Resistance","Thyroid Disorder"],interactions:[{substance:"HGH (exogenous)",note:"Additive GH — reduce CJC 50%.",severity:"caution"},{substance:"Insulin",note:"GH reduces insulin sensitivity.",severity:"caution"},{substance:"TRT / Testosterone",note:"Synergistic for body composition.",severity:"info"},{substance:"SARMs",note:"Compatible — monitor water retention.",severity:"info"}],synergies:["Ipamorelin","MK-677"],priority:{"Muscle / Bulk":4,"Sleep & GH Optimization":4,"Recovery & Healing":3,"Skin & Anti-Aging":3,"Longevity":3} },
  "Ipamorelin": { name:"Ipamorelin",aka:"Selective GH Secretagogue",goals:["Muscle / Bulk","Sleep & GH Optimization","Recovery & Healing","Fat Loss / Lean Out"],baseDose:250,unit:"mcg",usePerKg:false,frequency:"1–3× daily",timing:"Fasted, avoid 2hrs post-meal",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleOn:12,cycleOff:4,sexMult:{Male:1.0,Female:0.85},ageMult:[[18,30,0.85],[30,50,1.0],[50,65,1.1],[65,100,1.2]],weightMult:{under60:0.8,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"gh-release",expMult:{beginner:0.5,intermediate:0.75,advanced:1.0},firstCycleMult:0.6,minDose:100,maxDose:500,contraindications:["Cancer History"],interactions:[{substance:"HGH (exogenous)",note:"Cap at 100mcg when on HGH.",severity:"caution"},{substance:"Insulin",note:"GH blunts insulin action.",severity:"caution"}],synergies:["CJC-1295","MK-677"],priority:{"Muscle / Bulk":4,"Sleep & GH Optimization":5,"Recovery & Healing":3,"Fat Loss / Lean Out":2} },
  "Semaglutide": { name:"Semaglutide",aka:"GLP-1 Agonist (Ozempic/Wegovy)",goals:["Fat Loss / Lean Out"],baseDose:0.25,unit:"mg",usePerKg:false,frequency:"Once weekly",timing:"Same day each week",primaryRoute:"SubQ",scheduleDays:[1],cycleNote:"Titrate: 0.25→0.5→1.0→2.4mg/wk",sexMult:{Male:1.0,Female:1.0},ageMult:[[18,50,1.0],[50,65,0.9],[65,100,0.8]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"fat-loss",expMult:{beginner:0.7,intermediate:0.85,advanced:1.0},firstCycleMult:0.7,minDose:0.1,maxDose:2.4,contraindications:["Thyroid Disorder","Kidney Disease","Liver Disease","Pancreatitis History"],interactions:[{substance:"Insulin",note:"Severe hypoglycemia risk.",severity:"avoid"},{substance:"Metformin",note:"Monitor GI side effects.",severity:"caution"},{substance:"Blood pressure meds",note:"Weight loss may lower BP.",severity:"caution"},{substance:"Alcohol",note:"Heightened nausea.",severity:"caution"}],synergies:["AOD-9604"],priority:{"Fat Loss / Lean Out":5} },
  "PT-141": { name:"PT-141",aka:"Bremelanotide MC3R/MC4R",goals:["Libido & Hormones"],baseDose:1.75,unit:"mg",usePerKg:false,frequency:"As needed (max 1×/72h)",timing:"45–90 min before activity",primaryRoute:"SubQ",scheduleDays:[],cycleNote:"As needed. Cycle for sensitivity.",sexMult:{Male:1.0,Female:0.57},ageMult:[[18,50,1.0],[50,65,0.9],[65,100,0.8]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.0,over110:1.0},bfType:"neutral",expMult:{beginner:0.55,intermediate:0.8,advanced:1.0},firstCycleMult:0.55,minDose:0.5,maxDose:2.0,contraindications:["Cardiovascular Disease","Hypertension"],interactions:[{substance:"Blood pressure meds",note:"Transiently raises BP — avoid.",severity:"avoid"},{substance:"SSRIs / Antidepressants",note:"Blunts effects.",severity:"caution"},{substance:"Alcohol",note:"Increased nausea.",severity:"caution"}],synergies:[],priority:{"Libido & Hormones":5} },
  "Epithalon": { name:"Epithalon",aka:"Telomerase Activator",goals:["Longevity","Skin & Anti-Aging","Sleep & GH Optimization"],baseDose:5000,unit:"mcg",usePerKg:false,frequency:"Daily during cycle",timing:"Morning or evening",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleNote:"10–20 days on, 4–6mo off",sexMult:{Male:1.0,Female:1.0},ageMult:[[18,40,0.8],[40,55,1.0],[55,65,1.1],[65,100,1.2]],weightMult:{under60:0.9,"60-90":1.0,"90-110":1.0,over110:1.0},bfType:"neutral",expMult:{beginner:0.75,intermediate:0.9,advanced:1.0},firstCycleMult:0.8,minDose:2000,maxDose:10000,contraindications:["Cancer History"],interactions:[],synergies:["GHK-Cu","Thymosin Alpha-1","MOTS-c","SS-31"],priority:{"Longevity":5,"Skin & Anti-Aging":4,"Sleep & GH Optimization":3} },
  "Selank": { name:"Selank",aka:"GABA-A Anxiolytic",goals:["Cognitive / Nootropic","Immune Support"],baseDose:400,unit:"mcg",usePerKg:false,frequency:"2–3× daily",timing:"AM + early afternoon",primaryRoute:"Nasal spray",scheduleDays:[1,2,3,4,5,6,7],cycleOn:3,cycleOff:2,sexMult:{Male:1.0,Female:0.85},ageMult:[[18,50,1.0],[50,65,0.9],[65,100,0.85]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.0,over110:1.1},bfType:"neutral",expMult:{beginner:0.6,intermediate:0.8,advanced:1.0},firstCycleMult:0.6,minDose:200,maxDose:600,contraindications:[],interactions:[{substance:"SSRIs / Antidepressants",note:"Potentiates SSRI effects.",severity:"caution"},{substance:"Alcohol",note:"Additive sedation.",severity:"caution"}],synergies:["Semax"],priority:{"Cognitive / Nootropic":4,"Immune Support":3} },
  "Semax": { name:"Semax",aka:"BDNF Upregulator",goals:["Cognitive / Nootropic","Recovery & Healing"],baseDose:300,unit:"mcg",usePerKg:false,frequency:"1–2× daily",timing:"AM primary, early PM 2nd",primaryRoute:"Nasal spray",scheduleDays:[1,2,3,4,5,6,7],cycleOn:4,cycleOff:2,sexMult:{Male:1.0,Female:0.9},ageMult:[[18,40,1.0],[40,60,1.0],[60,100,0.9]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.05,over110:1.1},bfType:"neutral",expMult:{beginner:0.6,intermediate:0.8,advanced:1.0},firstCycleMult:0.6,minDose:150,maxDose:600,contraindications:[],interactions:[{substance:"SSRIs / Antidepressants",note:"Upregulates serotonin.",severity:"caution"},{substance:"Stimulants (Adderall, etc.)",note:"Additive CNS stimulation.",severity:"caution"}],synergies:["Selank"],priority:{"Cognitive / Nootropic":5,"Recovery & Healing":2} },
  "AOD-9604": { name:"AOD-9604",aka:"GH Fragment 176–191",goals:["Fat Loss / Lean Out"],baseDose:250,unit:"mcg",usePerKg:true,perKgBase:3.33,frequency:"Once daily",timing:"Morning fasted / pre-workout",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleOn:12,cycleOff:6,sexMult:{Male:1.0,Female:0.9},ageMult:[[18,50,1.0],[50,65,0.9],[65,100,0.85]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"fat-loss",expMult:{beginner:0.7,intermediate:0.85,advanced:1.0},firstCycleMult:0.75,minDose:150,maxDose:400,contraindications:["Cancer History"],interactions:[{substance:"Semaglutide",note:"Additive — reduce AOD 25%.",severity:"caution"}],synergies:["Semaglutide","Tesamorelin"],priority:{"Fat Loss / Lean Out":4} },
  "GHK-Cu": { name:"GHK-Cu",aka:"Copper Peptide",goals:["Skin & Anti-Aging","Recovery & Healing","Longevity"],baseDose:1000,unit:"mcg",usePerKg:false,frequency:"Once daily SubQ / 2× topical",timing:"AM SubQ. Topical AM + PM",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleOn:8,cycleOff:4,sexMult:{Male:1.0,Female:1.0},ageMult:[[18,40,0.8],[40,55,1.0],[55,100,1.2]],weightMult:{under60:0.9,"60-90":1.0,"90-110":1.0,over110:1.0},bfType:"neutral",expMult:{beginner:0.75,intermediate:0.9,advanced:1.0},firstCycleMult:0.8,minDose:500,maxDose:2000,contraindications:[],interactions:[],synergies:["BPC-157","TB-500","Epithalon"],priority:{"Skin & Anti-Aging":5,"Recovery & Healing":3,"Longevity":3} },
  "Thymosin Alpha-1": { name:"Thymosin Alpha-1",aka:"Thymic Immune Modulator",goals:["Immune Support","Longevity"],baseDose:1600,unit:"mcg",usePerKg:false,frequency:"2× per week",timing:"Anytime, consistent days",primaryRoute:"SubQ",scheduleDays:[1,4],cycleOn:6,cycleOff:4,sexMult:{Male:1.0,Female:1.0},ageMult:[[18,40,0.9],[40,60,1.0],[60,100,1.1]],weightMult:{under60:0.9,"60-90":1.0,"90-110":1.0,over110:1.0},bfType:"neutral",expMult:{beginner:0.75,intermediate:0.9,advanced:1.0},firstCycleMult:0.8,minDose:900,maxDose:1600,contraindications:["Autoimmune Disease"],interactions:[{substance:"Other prescription medications",note:"May counter immunosuppressants.",severity:"avoid"}],synergies:["Epithalon","KPV"],priority:{"Immune Support":5,"Longevity":4} },
  "MOTS-c": { name:"MOTS-c",aka:"Mitochondrial AMPK Activator",goals:["Longevity","Fat Loss / Lean Out","Muscle / Bulk"],baseDose:5000,unit:"mcg",usePerKg:false,frequency:"3× per week",timing:"Pre-workout / morning fasted",primaryRoute:"SubQ or IM",scheduleDays:[1,3,5],cycleOn:8,cycleOff:4,sexMult:{Male:1.0,Female:0.85},ageMult:[[18,40,0.8],[40,55,1.0],[55,70,1.1],[70,100,1.2]],weightMult:{under60:0.8,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"neutral",expMult:{beginner:0.6,intermediate:0.8,advanced:1.0},firstCycleMult:0.7,minDose:2000,maxDose:10000,contraindications:[],interactions:[{substance:"Metformin",note:"Synergistic AMPK — monitor glucose.",severity:"caution"}],synergies:["Epithalon","SS-31"],priority:{"Longevity":5,"Fat Loss / Lean Out":3,"Muscle / Bulk":2} },
  "KPV": { name:"KPV",aka:"Anti-inflammatory Tripeptide",goals:["Gut Health","Immune Support","Skin & Anti-Aging"],baseDose:300,unit:"mcg",usePerKg:false,frequency:"Once daily",timing:"AM or PM, consistent",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleOn:8,cycleOff:4,sexMult:{Male:1.0,Female:1.0},ageMult:[[18,50,1.0],[50,100,1.0]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.0,over110:1.0},bfType:"neutral",expMult:{beginner:0.75,intermediate:0.9,advanced:1.0},firstCycleMult:0.8,minDose:200,maxDose:500,contraindications:[],interactions:[{substance:"Other prescription medications",note:"Check if on immunosuppressants.",severity:"caution"}],synergies:["BPC-157","Thymosin Alpha-1"],priority:{"Gut Health":4,"Immune Support":3,"Skin & Anti-Aging":2} },
  "SS-31": { name:"SS-31",aka:"Mitochondrial Antioxidant",goals:["Longevity","Recovery & Healing","Cognitive / Nootropic"],baseDose:3000,unit:"mcg",usePerKg:false,frequency:"Once daily",timing:"Morning fasted",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleOn:8,cycleOff:4,sexMult:{Male:1.0,Female:0.9},ageMult:[[18,40,0.8],[40,55,1.0],[55,70,1.1],[70,100,1.2]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"neutral",expMult:{beginner:0.7,intermediate:0.85,advanced:1.0},firstCycleMult:0.75,minDose:1000,maxDose:4000,contraindications:["Kidney Disease"],interactions:[],synergies:["MOTS-c","Epithalon"],priority:{"Longevity":4,"Recovery & Healing":3,"Cognitive / Nootropic":3} },
  "Retatrutide": { name:"Retatrutide",aka:"Triple GIP/GLP-1/Glucagon Agonist",goals:["Fat Loss / Lean Out","Muscle / Bulk"],baseDose:1,unit:"mg",usePerKg:false,frequency:"Once weekly",timing:"Same day each week",primaryRoute:"SubQ",scheduleDays:[1],cycleNote:"Titrate: 0.5→1→2→4→8mg/wk",sexMult:{Male:1.0,Female:0.9},ageMult:[[18,50,1.0],[50,65,0.9],[65,100,0.8]],weightMult:{under60:0.8,"60-90":1.0,"90-110":1.1,over110:1.2},bfType:"fat-loss",expMult:{beginner:0.5,intermediate:0.75,advanced:1.0},firstCycleMult:0.5,minDose:0.5,maxDose:12,contraindications:["Thyroid Disorder","Cancer History","Kidney Disease","Pancreatitis History"],interactions:[{substance:"Insulin",note:"Severe hypoglycemia risk.",severity:"avoid"},{substance:"Semaglutide",note:"NEVER combine GLP-1 agonists.",severity:"avoid"},{substance:"Metformin",note:"Monitor glucose.",severity:"caution"}],synergies:[],priority:{"Fat Loss / Lean Out":5,"Muscle / Bulk":2} },
  "Tesamorelin": { name:"Tesamorelin",aka:"FDA-Approved GHRH Analog",goals:["Fat Loss / Lean Out","Muscle / Bulk","Cognitive / Nootropic","Sleep & GH Optimization"],baseDose:2000,unit:"mcg",usePerKg:false,frequency:"Once daily",timing:"Bedtime or morning fasted",primaryRoute:"SubQ",scheduleDays:[1,2,3,4,5,6,7],cycleOn:12,cycleOff:8,sexMult:{Male:1.0,Female:0.9},ageMult:[[18,40,0.85],[40,60,1.0],[60,100,1.1]],weightMult:{under60:0.85,"60-90":1.0,"90-110":1.0,over110:1.0},bfType:"gh-release",expMult:{beginner:0.6,intermediate:0.8,advanced:1.0},firstCycleMult:0.7,minDose:1000,maxDose:2000,contraindications:["Cancer History","Thyroid Disorder","Diabetes / Insulin Resistance"],interactions:[{substance:"HGH (exogenous)",note:"Additive — use one or the other.",severity:"caution"},{substance:"Insulin",note:"Raises glucose via GH.",severity:"caution"}],synergies:["Ipamorelin","AOD-9604"],priority:{"Fat Loss / Lean Out":4,"Muscle / Bulk":3,"Cognitive / Nootropic":3,"Sleep & GH Optimization":3} },
  "MK-677": { name:"MK-677",aka:"Oral GH Secretagogue",goals:["Muscle / Bulk","Sleep & GH Optimization","Skin & Anti-Aging","Recovery & Healing","Longevity"],baseDose:15,unit:"mg",usePerKg:false,frequency:"Once daily (oral)",timing:"Bedtime",primaryRoute:"Oral",scheduleDays:[1,2,3,4,5,6,7],cycleOn:16,cycleOff:8,sexMult:{Male:1.0,Female:0.75},ageMult:[[18,30,0.8],[30,50,1.0],[50,65,1.1],[65,100,1.15]],weightMult:{under60:0.8,"60-90":1.0,"90-110":1.1,over110:1.15},bfType:"gh-release",expMult:{beginner:0.5,intermediate:0.75,advanced:1.0},firstCycleMult:0.6,minDose:10,maxDose:25,contraindications:["Diabetes / Insulin Resistance","Cancer History","Cardiovascular Disease"],interactions:[{substance:"Insulin",note:"Worsens insulin resistance.",severity:"avoid"},{substance:"HGH (exogenous)",note:"Lower MK-677 to 10mg.",severity:"caution"},{substance:"SARMs",note:"Compatible, monitor retention.",severity:"info"},{substance:"TRT / Testosterone",note:"Synergistic.",severity:"info"}],synergies:["CJC-1295","Ipamorelin"],priority:{"Muscle / Bulk":4,"Sleep & GH Optimization":5,"Skin & Anti-Aging":3,"Recovery & Healing":3,"Longevity":3} },
};

const HARD_NO=[{peptides:["Semaglutide","Retatrutide"],reason:"Never combine two GLP-1 agonists — pancreatitis risk."},{peptides:["CJC-1295","Tesamorelin"],reason:"Dual GHRH analogs — excessive GH stimulation."}];

const PEPTIDE_INFO={
  "BPC-157":{desc:"Synthetic 15-amino-acid peptide (C62H98N16O22) derived from a gastric protective protein. Studied for angiogenesis, VEGFR2/Akt-eNOS signaling, tissue repair, and gut protection. A 2025 systematic review found 544 articles but only 36 met inclusion criteria — almost all preclinical. One weak retrospective human report exists (7/12 patients with knee pain).",upsides:["Strong preclinical data for tendon, ligament & muscle repair","Improved vascularity and VEGF expression in animal models","Reduced inflammation in arthritis and injury models","Interesting gut-protective signaling through nitric oxide pathways"],risks:["Almost entirely animal data — only one weak human report","FDA flags as compounding safety-risk substance","No validated clinical dosing regimen exists","May theoretically promote tumor angiogenesis","Phase I oral PK study listed but does not establish efficacy"]},
  "TB-500":{desc:"Marketed as a thymosin beta-4 fragment, but TB-500 sold online is not standardized or equivalent to clinical-grade thymosin beta-4. The parent molecule (thymosin beta-4) is involved in actin regulation, cell migration, angiogenesis, and wound repair — acting as a repair-signaling peptide rather than a hormone.",upsides:["Parent molecule has real human studies in heart injury and eye disease","Phase 1 safety study found thymosin beta-4 well tolerated IV","Ophthalmic trials showed improvement in dry eye","Biologically plausible mechanism for tissue repair"],risks:["TB-500 online ≠ standardized thymosin beta-4","FDA flags thymosin beta-4 fragment as compounding safety risk","Limited direct evidence for bodybuilder-style recovery uses","Quality and purity vary wildly between suppliers","Contraindicated with cancer history and autoimmune disease"]},
  "CJC-1295":{desc:"Growth hormone–releasing hormone (GHRH) analog that activates pituitary somatotroph GHRH receptors, increasing cAMP/PKA signaling, GH release, and downstream IGF-1. The DAC version binds albumin for a half-life of 6–8 days, enabling 1–2× weekly dosing in research contexts.",upsides:["Long-acting — only 1–2 injections per week needed","Designed to elevate baseline GH and IGF-1","Potential benefits for recovery, sleep, and body composition","Established mechanism via GHRH receptor pathway"],risks:["FDA lists as compounding safety-risk substance","Concerns about immunogenicity and impurities","No mainstream endocrinology guideline recommends it","Water retention, joint stiffness, carpal tunnel at higher doses","Contraindicated with cancer, diabetes, thyroid disorders"]},
  "Ipamorelin":{desc:"Selective ghrelin receptor / growth hormone secretagogue peptide intended to raise pulsatile GH release with less cortisol or prolactin stimulation than older GH secretagogues. The evidence base is not robust enough for routine medical use.",upsides:["More selective GH release than GHRP-2/GHRP-6","Less cortisol and prolactin elevation than alternatives","Designed for cleaner GH pulses, especially pre-sleep","Commonly paired with CJC-1295 in research protocols"],risks:["FDA flags as compounding safety-risk substance","Serious adverse events including death reported in IV studies","Human evidence base is thin vs. approved GH therapies","Multiple daily injections required","Long-term GH axis effects unclear"]},
  "Semaglutide":{desc:"GLP-1 receptor agonist and one of the most scientifically mature compounds on this list. Engineered for long duration and once-weekly dosing. Core science: glucose-dependent insulin secretion, delayed gastric emptying, appetite reduction, and central satiety signaling. Enormous clinical evidence base.",upsides:["FDA-approved with clear labeled titration schedule","15–20% body weight reduction in clinical trials","Cardioprotective benefits demonstrated","Convenient once-weekly dosing","The most defensible dosing and monitoring logic of any peptide here"],risks:["Thyroid C-cell tumor warning (boxed)","Pancreatitis and gallbladder disease risk","Nausea/vomiting common during titration — improves over time","Muscle loss risk without resistance training","Weight typically returns if stopped without lifestyle changes","Hypoglycemia risk when combined with insulin or sulfonylureas"]},
  "PT-141":{desc:"Bremelanotide — a melanocortin receptor agonist (especially MC4R) that affects sexual desire through central neuroendocrine signaling rather than blood flow. FDA-approved specifically for hypoactive sexual desire disorder (HSDD) in premenopausal women, not as a general-purpose sexual enhancer.",upsides:["FDA-approved with defined labeled dose (1.75 mg SubQ)","Central mechanism of action — works on desire, not just blood flow","Effective in the indicated population when PDE5 inhibitors fail","Effects can last 6–72 hours from a single dose"],risks:["Approved only for premenopausal women with HSDD — off-label for men","Transient blood pressure increase — contraindicated with CVD/HTN","Nausea is common, especially at higher doses","Max 1 dose per 24 hours, max 8 doses per month on label","Receptor desensitization requires cycling for sustained effect"]},
  "Epithalon":{desc:"Synthetic tetrapeptide marketed for aging, sleep, and telomere-related claims. The research reputation is much stronger in marketing than in clinical medicine — there is no robust modern human evidence base. FDA flags it as a compounding safety-risk substance.",upsides:["Interesting biological hypothesis around telomerase activation","Some preclinical data on circadian rhythm normalization","Antioxidant activity observed in animal models","Short-course protocol (10–20 days) limits exposure"],risks:["FDA flags as compounding safety-risk substance","Immunogenicity and peptide impurity concerns","Research reputation far exceeds actual clinical evidence","No robust human evidence base for any claimed benefit","Contraindicated with cancer history"]},
  "Selank":{desc:"Synthetic peptide developed as an anxiolytic/neuroactive compound, framed as GABA-linked or stress-modulating with possible effects on cognition, anxiety, and immune signaling. No validated human dosing framework suitable for consumer use.",upsides:["Interesting pharmacology around anxiety and stress modulation","Non-sedating anxiolytic mechanism (unlike benzodiazepines)","Available as nasal spray — no injection needed","No tolerance or withdrawal reported in limited studies"],risks:["FDA flags as compounding safety-risk substance","No strong, standardized human evidence base","No validated dosing framework for consumer use","Potentiates SSRI effects — combination risk","Degrades quickly — requires refrigeration"]},
  "Semax":{desc:"Short synthetic neuroactive peptide related to ACTH, commonly discussed for cognition, neuroprotection, and BDNF-related effects. Falls in the 'interesting biology, weak standardized clinical evidence' category. FDA lists it as a compounding safety risk.",upsides:["Interesting neurotrophic / BDNF research","Rapid onset — effects felt within 15–30 minutes","Neuroprotective data in stroke recovery models","Nasal administration — no injection required"],risks:["FDA flags as compounding safety-risk substance","Research-only from a clinical standpoint","No standardized human dosing protocol","Potentiates serotonin — interaction risk with SSRIs","Additive CNS stimulation with stimulant medications"]},
  "AOD-9604":{desc:"Modified fragment of growth hormone amino acids 176–191, designed to isolate potential lipolytic effects without broader anabolic and glucose effects of full GH signaling. The evidence base has not produced a widely accepted clinical role.",upsides:["Intended to separate fat-loss effects from full GH effects","No blood sugar impact or IGF-1 elevation in theory","FDA granted GRAS status for oral supplement use (2014)","Preclinical data on targeted lipolysis"],risks:["FDA flags injectable form as compounding safety-risk substance","Has not produced a widely accepted clinical role","Modest standalone results — needs diet and training","Oral bioavailability is poor","Weak human evidence supporting marketed claims"]},
  "GHK-Cu":{desc:"Copper-binding tripeptide complex involved in wound healing, skin repair, collagen signaling, and oxidative stress modulation. Chemically distinct because it is a metal-peptide complex, not just a free peptide — making route, formulation, and purity especially important.",upsides:["Participates in collagen/elastin synthesis pathways","Interesting wound healing and skin repair biology","Works both topically and systemically in animal models","Antioxidant enzyme activation in preclinical data"],risks:["FDA specifically flags injectable GHK-Cu as compounding safety risk","Route of administration significantly changes safety profile","Copper overload risk at excessive doses","Topical product quality varies wildly between suppliers","Long-term copper balance effects unclear"]},
  "Thymosin Alpha-1":{desc:"28-amino-acid thymic peptide that acts as an immune modulator, interacting with both innate and adaptive immune responses. The most clinically mature 'immune peptide' on this list — approved in 37+ countries for hepatitis B/C with real immunology literature behind it, not just wellness marketing.",upsides:["Approved in 37+ countries for hepatitis B/C","Legitimate immunology literature — not just marketing","Enhances T-cell maturation and immune function","Literature dosing: 0.8–6.4 mg SubQ twice weekly in studies","Decades of clinical use data in some regions"],risks:["FDA still flags for US compounded products (route/quality concerns)","Contraindicated with autoimmune disease","May counter immunosuppressant medications","Gradual onset — 4–8 weeks for immune effects","More expensive than most peptides on this list"]},
  "MOTS-c":{desc:"Mitochondrial-derived peptide — scientifically interesting because it originates from mitochondrial DNA rather than nuclear genes. Discussed in metabolism, exercise adaptation, insulin sensitivity, and cellular stress responses. FDA says no human exposure data exists sufficient to evaluate safety.",upsides:["Novel biology — mitochondrial-derived signaling peptide","AMPK activation associated with metabolic flexibility","Exercise-mimetic properties in animal models","Interesting research on insulin sensitivity and aging"],risks:["FDA: no identified human exposure data sufficient to evaluate safety","Very early-stage science — not clinically settled","No established human dosing protocol","Expensive with limited supply","Potentiates Metformin — combination monitoring needed"]},
  "KPV":{desc:"Anti-inflammatory tripeptide (alpha-MSH fragment) discussed for gut inflammation, skin, and immune modulation. One of the clearest examples of a peptide with speculative interest but almost no clinical foundation. FDA notes no identified human exposure data.",upsides:["Targeted anti-inflammatory mechanism (NF-κB pathway)","Oral route may work for gut — no injection needed in theory","Short peptide — chemically simple","Interesting preclinical data on IL-6 and TNF-α reduction"],risks:["FDA: no identified human exposure data whatsoever","Almost no clinical foundation for any claim","Speculative interest only — not validated in humans","Oral vs. injection bioavailability not established","Immunomodulatory effects not characterized in people"]},
  "SS-31":{desc:"Elamipretide (MTP-131) — a mitochondria-targeted tetrapeptide designed to interact with cardiolipin in the inner mitochondrial membrane. One of the more sophisticated peptides here from a medicinal chemistry perspective: not just 'a peptide' but a targeted mitochondrial drug candidate with real human trials.",upsides:["Real clinical development with human trials (40 mg/day studied)","Targets mitochondrial dysfunction at the cardiolipin level","Improved exercise capacity demonstrated in human studies","More legitimate as an investigational drug than most peptides here"],risks:["Contraindicated with kidney disease","Very expensive compound","SubQ administration less validated than IV in trials","Requires cold-chain storage","Still investigational — not approved for any indication"]},
  "Retatrutide":{desc:"Triple receptor agonist for GIP, GLP-1, and glucagon — a polyagonist metabolic peptide combining appetite suppression, glucose control, energy expenditure, and weight-loss effects. Phase 2 trial showed ~24% body weight reduction. Among the most advanced obesity peptides in development.",upsides:["~24% weight reduction in phase 2 trials","Triple receptor agonism — more pathways than semaglutide","Glucagon component raises thermogenesis","Among the most watched obesity drugs in development"],risks:["Still investigational — not FDA-approved","Not interchangeable with or addable to semaglutide","GI side effects may be severe during titration","Long-term safety data not yet available","NEVER combine with other GLP-1 agonists — pancreatitis risk"]},
  "Tesamorelin":{desc:"Synthetic GHRH analog engineered to stimulate endogenous pituitary GH release. The only FDA-approved GHRH analog, indicated for HIV-associated lipodystrophy. Maintains physiologic pulsatile GH release pattern rather than constant elevation.",upsides:["FDA-approved — the most validated GHRH analog available","Specifically targets visceral fat reduction","Maintains physiologic GH pulse pattern","Cognitive improvement signals in clinical trials","Labeled dosing: 2 mg/day (older) or 1.4 mg/day (newer)"],risks:["Contraindicated with cancer history or diabetes","Daily SubQ injection required","Glucose effects and IGF-1 elevation require monitoring","Joint pain and water retention common","Requires appropriate medical oversight — not a wellness peptide"]},
  "MK-677":{desc:"Oral small-molecule ghrelin receptor agonist (not technically a peptide) that stimulates GH and IGF-1. Heavily discussed in performance and anti-aging circles due to oral convenience. FDA flags it as a compounding safety-risk substance and notes a clinical trial signal for congestive heart failure.",upsides:["Oral administration — no injections required","Convenient once-daily dosing at bedtime","Raises GH and IGF-1 systemically","May improve sleep quality via GH pulse timing"],risks:["FDA flags as compounding safety-risk substance","Clinical trial signal for congestive heart failure — major red flag","Significantly increases hunger via ghrelin pathway","Worsens insulin resistance — contraindicated with diabetes","Water retention and bloating common","Risk/benefit far more serious than internet hype suggests"]},
};

// ── EVIDENCE & FDA DATA ─────────────────────────────────────────
const EVIDENCE_TIERS = {
  "BPC-157":       { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA flags as compounding safety-risk substance. Almost all evidence is from animal models; one weak retrospective human report exists." },
  "TB-500":        { tier: "Limited Human", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", label: "Limited Human Data", fdaFlag: true, fdaNote: "FDA flags thymosin beta-4 fragment (LKKTETQ) as compounding safety-risk substance. TB-500 sold online is not standardized or equivalent to clinical-grade thymosin beta-4." },
  "CJC-1295":      { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA lists as compounding safety-risk substance citing immunogenicity, impurity concerns, and adverse reactions. No mainstream endocrinology guideline recommends it." },
  "Ipamorelin":    { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA flags as compounding safety-risk substance. Serious adverse events including death reported in IV gastric motility studies." },
  "Semaglutide":   { tier: "FDA Approved", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", label: "FDA Approved", fdaFlag: false, fdaNote: "FDA-approved for type 2 diabetes (Ozempic) and weight management (Wegovy). Clear titration schedule and extensive clinical evidence." },
  "PT-141":        { tier: "FDA Approved", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", label: "FDA Approved", fdaFlag: false, fdaNote: "FDA-approved as bremelanotide (Vyleesi) for hypoactive sexual desire disorder in premenopausal women. Labeled dose: 1.75 mg SubQ, max 8 doses/month." },
  "Epithalon":     { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA lists as compounding safety-risk substance citing immunogenicity and peptide impurity concerns. No robust modern human evidence base." },
  "Selank":        { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA lists as compounding safety-risk substance. No validated human dosing framework suitable for consumer protocol generation." },
  "Semax":         { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA lists as compounding safety-risk substance. Research-only from a clinical standpoint." },
  "AOD-9604":      { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA flags as compounding safety-risk substance. Has not produced a widely accepted clinical role despite GRAS status for oral supplements." },
  "GHK-Cu":        { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA specifically flags injectable GHK-Cu as compounding safety risk. Route and formulation significantly affect safety profile." },
  "Thymosin Alpha-1": { tier: "Limited Human", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", label: "Limited Human Data", fdaFlag: true, fdaNote: "Used clinically in 37+ countries for hepatitis B/C. FDA still lists among compounding safety concerns for US compounded products, reflecting route/quality issues." },
  "MOTS-c":        { tier: "Speculative", color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", label: "Speculative", fdaFlag: true, fdaNote: "FDA says no identified human exposure data sufficient to evaluate safety. Very early-stage science with no clinically settled dosing." },
  "KPV":           { tier: "Speculative", color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", label: "Speculative", fdaFlag: true, fdaNote: "FDA notes no identified human exposure data and insufficient safety information. Speculative interest with almost no clinical foundation." },
  "SS-31":         { tier: "Clinical Trials", color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD", label: "Active Clinical Trials", fdaFlag: false, fdaNote: "Elamipretide has real clinical development with human trials (40 mg/day studied). More legitimate as a candidate investigational drug than most peptides on this list." },
  "Retatrutide":   { tier: "Clinical Trials", color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD", label: "Phase 2 Trials", fdaFlag: false, fdaNote: "Phase 2 trial showed ~24% body weight reduction. Still investigational — not approved or interchangeable with semaglutide." },
  "Tesamorelin":   { tier: "FDA Approved", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", label: "FDA Approved", fdaFlag: false, fdaNote: "FDA-approved for HIV-associated lipodystrophy. Labeled regimens: 2 mg/day (older) or 1.4 mg/day (newer formulation)." },
  "MK-677":        { tier: "Preclinical", color: "#E97316", bg: "#FFF7ED", border: "#FDBA74", label: "Preclinical Only", fdaFlag: true, fdaNote: "FDA flags as compounding safety-risk substance. A clinical trial signal for congestive heart failure was identified — this is a major safety concern." },
};

// ── STORAGE ──────────────────────────────────────────────────────
async function sGet(k){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch{return null;}}
async function sSet(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch{}}

// ── ENGINE ───────────────────────────────────────────────────────
async function compressImage(file, maxDim=720, quality=0.72){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>h&&w>maxDim){h=h*(maxDim/w);w=maxDim;}
        else if(h>=w&&h>maxDim){w=w*(maxDim/h);h=maxDim;}
        const canvas=document.createElement("canvas");
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };
      img.onerror=reject;
      img.src=e.target.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}
function wB(kg){if(kg<60)return"under60";if(kg<=90)return"60-90";if(kg<=110)return"90-110";return"over110";}
function aM(r,a){for(const[lo,hi,m]of r)if(a>=lo&&a<hi)return m;return 1;}
function calcDose(p,{age,sex,weightKg,bodyFatPct,experience,firstCycle}){
  let d=p.usePerKg?p.perKgBase*weightKg:p.baseDose;
  if(!p.usePerKg)d*=(p.weightMult?.[wB(weightKg)]??1);
  d*=(p.sexMult?.[sex]??1);d*=aM(p.ageMult,age);
  if(p.bfType==="gh-release"&&bodyFatPct>(sex==="Male"?25:35))d*=0.8;
  if(p.bfType==="fat-loss"&&bodyFatPct>(sex==="Male"?25:35))d*=1.15;
  d*=(p.expMult?.[experience]??1);if(firstCycle)d*=(p.firstCycleMult??0.75);
  d=Math.max(p.minDose,Math.min(p.maxDose,d));
  return p.unit==="mg"?Math.round(d*10)/10:Math.round(d/5)*5;
}
function subHit(iSub,us){const w=iSub.toLowerCase().split(/[\s/,()]+/).filter(x=>x.length>3);return us.some(u=>{if(u==="None")return false;return w.some(x=>u.toLowerCase().includes(x));});}
function buildProtocol(gids,profile,maxPeptides=6,avoidList=[]){
  const labels=gids.map(id=>ALL_GOALS.find(g=>g.id===id)?.label).filter(Boolean);
  const scored=Object.values(PEPTIDE_DB).map(p=>({p,score:labels.reduce((s,gl)=>s+(p.priority?.[gl]??0),0)})).filter(x=>x.score>0&&!avoidList.includes(x.p.name)).sort((a,b)=>b.score-a.score);
  const all=scored.map(({p,score})=>{const cf=profile.conditions.filter(c=>c!=="None of the above"&&p.contraindications.includes(c));const ww=p.interactions.filter(i=>subHit(i.substance,profile.substances));return{peptide:p,score,dose:calcDose(p,profile),contraindicated:cf.length>0,contraFlags:cf,warnings:ww};});
  const elig=all.filter(r=>!r.contraindicated).slice(0,maxPeptides);const contra=all.filter(r=>r.contraindicated);
  const ns=new Set(elig.map(r=>r.peptide.name));const toRm=new Set();
  HARD_NO.forEach(c=>{if(c.peptides.every(n=>ns.has(n))){const pair=c.peptides.map(n=>elig.find(r=>r.peptide.name===n)).sort((a,b)=>a.score-b.score);if(pair[0])toRm.add(pair[0].peptide.name);}});
  const recommended=elig.filter(r=>!toRm.has(r.peptide.name));
  const recNames=new Set(recommended.map(r=>r.peptide.name));
  const removedConflicts=elig.filter(r=>toRm.has(r.peptide.name)).map(r=>{
    const rule=HARD_NO.find(c=>c.peptides.includes(r.peptide.name));
    const keptConflict=rule?rule.peptides.find(n=>n!==r.peptide.name):null;
    // Find replacements: scored > 0, not already recommended, not contraindicated, not avoided, not the removed one, and won't conflict with remaining stack
    const replacements=all.filter(alt=>
      alt.score>0&&!alt.contraindicated&&
      !recNames.has(alt.peptide.name)&&!toRm.has(alt.peptide.name)&&
      !avoidList.includes(alt.peptide.name)&&
      alt.peptide.name!==r.peptide.name&&
      !HARD_NO.some(h=>h.peptides.includes(alt.peptide.name)&&h.peptides.some(n=>recNames.has(n)))
    ).slice(0,5);
    return{name:r.peptide.name,reason:rule?.reason,keptConflict,removedRecord:r,replacements};
  });
  return{recommended,contraindicated:contra,removedConflicts};
}
function bCM(recs){const PAL=["#3BBFB8","#5B9BD5","#72C472","#E8A838","#C47AB5","#E06060","#6BB5D5","#88C97A"];const m={};recs.forEach((r,i)=>{m[r.peptide.name]=PAL[i%PAL.length];});return m;}
function bSched(recs){const PAL=["#3BBFB8","#5B9BD5","#72C472","#E8A838","#C47AB5","#E06060","#6BB5D5","#88C97A"];const s=Array(7).fill(null).map(()=>[]);recs.forEach((r,i)=>{(r.peptide.scheduleDays??[]).forEach(d=>s[d-1].push({name:r.peptide.name,color:PAL[i%PAL.length]}));});return s;}
function todayDow(){const d=new Date().getDay();return d===0?7:d;}
function cycleWk(s){if(!s)return 1;return Math.max(1,Math.floor((Date.now()-new Date(s).getTime())/(7*24*3600*1000))+1);}
function monStart(){const d=new Date();const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));d.setHours(0,0,0,0);return d;}
function fD(iso){const d=new Date(iso);return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}`;}
function fDF(iso){const d=new Date(iso);return`${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]}, ${fD(iso)}`;}

const ALL_GOALS=[{id:"muscle",label:"Muscle / Bulk",icon:"⚡"},{id:"fatloss",label:"Fat Loss / Lean Out",icon:"🔥"},{id:"skin",label:"Skin & Anti-Aging",icon:"✨"},{id:"recovery",label:"Recovery & Healing",icon:"🔄"},{id:"sleep",label:"Sleep & GH Optimization",icon:"🌙"},{id:"cognitive",label:"Cognitive / Nootropic",icon:"🧠"},{id:"longevity",label:"Longevity",icon:"♾️"},{id:"libido",label:"Libido & Hormones",icon:"💫"},{id:"immune",label:"Immune Support",icon:"🛡️"},{id:"gut",label:"Gut Health",icon:"🌿"}];
const ALL_CONDS=["Cancer History","Diabetes / Insulin Resistance","Thyroid Disorder","Autoimmune Disease","Kidney Disease","Liver Disease","Pancreatitis History","Cardiovascular Disease","Hypertension","None of the above"];
const ALL_SUBS=["TRT / Testosterone","HGH (exogenous)","SARMs","Insulin","SSRIs / Antidepressants","Blood thinners","Blood pressure meds","Metformin","Stimulants (Adderall, etc.)","Alcohol","Marijuana","Other prescription medications","None"];

// ── CSS ──────────────────────────────────────────────────────────
const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
  :root {
    --teal: #3BBFB8;
    --teal-light: #E8F8F7;
    --teal-mid: #B8E8E6;
    --teal-dark: #2A9A93;
    --bg: #F4F7F8;
    --white: #FFFFFF;
    --ink: #1A2B2B;
    --ink2: #4A6060;
    --ink3: #8AABAB;
    --border: #E0ECEC;
    --border2: #C8DEDE;
    --red: #E05050;
    --amber: #D4820A;
    --green: #2A9A6A;
    --ease: cubic-bezier(0.22,1,0.36,1);
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--teal-mid); border-radius: 2px; }

  @keyframes up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes in { from { opacity:0; } to { opacity:1; } }
  @keyframes checkBounce { 0%{transform:scale(0.6)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes sweepRight { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1);transform-origin:left} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .fade-up { animation: up 0.38s var(--ease) both; }
  .fade-in { animation: in 0.22s ease both; }

  input, textarea {
    background: var(--white); border: 1.5px solid var(--border2); border-radius: 12px;
    padding: 13px 16px; color: var(--ink); font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px; font-weight: 500; outline: none; width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }
  input:focus, textarea:focus {
    border-color: var(--teal); box-shadow: 0 0 0 3px rgba(59,191,184,0.15);
  }
  textarea { resize: vertical; min-height: 86px; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

  .btn-main {
    background: var(--teal); color: #fff; border: none; border-radius: 14px;
    padding: 15px 28px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
    font-size: 15px; cursor: pointer; letter-spacing: 0.1px;
    transition: background 0.2s, transform 0.18s, box-shadow 0.2s;
    box-shadow: 0 4px 14px rgba(59,191,184,0.35);
  }
  .btn-main:hover { background: var(--teal-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,191,184,0.4); }
  .btn-main:active { transform: translateY(0); }
  .btn-main:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-outline {
    background: transparent; color: var(--ink2); border: 1.5px solid var(--border2);
    border-radius: 12px; padding: 10px 18px; font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600; font-size: 13px; cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }
  .btn-outline:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-light); }

  .seg-btn {
    flex: 1; padding: 11px 8px; background: var(--bg); border: 1.5px solid var(--border2);
    border-radius: 11px; color: var(--ink2); font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600; font-size: 14px; cursor: pointer;
    transition: all 0.18s;
  }
  .seg-btn.on { background: var(--teal-light); border-color: var(--teal); color: var(--teal); font-weight: 700; }
  .seg-btn:hover:not(.on) { border-color: var(--border2); background: var(--white); }

  .goal-tile {
    background: var(--white); border: 2px solid var(--border); border-radius: 16px;
    padding: 16px 10px 14px; cursor: pointer; text-align: center;
    transition: border-color 0.18s, background 0.18s, transform 0.2s, box-shadow 0.2s;
    user-select: none;
  }
  .goal-tile:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(59,191,184,0.12); border-color: var(--teal-mid); }
  .goal-tile.on { background: var(--teal-light); border-color: var(--teal); box-shadow: 0 4px 16px rgba(59,191,184,0.2); }
  .goal-tile.on .g-label { color: var(--teal-dark); }

  .pick-row {
    display: flex; align-items: center; gap: 14px; padding: 13px 16px;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 13px;
    cursor: pointer; user-select: none;
    transition: border-color 0.18s, background 0.18s;
  }
  .pick-row:hover { border-color: var(--teal-mid); }
  .pick-row.on { background: var(--teal-light); border-color: var(--teal); }
  .pick-box {
    width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--border2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-size: 11px; font-weight: 800; color: #fff; transition: all 0.16s;
  }
  .pick-box.on { background: var(--teal); border-color: var(--teal); }

  .exp-tile {
    display: flex; align-items: center; gap: 14px; padding: 14px 16px;
    background: var(--white); border: 2px solid var(--border); border-radius: 14px;
    cursor: pointer; user-select: none; transition: all 0.18s;
  }
  .exp-tile:hover { border-color: var(--teal-mid); transform: translateY(-1px); }
  .exp-tile.on { border-color: var(--teal); background: var(--teal-light); }
  .radio-ring {
    width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border2);
    flex-shrink: 0; transition: all 0.16s; position: relative;
  }
  .radio-ring.on { border-color: var(--teal); border-width: 6px; }

  .card {
    background: var(--white); border-radius: 20px;
    border: 1px solid var(--border); overflow: hidden;
  }
  .card-pad { padding: 20px; }

  .inj-row {
    display: flex; align-items: center; gap: 14px; padding: 13px 16px;
    border-radius: 14px; cursor: pointer; transition: background 0.18s;
    border: 1px solid transparent; user-select: none;
    position: relative; overflow: hidden;
  }
  .inj-row:hover { background: var(--teal-light); border-color: var(--teal-mid); }
  .inj-row.done { background: var(--teal-light); border-color: rgba(59,191,184,0.3); }
  .inj-ring {
    width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-size: 13px; font-weight: 900; transition: all 0.22s var(--ease);
    position: relative; z-index: 1; color: transparent;
  }
  .inj-ring.done {
    background: var(--teal); border-color: var(--teal); color: #fff;
    box-shadow: 0 2px 10px rgba(59,191,184,0.4);
    animation: checkBounce 0.35s var(--ease);
  }

  .prog-track { height: 4px; background: var(--teal-light); border-radius: 2px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 2px; transition: width 0.8s var(--ease); }

  .r-dot {
    width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--border2);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    font-size: 9px; font-weight: 700; color: var(--ink3);
    transition: all 0.14s; user-select: none;
  }
  .r-dot.on { color: #fff; border-color: transparent; }

  .bnav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: rgba(255,255,255,0.96); border-top: 1px solid var(--border);
    backdrop-filter: blur(16px); display: flex;
    padding: 6px 0 max(6px, env(safe-area-inset-bottom));
  }
  .nav-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 4px; background: none; border: none; cursor: pointer;
    color: var(--ink3); font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 9px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase;
    transition: color 0.18s;
  }
  .nav-btn.on { color: var(--teal); }
  .nav-btn .ni { font-size: 20px; line-height: 1.2; }

  .pill { display: inline-block; border-radius: 20px; padding: 3px 11px; font-size: 11px; font-weight: 700; }

  .pcrd { margin-bottom: 12px; }
  .pcrd-head { padding: 18px 20px 14px; border-bottom: 1px solid var(--border); }
  .pcrd-body { padding: 16px 20px; }
  .meta-chip { background: var(--bg); border-radius: 9px; padding: 8px 11px; }

  .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--ink3); }
`;

function RatingDots({value,onChange,color="#3BBFB8"}){
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
      {[1,2,3,4,5,6,7,8,9,10].map(n=>(
        <div key={n} className={`r-dot${n<=value?" on":""}`}
          style={n<=value?{background:color,borderColor:color}:{}}
          onClick={()=>onChange(n)}>{n}</div>
      ))}
    </div>
  );
}

function PCard({r,col,openInfo,setOpenInfo}){
  const info=PEPTIDE_INFO[r.peptide.name];
  const ev=EVIDENCE_TIERS[r.peptide.name];
  const open=openInfo[r.peptide.name];
  const sevStyle={
    avoid:{bg:"#FEF2F2",border:"#FCA5A5",color:"#DC2626"},
    caution:{bg:"#FFFBEB",border:"#FCD34D",color:"#D97706"},
    info:{bg:"#EFF6FF",border:"#93C5FD",color:"#2563EB"},
  };
  return(
    <div className="pcrd card">
      <div className="pcrd-head" style={{borderLeft:`4px solid ${col}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:col,boxShadow:`0 0 0 3px ${col}30`,flexShrink:0}}/>
              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:17,color:"var(--ink)",letterSpacing:"-0.2px"}}>{r.peptide.name}</span>
            </div>
            <div style={{color:"var(--ink3)",fontSize:11,fontWeight:500,paddingLeft:16,marginBottom:6}}>{r.peptide.aka}</div>
            {/* Evidence tier badge */}
            {ev&&(
              <div style={{paddingLeft:16,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{
                  display:"inline-flex",alignItems:"center",gap:4,
                  background:ev.bg,border:`1px solid ${ev.border}`,color:ev.color,
                  borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:"0.3px",
                  lineHeight:1.3
                }}>
                  {ev.tier==="FDA Approved"?"✓":ev.tier==="Clinical Trials"?"◉":ev.tier==="Limited Human"?"◎":ev.tier==="Speculative"?"⚠":"○"} {ev.label}
                </span>
                {ev.fdaFlag&&(
                  <span style={{
                    display:"inline-flex",alignItems:"center",gap:3,
                    background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",
                    borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:700,letterSpacing:"0.2px",
                    lineHeight:1.3
                  }}>
                    ⚑ FDA Flagged
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{background:col,borderRadius:12,padding:"8px 14px",textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:800,fontSize:22,color:"#fff",lineHeight:1}}>{r.dose}</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:10,fontWeight:600,marginTop:1}}>{r.peptide.unit}</div>
          </div>
        </div>
      </div>
      <div className="pcrd-body">
        {/* FDA / Evidence note */}
        {ev&&(
          <div style={{
            background:ev.fdaFlag?"#FEF2F2":ev.bg,
            border:`1px solid ${ev.fdaFlag?"#FECACA":ev.border}`,
            borderRadius:10,padding:"10px 13px",marginBottom:14,
            fontSize:11,lineHeight:1.6,color:ev.fdaFlag?"#7F1D1D":ev.color,fontWeight:500
          }}>
            {ev.fdaFlag&&<span style={{fontWeight:700,color:"#DC2626"}}>⚑ FDA Safety Notice: </span>}
            {!ev.fdaFlag&&<span style={{fontWeight:700,color:ev.color}}>ℹ Evidence: </span>}
            {ev.fdaNote}
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
          {[["Frequency",r.peptide.frequency,"2"],["Route",r.peptide.primaryRoute,"1"],["Timing",r.peptide.timing,"1"],["Cycle",r.peptide.cycleNote||(r.peptide.cycleOn?`${r.peptide.cycleOn}wk on / ${r.peptide.cycleOff}wk off`:"Ongoing"),"2"]].map(([l,v,span])=>(
            <div key={l} className="meta-chip" style={{gridColumn:`span ${span}`}}>
              <div className="lbl" style={{marginBottom:3}}>{l}</div>
              <div style={{color:"var(--ink)",fontSize:12,fontWeight:500,lineHeight:1.4}}>{v}</div>
            </div>
          ))}
        </div>
        {r.warnings?.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {r.warnings.map((w,i)=>{const s=sevStyle[w.severity];return(
              <div key={i} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:9,padding:"8px 12px",fontSize:11,color:s.color,display:"flex",gap:7,alignItems:"flex-start"}}>
                <span style={{flexShrink:0}}>{w.severity==="avoid"?"⛔":w.severity==="caution"?"⚠️":"ℹ️"}</span>
                <span><strong>{w.substance}:</strong> {w.note}</span>
              </div>
            );})}
          </div>
        )}
        {r.peptide.synergies?.length>0&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
            <span style={{color:"var(--ink3)",fontSize:11,fontWeight:600}}>Pairs with:</span>
            {r.peptide.synergies.map(s=>(
              <span key={s} style={{background:`${col}18`,color:col,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,border:`1px solid ${col}35`}}>{s}</span>
            ))}
          </div>
        )}
        {info&&(
          <>
            <button
              onClick={()=>setOpenInfo(p=>({...p,[r.peptide.name]:!open}))}
              style={{width:"100%",background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:"var(--ink2)",fontSize:12,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.18s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col;e.currentTarget.style.color=col;e.currentTarget.style.background=`${col}10`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--ink2)";e.currentTarget.style.background="var(--bg)";}}>
              <span>About {r.peptide.name}</span>
              <span style={{color:col,fontSize:15,display:"inline-block",transform:open?"rotate(180deg)":"none",transition:"transform 0.22s var(--ease)"}}>▾</span>
            </button>
            {open&&(
              <div style={{marginTop:10,animation:"up 0.25s var(--ease) both"}}>
                <p style={{color:"var(--ink2)",fontSize:12,lineHeight:1.7,margin:"0 0 10px",padding:"12px 14px",background:`${col}0D`,borderRadius:10,borderLeft:`3px solid ${col}`}}>{info.desc}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:"#F0FFF8",border:"1px solid #A7F3D0",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{color:"#059669",fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>✓ Upsides</div>
                    {info.upsides.map((u,i)=>(
                      <div key={i} style={{display:"flex",gap:7,marginBottom:6}}>
                        <span style={{color:"#059669",flexShrink:0,fontSize:11}}>+</span>
                        <span style={{color:"#065F46",fontSize:11,lineHeight:1.5}}>{u}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"#FFF8F8",border:"1px solid #FECACA",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{color:"#DC2626",fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>⚠ Risks</div>
                    {info.risks.map((r2,i)=>(
                      <div key={i} style={{display:"flex",gap:7,marginBottom:6}}>
                        <span style={{color:"#DC2626",flexShrink:0,fontSize:11}}>−</span>
                        <span style={{color:"#7F1D1D",fontSize:11,lineHeight:1.5}}>{r2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────
// ── INJECTION SITES ──────────────────────────────────────────────
const ROUTE_SITES = {
  "SubQ": [
    {id:"abd-ul", label:"Upper Left Abdomen",  short:"Abd UL", x:84,  y:148, desc:"2 inches left of navel, upper zone"},
    {id:"abd-ur", label:"Upper Right Abdomen", short:"Abd UR", x:116, y:148, desc:"2 inches right of navel, upper zone"},
    {id:"abd-ll", label:"Lower Left Abdomen",  short:"Abd LL", x:84,  y:168, desc:"2 inches left of navel, lower zone"},
    {id:"abd-lr", label:"Lower Right Abdomen", short:"Abd LR", x:116, y:168, desc:"2 inches right of navel, lower zone"},
    {id:"flank-l", label:"Left Flank",         short:"Flank L", x:60,  y:158, desc:"Left love handle / lateral hip"},
    {id:"flank-r", label:"Right Flank",        short:"Flank R", x:140, y:158, desc:"Right love handle / lateral hip"},
    {id:"thigh-l", label:"Left Outer Thigh",   short:"Thigh L", x:76,  y:255, desc:"Outer middle of left thigh"},
    {id:"thigh-r", label:"Right Outer Thigh",  short:"Thigh R", x:124, y:255, desc:"Outer middle of right thigh"},
  ],
  "IM": [
    {id:"delt-l",  label:"Left Deltoid",       short:"Delt L",  x:44,  y:118, desc:"Outer upper arm, 3 fingers below shoulder"},
    {id:"delt-r",  label:"Right Deltoid",      short:"Delt R",  x:156, y:118, desc:"Outer upper arm, 3 fingers below shoulder"},
    {id:"glute-l", label:"Left Glute",         short:"Glute L", x:78,  y:215, desc:"Upper outer quadrant of left buttock"},
    {id:"glute-r", label:"Right Glute",        short:"Glute R", x:122, y:215, desc:"Upper outer quadrant of right buttock"},
    {id:"lat-l",   label:"Left Lateral Thigh", short:"Lat L",   x:72,  y:260, desc:"Outer middle of left thigh, relaxed"},
    {id:"lat-r",   label:"Right Lateral Thigh",short:"Lat R",   x:128, y:260, desc:"Outer middle of right thigh, relaxed"},
  ],
  "SubQ or IM": [ // use SubQ sites by default
    {id:"abd-ul", label:"Upper Left Abdomen",  short:"Abd UL", x:84,  y:148, desc:"2 inches left of navel, upper zone"},
    {id:"abd-ur", label:"Upper Right Abdomen", short:"Abd UR", x:116, y:148, desc:"2 inches right of navel, upper zone"},
    {id:"abd-ll", label:"Lower Left Abdomen",  short:"Abd LL", x:84,  y:168, desc:"2 inches left of navel, lower zone"},
    {id:"abd-lr", label:"Lower Right Abdomen", short:"Abd LR", x:116, y:168, desc:"2 inches right of navel, lower zone"},
    {id:"thigh-l", label:"Left Outer Thigh",   short:"Thigh L", x:76,  y:255, desc:"Outer middle of left thigh"},
    {id:"thigh-r", label:"Right Outer Thigh",  short:"Thigh R", x:124, y:255, desc:"Outer middle of right thigh"},
    {id:"delt-l",  label:"Left Deltoid",       short:"Delt L",  x:44,  y:118, desc:"Outer upper arm — if going IM"},
    {id:"delt-r",  label:"Right Deltoid",      short:"Delt R",  x:156, y:118, desc:"Outer upper arm — if going IM"},
  ],
};

const INJECT_STEPS = {
  "SubQ": [
    {n:1, icon:"🧼", title:"Wash hands", body:"Wash thoroughly with soap and water for 20 seconds. Dry completely."},
    {n:2, icon:"🧴", title:"Prep the site", body:"Swab the injection site with an alcohol wipe. Wait 30 seconds for it to fully dry."},
    {n:3, icon:"💉", title:"Pinch & angle", body:"Pinch 1–2 inches of skin firmly. Insert the needle at a 45° angle (90° if you have more body fat at the site)."},
    {n:4, icon:"⏱️", title:"Inject slowly", body:"Push the plunger steadily over 5–10 seconds. Do not rush — slow delivery reduces discomfort."},
    {n:5, icon:"🩹", title:"Remove & press", body:"Pull the needle out at the same angle it entered. Apply gentle pressure with a cotton ball. Do not rub."},
    {n:6, icon:"🗑️", title:"Dispose safely", body:"Cap the needle immediately and place in a sharps container. Never reuse needles."},
  ],
  "IM": [
    {n:1, icon:"🧼", title:"Wash hands", body:"Wash thoroughly with soap and water for 20 seconds. Dry completely."},
    {n:2, icon:"🧴", title:"Prep the site", body:"Swab the muscle site with an alcohol wipe. Wait 30 seconds to fully dry."},
    {n:3, icon:"💪", title:"Relax the muscle", body:"Completely relax the target muscle. Tensing it makes injection more painful and harder."},
    {n:4, icon:"💉", title:"Insert at 90°", body:"Insert the needle in one smooth, confident motion at 90°. Hesitation causes more discomfort."},
    {n:5, icon:"🔍", title:"Aspirate", body:"Pull the plunger back slightly. If no blood appears, proceed. If you see blood, withdraw and choose a new site."},
    {n:6, icon:"⏱️", title:"Inject slowly", body:"Depress the plunger slowly over 10 seconds. Slow delivery into muscle reduces soreness."},
    {n:7, icon:"🩹", title:"Remove & press", body:"Withdraw smoothly. Apply firm pressure for 30 seconds. Gently massage to disperse the solution."},
    {n:8, icon:"🗑️", title:"Dispose safely", body:"Cap the needle and dispose in a sharps container immediately."},
  ],
  "Nasal spray": [
    {n:1, icon:"🤧", title:"Clear passages", body:"Blow your nose gently to clear any congestion. Breathe normally."},
    {n:2, icon:"💉", title:"Prime if new", body:"If first use, pump the spray 3–4 times into the air until an even mist appears."},
    {n:3, icon:"👃", title:"Position", body:"Tilt your head slightly forward. Insert the tip gently into one nostril, aiming slightly outward (away from the septum)."},
    {n:4, icon:"🫁", title:"Spray & breathe", body:"Press the pump firmly once while breathing in slowly through your nose. Breathe out through your mouth."},
    {n:5, icon:"🔄", title:"Other nostril", body:"Repeat for the second nostril if your dose calls for it. Alternate nostrils each session."},
    {n:6, icon:"⏸️", title:"Don't blow", body:"Avoid blowing your nose or sneezing for at least 15 minutes to allow absorption."},
  ],
  "Oral": [
    {n:1, icon:"⏰", title:"Timing matters", body:"Take MK-677 at the same time each night at bedtime to ride the natural overnight GH pulse."},
    {n:2, icon:"💊", title:"Dose", body:"Swallow the capsule or measure liquid dose with the provided syringe. No injection required."},
    {n:3, icon:"🥛", title:"With or without food", body:"Can be taken with or without food. Some users prefer a small snack to reduce nausea in early weeks."},
    {n:4, icon:"📝", title:"Log it", body:"Mark as taken so your cycle tracker stays accurate."},
  ],
};

function getRouteKey(route) {
  if (!route) return "SubQ";
  if (route.includes("Nasal")) return "Nasal spray";
  if (route.includes("Oral")) return "Oral";
  if (route.includes("IM") && !route.includes("SubQ")) return "IM";
  return route.includes("or IM") ? "SubQ or IM" : "SubQ";
}

function getNextSite(routeKey, history=[]) {
  const sites = ROUTE_SITES[routeKey];
  if (!sites || !sites.length) return null;
  // find site not used recently
  const recent = history.slice(-sites.length);
  const unused = sites.find(s => !recent.includes(s.id));
  return unused || sites[0];
}

// ── INJECTION MODAL ───────────────────────────────────────────────
function InjectionModal({ r, col, history, onConfirm, onClose }) {
  const routeKey = getRouteKey(r.peptide.primaryRoute);
  const sites = ROUTE_SITES[routeKey] || [];
  const steps = INJECT_STEPS[routeKey] || INJECT_STEPS["SubQ"];
  const recommended = getNextSite(routeKey, history);
  const [selectedSite, setSelectedSite] = useState(recommended?.id || null);
  const [phase, setPhase] = useState("site"); // "site" | "guide"
  const [currentStep, setCurrentStep] = useState(0);
  const selectedObj = sites.find(s => s.id === selectedSite);
  const isOral = routeKey === "Oral";
  const isNasal = routeKey === "Nasal spray";
  const hasSites = sites.length > 0;

  const siteCounts = {};
  history.forEach(s => { siteCounts[s] = (siteCounts[s] || 0) + 1; });

  const handleProceed = () => {
    if (isOral || isNasal) { setPhase("guide"); setCurrentStep(0); }
    else if (!hasSites) { onConfirm(null); }
    else { setPhase("guide"); setCurrentStep(0); }
  };

  const handleDone = () => onConfirm(selectedSite);

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(10,25,25,0.5)",backdropFilter:"blur(6px)"}}/>
      <div
        style={{position:"relative",background:"var(--white)",borderRadius:"28px 28px 0 0",maxHeight:"94vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both"}}
        onClick={e=>e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Drag handle */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:12,paddingBottom:4,flexShrink:0}}>
          <div style={{width:36,height:4,borderRadius:2,background:"var(--border2)"}}/>
        </div>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px 14px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {phase==="guide"&&hasSites&&!isOral&&!isNasal&&(
              <button onClick={()=>setPhase("site")} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink2)",fontSize:14,marginRight:2}}>←</button>
            )}
            <div style={{width:10,height:10,borderRadius:"50%",background:col,boxShadow:`0 0 0 3px ${col}25`}}/>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"var(--ink)",lineHeight:1}}>{r.peptide.name}</div>
              <div style={{color:"var(--ink3)",fontSize:11,marginTop:2}}>{r.dose} {r.peptide.unit} · {r.peptide.primaryRoute}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"var(--bg)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:16,color:"var(--ink3)",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* ── PHASE 1: SITE SELECTION ── */}
        {phase==="site"&&hasSites&&(
          <div style={{overflowY:"auto",flex:1}}>
            {/* Recommended banner */}
            {recommended&&(
              <div style={{margin:"16px 20px 0",padding:"10px 14px",background:"var(--teal-light)",border:"1px solid var(--teal-mid)",borderRadius:12,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>📍</span>
                <div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--teal-dark)"}}>Recommended next</div>
                  <div style={{color:"var(--teal)",fontSize:12,fontWeight:600}}>{recommended.label}</div>
                </div>
                <button onClick={()=>setSelectedSite(recommended.id)} style={{marginLeft:"auto",background:"var(--teal)",color:"#fff",border:"none",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>Select</button>
              </div>
            )}

            {/* Body diagram — centered, bigger */}
            <div style={{display:"flex",justifyContent:"center",padding:"16px 20px 8px"}}>
              <svg viewBox="0 0 200 330" style={{width:"100%",maxWidth:220,display:"block"}}>
                {/* Silhouette */}
                <ellipse cx="100" cy="36" rx="26" ry="30" fill="#EAF5F3"/>
                <rect x="88" y="63" width="24" height="14" rx="7" fill="#EAF5F3"/>
                <rect x="56" y="74" width="88" height="106" rx="20" fill="#EAF5F3"/>
                <rect x="34" y="78" width="26" height="86" rx="13" fill="#E0EEE9"/>
                <rect x="140" y="78" width="26" height="86" rx="13" fill="#E0EEE9"/>
                <rect x="58" y="176" width="84" height="26" rx="12" fill="#E5F1ED"/>
                <rect x="60" y="198" width="34" height="124" rx="15" fill="#EAF5F3"/>
                <rect x="106" y="198" width="34" height="124" rx="15" fill="#EAF5F3"/>
                {/* Outlines */}
                <ellipse cx="100" cy="36" rx="26" ry="30" fill="none" stroke="#C5DDD6" strokeWidth="1.5"/>
                <rect x="56" y="74" width="88" height="106" rx="20" fill="none" stroke="#C5DDD6" strokeWidth="1.5"/>
                <rect x="34" y="78" width="26" height="86" rx="13" fill="none" stroke="#C5DDD6" strokeWidth="1.5"/>
                <rect x="140" y="78" width="26" height="86" rx="13" fill="none" stroke="#C5DDD6" strokeWidth="1.5"/>
                <rect x="60" y="198" width="34" height="124" rx="15" fill="none" stroke="#C5DDD6" strokeWidth="1.5"/>
                <rect x="106" y="198" width="34" height="124" rx="15" fill="none" stroke="#C5DDD6" strokeWidth="1.5"/>
                {/* Navel */}
                <circle cx="100" cy="156" r="3.5" fill="#BAD4CC"/>
                {/* L / R labels */}
                <text x="20" y="122" fontSize="9" fill="#A8C8C0" textAnchor="middle" fontWeight="700">L</text>
                <text x="180" y="122" fontSize="9" fill="#A8C8C0" textAnchor="middle" fontWeight="700">R</text>

                {sites.map(site=>{
                  const isSel = selectedSite===site.id;
                  const isRec = recommended?.id===site.id;
                  const used = siteCounts[site.id]||0;
                  return(
                    <g key={site.id} onClick={()=>setSelectedSite(site.id)} style={{cursor:"pointer"}}>
                      {/* hit area */}
                      <circle cx={site.x} cy={site.y} r={16} fill="transparent"/>
                      {/* glow ring for selected */}
                      {isSel&&<circle cx={site.x} cy={site.y} r={17} fill={`${col}18`} stroke={col} strokeWidth="1.5" strokeDasharray="4 3"/>}
                      {/* main circle */}
                      <circle cx={site.x} cy={site.y} r={12}
                        fill={isSel?col:isRec?"#fff":"#fff"}
                        stroke={isSel?col:isRec?col:"#C5DDD6"}
                        strokeWidth={isSel?2:isRec?2:1.5}
                        style={{transition:"all 0.2s"}}
                      />
                      {/* inner dot for rec */}
                      {isRec&&!isSel&&<circle cx={site.x} cy={site.y} r={4} fill={col} opacity="0.7"/>}
                      {/* check */}
                      {isSel&&<text x={site.x} y={site.y+4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="900">✓</text>}
                      {/* use count */}
                      {!isSel&&used>0&&<text x={site.x} y={site.y+4} fontSize="8" fill={isRec?col:"#9ABDB5"} textAnchor="middle" fontWeight="700">{used}</text>}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected site detail */}
            {selectedObj&&(
              <div style={{margin:"0 20px 12px",padding:"12px 16px",background:`${col}0C`,border:`1.5px solid ${col}28`,borderRadius:14,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📍</div>
                <div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,color:"var(--ink)"}}>{selectedObj.label}</div>
                  <div style={{color:"var(--ink2)",fontSize:12,marginTop:2}}>{selectedObj.desc}</div>
                </div>
              </div>
            )}

            {/* Site chips - scrollable row */}
            <div style={{padding:"0 20px",marginBottom:4}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--ink3)",letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>All sites</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {sites.map(site=>{
                  const isSel=selectedSite===site.id;
                  const isRec=recommended?.id===site.id;
                  const used=siteCounts[site.id]||0;
                  return(
                    <button key={site.id} onClick={()=>setSelectedSite(site.id)}
                      style={{padding:"8px 14px",borderRadius:22,border:`1.5px solid ${isSel?col:isRec?"var(--teal-mid)":"var(--border)"}`,background:isSel?col:isRec?"var(--teal-light)":"var(--white)",color:isSel?"#fff":isRec?"var(--teal-dark)":"var(--ink2)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.16s",display:"flex",alignItems:"center",gap:5}}>
                      {site.short}
                      {used>0&&<span style={{opacity:0.7,fontSize:10}}>·{used}×</span>}
                      {isRec&&!isSel&&<span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.3px"}}>↑</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div style={{display:"flex",gap:16,padding:"10px 20px 20px",flexWrap:"wrap"}}>
              {[["",col,"Selected"],["·","var(--teal)","Recommended"],["1","#9ABDB5","Used before"]].map(([sym,c,label])=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${c}`,background:sym===""?c:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {sym==="·"&&<div style={{width:6,height:6,borderRadius:"50%",background:c}}/>}
                    {sym==="1"&&<span style={{fontSize:8,fontWeight:700,color:c}}>1</span>}
                  </div>
                  <span style={{fontSize:11,color:"var(--ink3)",fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{padding:"0 20px 28px"}}>
              <button className="btn-main" style={{width:"100%",fontSize:15,padding:"15px"}} onClick={handleProceed}>
                How to inject here →
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE 1 for non-injectable routes ── */}
        {phase==="site"&&(isOral||isNasal)&&(
          <div style={{overflowY:"auto",flex:1,padding:20}}>
            <div style={{textAlign:"center",padding:"16px 0 24px"}}>
              <div style={{fontSize:52,marginBottom:12}}>{isOral?"💊":"👃"}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:"var(--ink)",marginBottom:8}}>{isOral?"Oral — no injection needed":"Nasal spray"}</div>
              <div style={{color:"var(--ink2)",fontSize:14,lineHeight:1.65}}>{isOral?"MK-677 is taken as a pill at bedtime. Follow the steps below to time it correctly.":"Administer via nasal spray. Follow the steps for best absorption."}</div>
            </div>
            <button className="btn-main" style={{width:"100%",fontSize:15,padding:"15px"}} onClick={handleProceed}>See instructions →</button>
          </div>
        )}

        {/* ── PHASE 2: STEP-BY-STEP GUIDE ── */}
        {phase==="guide"&&(
          <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
            {/* Progress */}
            <div style={{padding:"12px 20px 0",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--ink)"}}>Step {currentStep+1} of {steps.length}</div>
                <div style={{fontSize:12,color:"var(--ink3)",fontWeight:600}}>{Math.round(((currentStep+1)/steps.length)*100)}%</div>
              </div>
              <div style={{height:4,background:"var(--teal-light)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:col,borderRadius:2,width:`${((currentStep+1)/steps.length)*100}%`,transition:"width 0.35s cubic-bezier(0.22,1,0.36,1)"}}/>
              </div>
              {/* Step dots */}
              <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:10}}>
                {steps.map((_,i)=>(
                  <div key={i} onClick={()=>setCurrentStep(i)} style={{width:i===currentStep?20:7,height:7,borderRadius:4,background:i<=currentStep?col:"var(--border2)",transition:"all 0.25s",cursor:"pointer"}}/>
                ))}
              </div>
            </div>

            {/* Current step — big and readable */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
              <div style={{background:"var(--bg)",borderRadius:20,padding:"24px 20px",textAlign:"center",marginBottom:16,minHeight:180,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:56,marginBottom:16,lineHeight:1}}>{steps[currentStep].icon}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:"var(--ink)",marginBottom:10,letterSpacing:"-0.3px"}}>{steps[currentStep].title}</div>
                <div style={{color:"var(--ink2)",fontSize:15,lineHeight:1.7,maxWidth:320}}>{steps[currentStep].body}</div>
              </div>

              {/* Site reminder if applicable */}
              {selectedObj&&(
                <div style={{padding:"10px 14px",background:`${col}0C`,border:`1px solid ${col}25`,borderRadius:12,display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <span style={{fontSize:16}}>📍</span>
                  <span style={{fontSize:13,color:"var(--ink2)",fontWeight:500}}>Site: <strong style={{color:"var(--ink)"}}>{selectedObj.label}</strong> — {selectedObj.desc}</span>
                </div>
              )}

              {/* Mini step list for context */}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {steps.map((s,i)=>(
                  <div key={i} onClick={()=>setCurrentStep(i)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:i===currentStep?`${col}0E`:"transparent",border:`1px solid ${i===currentStep?col+"28":"transparent"}`,cursor:"pointer",transition:"all 0.15s"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:i<currentStep?col:i===currentStep?col:"var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:i<currentStep?11:9,fontWeight:800,color:i<=currentStep?"#fff":"var(--ink3)",transition:"background 0.2s"}}>
                      {i<currentStep?"✓":i+1}
                    </div>
                    <span style={{fontSize:13,fontWeight:i===currentStep?700:500,color:i===currentStep?"var(--ink)":i<currentStep?"var(--teal)":"var(--ink3)",transition:"color 0.2s"}}>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{padding:"12px 20px 28px",flexShrink:0,borderTop:"1px solid var(--border)",background:"var(--white)"}}>
              {currentStep<steps.length-1?(
                <div style={{display:"flex",gap:10}}>
                  {currentStep>0&&(
                    <button className="btn-outline" style={{flex:"none",padding:"14px 20px"}} onClick={()=>setCurrentStep(c=>c-1)}>← Back</button>
                  )}
                  <button className="btn-main" style={{flex:1,fontSize:15,padding:"14px"}} onClick={()=>setCurrentStep(c=>c+1)}>
                    Next step →
                  </button>
                </div>
              ):(
                <button className="btn-main" style={{width:"100%",fontSize:15,padding:"15px",background:col,boxShadow:`0 4px 16px ${col}40`}} onClick={handleDone}>
                  {isOral?"✓ Marked as taken":isNasal?"✓ Marked as used":"✓ Confirm injection logged"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PeptideRX(){
  const[loaded,setLoaded]=useState(false);
  const[view,setView]=useState("landing");
  const[tab,setTab]=useState("home");
  const[protocol,setProtocol]=useState(null);
  const[injLogs,setInjLogs]=useState({});
  const[checkIns,setCheckIns]=useState([]);
  const[pinModal,setPinModal]=useState(null);
  const[pinHistory,setPinHistory]=useState({});
  const[step,setStep]=useState(1);
  const[goals,setGoals]=useState([]);
  const[age,setAge]=useState("");
  const[sex,setSex]=useState("");
  const[weight,setWeight]=useState("");
  const[wu,setWu]=useState("lbs");
  const[bf,setBf]=useState("");
  const[conds,setConds]=useState([]);
  const[subs,setSubs]=useState([]);
  const[height,setHeight]=useState("");
  const[heightFt,setHeightFt]=useState("");
  const[heightIn,setHeightIn]=useState("");
  const[avoidList,setAvoidList]=useState([]);
  const[exp,setExp]=useState("");
  const[fc,setFc]=useState(null);
  const[protoSize,setProtoSize]=useState(null);
  const[builtProto,setBuiltProto]=useState(null);
  const[openInfo,setOpenInfo]=useState({});
  const[conflictOpen,setConflictOpen]=useState({}); // which conflict cards are expanded
  const[replacementPicks,setReplacementPicks]=useState({}); // {removedName: replacementRecord or null}
  const[ciW,setCiW]=useState("");
  const[ciBf,setCiBf]=useState("");
  const[ciE,setCiE]=useState(7);
  const[ciM,setCiM]=useState(7);
  const[ciN,setCiN]=useState("");
  const[ciDone,setCiDone]=useState(false);
  const[ciPhotos,setCiPhotos]=useState({front:null,side:null,back:null});
  const[viewingCheckIn,setViewingCheckIn]=useState(null);
  const[lightboxPhoto,setLightboxPhoto]=useState(null);

  useEffect(()=>{(async()=>{
    const p=await sGet("prx-p");const l=await sGet("prx-l");const c=await sGet("prx-c");const ph=await sGet("prx-ph");
    if(p){setProtocol(p);setInjLogs(l||{});setCheckIns(c||[]);setPinHistory(ph||{});setView("app");}
    setLoaded(true);
  })();},[]);

  const kg=wu==="lbs"?parseFloat(weight||0)*0.4536:parseFloat(weight||0);
  const ok=[goals.length>0,!!(age&&sex&&weight&&bf),conds.length>0,subs.length>0,true,!!(exp&&fc!==null&&protoSize!==null)];
  const todayStr=new Date().toISOString().split("T")[0];
  const tDow=todayDow();
  const tLogs=injLogs[todayStr]||{};
  const cWeek=protocol?cycleWk(protocol.startedAt):1;
  const cm=protocol?bCM(protocol.recommended):{};
  const sched=protocol?bSched(protocol.recommended):Array(7).fill([]);
  const todayP=protocol?.recommended.filter(r=>r.peptide.scheduleDays?.includes(tDow))||[];
  const doneC=todayP.filter(r=>tLogs[r.peptide.name]?.done||tLogs[r.peptide.name]===true).length;
  const checkedIn=checkIns.some(c=>new Date(c.date)>=monStart());
  const now=new Date();
  const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAY_F=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayLbl=`${DAY_F[now.getDay()]}, ${MON[now.getMonth()]} ${now.getDate()}`;
  const SL=["Goals","Profile","Conditions","Substances","Avoid","Experience","Review"];

  const togGoal=id=>setGoals(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const togC=c=>{if(c==="None of the above"){setConds(["None of the above"]);return;}setConds(p=>{const f=p.filter(x=>x!=="None of the above");return f.includes(c)?f.filter(x=>x!==c):[...f,c];});};
  const togS=s=>{if(s==="None"){setSubs(["None"]);return;}setSubs(p=>{const f=p.filter(x=>x!=="None");return f.includes(s)?f.filter(x=>x!==s):[...f,s];});};
  const generate=()=>{const profile={age:parseInt(age),sex,weightKg:kg,bodyFatPct:parseFloat(bf),experience:exp,firstCycle:fc,conditions:conds,substances:subs};setBuiltProto({...buildProtocol(goals,profile,protoSize,avoidList),profile,goals:[...goals],protoSize,avoidList:[...avoidList]});setConflictOpen({});setReplacementPicks({});setStep(8);};
  const activate=()=>{
    // Merge any picked replacements into recommended
    const extras=Object.values(replacementPicks).filter(Boolean);
    const finalRecs=[...builtProto.recommended,...extras];
    const data={...builtProto,recommended:finalRecs,startedAt:new Date().toISOString()};
    setProtocol(data);setInjLogs({});setCheckIns([]);setView("app");setTab("home");sSet("prx-p",data);sSet("prx-l",{});sSet("prx-c",[]);
  };
  const rebuild=()=>{setStep(1);setGoals([]);setAge("");setSex("");setWeight("");setBf("");setHeight("");setHeightFt("");setHeightIn("");setConds([]);setSubs([]);setAvoidList([]);setExp("");setFc(null);setProtoSize(null);setBuiltProto(null);setPinHistory({});setConflictOpen({});setReplacementPicks({});setView("building");sSet("prx-ph",{});};
  const openInjModal=(r,col)=>{
    const log=tLogs[r.peptide.name];
    const done=log?.done||log===true;
    if(done){
      const u={...injLogs,[todayStr]:{...tLogs,[r.peptide.name]:false}};
      setInjLogs(u);sSet("prx-l",u);
    } else {
      setPinModal({r,col});
    }
  };
  const confirmInj=(siteId)=>{
    if(!pinModal)return;
    const now=new Date();
    const timeStr=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const name=pinModal.r.peptide.name;
    const u={...injLogs,[todayStr]:{...tLogs,[name]:{done:true,time:timeStr,site:siteId}}};
    setInjLogs(u);sSet("prx-l",u);
    if(siteId){
      const ph={...pinHistory,[name]:[...(pinHistory[name]||[]),siteId].slice(-20)};
      setPinHistory(ph);sSet("prx-ph",ph);
    }
    setPinModal(null);
  };
  const saveCI=()=>{const e={date:new Date().toISOString(),week:cWeek,weight:ciW,bf:ciBf,energy:ciE,mood:ciM,notes:ciN,photos:ciPhotos};const u=[e,...checkIns];setCheckIns(u);sSet("prx-c",u);setCiW("");setCiBf("");setCiE(7);setCiM(7);setCiN("");setCiPhotos({front:null,side:null,back:null});setCiDone(true);setTimeout(()=>setCiDone(false),3000);};
  const handlePhotoCapture=async(angle,e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      const compressed=await compressImage(file);
      setCiPhotos(p=>({...p,[angle]:compressed}));
    }catch(err){console.error("Photo error:",err);}
    e.target.value="";
  };
  const removePhoto=(angle)=>setCiPhotos(p=>({...p,[angle]:null}));

  const P=view==="app"?"24px 18px 94px":"28px 18px 48px";

  if(!loaded)return(<div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div style={{width:36,height:36,borderRadius:"50%",border:"3px solid var(--teal-mid)",borderTopColor:"var(--teal)",animation:"spin 0.7s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <style>{CSS}</style>

      {/* ══ LOGIN / SIGNUP ══ */}
      {/* ══ LANDING ══ */}
      {view==="landing"&&(
        <div className="fade-up" style={{maxWidth:520,margin:"0 auto",padding:"40px 20px 48px"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:14,background:"var(--teal)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 14px rgba(59,191,184,0.3)"}}>🧬</div>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,letterSpacing:"-0.5px"}}>Peptide<span style={{color:"var(--teal)"}}>RX</span></div>
                <div style={{color:"var(--ink3)",fontSize:11,fontWeight:500}}>Protocol Builder</div>
              </div>
            </div>
          </div>

          {/* Feature row — above the hero */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:24}}>
            {[
              {icon:"⚡",t:"Personalized",color:"#3BBFB8"},
              {icon:"🛡️",t:"Safety Checks",color:"#8B5CF6"},
              {icon:"📅",t:"Injection Tracker",color:"#E97316"},
              {icon:"📊",t:"Weekly Progress",color:"#EC4899"},
            ].map(c=>(
              <div key={c.t} style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:14,padding:"14px 10px",textAlign:"center",transition:"transform 0.2s,box-shadow 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 6px 20px ${c.color}18`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{fontSize:24,marginBottom:6,lineHeight:1}}>{c.icon}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:11,color:"var(--ink)",letterSpacing:"-0.1px"}}>{c.t}</div>
              </div>
            ))}
          </div>

          {/* Hero — big centered CTA */}
          <div style={{background:"linear-gradient(145deg,#3BBFB8 0%,#228F89 100%)",borderRadius:28,padding:"44px 32px 48px",textAlign:"center",position:"relative",overflow:"hidden",marginBottom:20}}>
            <div style={{position:"absolute",left:-40,top:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.08)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",right:-30,bottom:-50,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.06)",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:12}}>Evidence-based · Dose-personalized</div>
              <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:34,color:"#fff",margin:"0 0 14px",letterSpacing:"-1px",lineHeight:1.1}}>Build your<br/>peptide protocol</h1>
              <p style={{color:"rgba(255,255,255,0.8)",fontSize:14,lineHeight:1.7,margin:"0 auto 28px",maxWidth:340}}>18 peptides. Doses calibrated to your age, weight, body fat, sex, and experience level. FDA safety data on every compound.</p>
              <button className="btn-main" style={{background:"#fff",color:"var(--teal-dark)",boxShadow:"0 6px 24px rgba(0,0,0,0.2)",fontSize:16,padding:"16px 40px",borderRadius:16,letterSpacing:"-0.2px"}} onClick={()=>setView("building")}>
                Start building →
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
            {[
              {n:"18",l:"Peptides",sub:"Full dosing data"},
              {n:"5",l:"Evidence Tiers",sub:"FDA to speculative"},
              {n:"13",l:"FDA Flagged",sub:"Safety warnings shown"},
            ].map(s=>(
              <div key={s.l} style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:16,padding:"16px 12px",textAlign:"center"}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:28,color:"var(--teal)",lineHeight:1,letterSpacing:"-1px"}}>{s.n}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:12,color:"var(--ink)",marginTop:4}}>{s.l}</div>
                <div style={{color:"var(--ink3)",fontSize:10,marginTop:2}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Chip features */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:16}}>
            {["Dose Engine","BF% Adjust","Interaction Check","Site Rotation","Cycle Timer","Progress Charts"].map(f=>(
              <span key={f} style={{display:"flex",alignItems:"center",gap:4,background:"var(--white)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 11px",fontSize:11,fontWeight:600,color:"var(--ink2)"}}>
                <span style={{color:"var(--teal)",fontSize:11}}>✓</span>{f}
              </span>
            ))}
          </div>

          <p style={{textAlign:"center",color:"var(--ink3)",fontSize:10,letterSpacing:"0.5px",textTransform:"uppercase",marginTop:16}}>Research & Educational Use Only — Not Medical Advice — Most Peptides Are FDA-Flagged</p>
        </div>
      )}

      {/* ══ BUILDER 1–6 ══ */}
      {view==="building"&&step<=7&&(
        <div className="fade-up" style={{maxWidth:640,margin:"0 auto",padding:P}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:26}}>
            <button className="btn-outline" style={{padding:"8px 14px",fontSize:12,flexShrink:0}} onClick={()=>step===1?setView(protocol?"app":"landing"):setStep(s=>s-1)}>← Back</button>
            <div style={{flex:1,height:4,background:"var(--teal-light)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",background:"var(--teal)",borderRadius:2,width:`${((step-1)/6)*100}%`,transition:"width 0.4s var(--ease)"}}/>
            </div>
            <div style={{color:"var(--ink3)",fontSize:12,fontWeight:700,flexShrink:0}}>{SL[step-1]}</div>
          </div>

          {step===1&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,color:"var(--ink)",margin:"0 0 6px",letterSpacing:"-0.3px"}}>What are your goals?</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:20}}>Select all that apply — peptides are ranked by relevance.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:28}}>
              {ALL_GOALS.map(g=>(
                <div key={g.id} className={`goal-tile${goals.includes(g.id)?" on":""}`} onClick={()=>togGoal(g.id)}>
                  <div style={{fontSize:24,marginBottom:7}}>{g.icon}</div>
                  <div className="g-label" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:12,color:"var(--ink2)",transition:"color 0.15s"}}>{g.label}</div>
                </div>
              ))}
            </div>
            <button className="btn-main" style={{width:"100%"}} disabled={!ok[0]} onClick={()=>setStep(2)}>Continue →</button>
          </div>)}

          {step===2&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,color:"var(--ink)",margin:"0 0 6px",letterSpacing:"-0.3px"}}>Your profile</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:22}}>Every field adjusts your personalized doses.</p>
            <div style={{display:"flex",flexDirection:"column",gap:18,marginBottom:28}}>
              <div><div className="lbl" style={{marginBottom:8}}>Age</div><input type="number" placeholder="e.g. 34" value={age} min={18} max={100} onChange={e=>setAge(e.target.value)}/></div>
              <div>
                <div className="lbl" style={{marginBottom:8}}>Biological Sex</div>
                <div style={{display:"flex",gap:8}}>{["Male","Female"].map(s=><button key={s} className={`seg-btn${sex===s?" on":""}`} onClick={()=>setSex(s)}>{s}</button>)}</div>
              </div>
              <div>
                <div className="lbl" style={{marginBottom:8}}>Body Weight</div>
                <div style={{display:"flex",gap:8}}>
                  <input type="number" placeholder="e.g. 185" value={weight} onChange={e=>setWeight(e.target.value)} style={{flex:1}}/>
                  {["lbs","kg"].map(u=><button key={u} className={`seg-btn${wu===u?" on":""}`} style={{padding:"0 18px",flex:"none"}} onClick={()=>setWu(u)}>{u}</button>)}
                </div>
                {weight&&<div style={{color:"var(--teal)",fontSize:11,fontWeight:700,marginTop:6}}>≈ {Math.round(kg)} kg</div>}
              </div>
              <div>
                <div className="lbl" style={{marginBottom:8}}>Height</div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,position:"relative"}}>
                    <input type="number" placeholder="5" value={heightFt} min={1} max={8} onChange={e=>setHeightFt(e.target.value)} style={{paddingRight:32}}/>
                    <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"var(--ink3)",fontSize:13,fontWeight:700,pointerEvents:"none"}}>ft</span>
                  </div>
                  <div style={{flex:1,position:"relative"}}>
                    <input type="number" placeholder="10" value={heightIn} min={0} max={11.9} step="0.1" onChange={e=>setHeightIn(e.target.value)} style={{paddingRight:32}}/>
                    <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"var(--ink3)",fontSize:13,fontWeight:700,pointerEvents:"none"}}>in</span>
                  </div>
                </div>
                {heightFt&&<div style={{color:"var(--ink3)",fontSize:11,marginTop:6}}>≈ {Math.round((parseFloat(heightFt||0)*12+parseFloat(heightIn||0))*2.54)} cm</div>}
              </div>
              <div>
                <div className="lbl" style={{marginBottom:8}}>Body Fat %</div>
                <input type="number" placeholder="e.g. 18" value={bf} min={3} max={60} onChange={e=>setBf(e.target.value)}/>
                <div style={{color:"var(--ink3)",fontSize:11,marginTop:6}}>GH peptides dose ↓ above {sex==="Female"?"35":"25"}% BF. Fat-loss peptides dose ↑.</div>
              </div>
            </div>
            <button className="btn-main" style={{width:"100%"}} disabled={!ok[1]} onClick={()=>setStep(3)}>Continue →</button>
          </div>)}

          {step===3&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 6px",letterSpacing:"-0.3px"}}>Health conditions</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:20}}>Contraindicated peptides are excluded automatically.</p>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
              {ALL_CONDS.map(c=>(
                <div key={c} className={`pick-row${conds.includes(c)?" on":""}`} onClick={()=>togC(c)}>
                  <div className={`pick-box${conds.includes(c)?" on":""}`}>{conds.includes(c)?"✓":""}</div>
                  <span style={{fontSize:14,fontWeight:500}}>{c}</span>
                </div>
              ))}
            </div>
            <button className="btn-main" style={{width:"100%"}} disabled={!ok[2]} onClick={()=>setStep(4)}>Continue →</button>
          </div>)}

          {step===4&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 6px",letterSpacing:"-0.3px"}}>Current substances</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:20}}>Interactions are flagged per peptide in your results.</p>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
              {ALL_SUBS.map(s=>(
                <div key={s} className={`pick-row${subs.includes(s)?" on":""}`} onClick={()=>togS(s)}>
                  <div className={`pick-box${subs.includes(s)?" on":""}`}>{subs.includes(s)?"✓":""}</div>
                  <span style={{fontSize:14,fontWeight:500}}>{s}</span>
                </div>
              ))}
            </div>
            <button className="btn-main" style={{width:"100%"}} disabled={!ok[3]} onClick={()=>setStep(5)}>Continue →</button>
          </div>)}

          {step===5&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 6px",letterSpacing:"-0.3px"}}>Peptides to avoid</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:12}}>Select any peptides you don't want in your protocol. Evidence tiers shown for reference.</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {[{l:"✓ FDA",c:"#059669",bg:"#ECFDF5",b:"#6EE7B7"},{l:"◉ Trials",c:"#2563EB",bg:"#EFF6FF",b:"#93C5FD"},{l:"◎ Limited",c:"#D97706",bg:"#FFFBEB",b:"#FCD34D"},{l:"○ Preclin.",c:"#E97316",bg:"#FFF7ED",b:"#FDBA74"},{l:"⚠ Spec.",c:"#DC2626",bg:"#FEF2F2",b:"#FCA5A5"}].map(t=>(
                <span key={t.l} style={{fontSize:9,fontWeight:700,color:t.c,background:t.bg,border:`1px solid ${t.b}`,borderRadius:10,padding:"2px 7px"}}>{t.l}</span>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:20}}>
              {Object.keys(PEPTIDE_DB).map(name=>{
                const on=avoidList.includes(name);
                const ev=EVIDENCE_TIERS[name];
                return(
                  <div key={name} onClick={()=>setAvoidList(p=>p.includes(name)?p.filter(x=>x!==name):[...p,name])}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"11px 12px",background:on?"#FEF2F2":"var(--white)",border:`1.5px solid ${on?"#FECACA":"var(--border)"}`,borderRadius:12,cursor:"pointer",userSelect:"none",transition:"all 0.16s"}}>
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${on?"#EF4444":"var(--border2)"}`,background:on?"#EF4444":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:800,color:"#fff",transition:"all 0.15s"}}>{on?"✕":""}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <span style={{fontSize:13,fontWeight:600,color:on?"#B91C1C":"var(--ink)",display:"block",lineHeight:1.3}}>{name}</span>
                      {ev&&<span style={{fontSize:8,fontWeight:700,color:ev.color,marginTop:2,display:"inline-block"}}>{ev.label}{ev.fdaFlag?" · ⚑ FDA":""}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {avoidList.length>0&&(
              <div style={{padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,fontSize:12,color:"#B91C1C",fontWeight:500,marginBottom:16}}>
                Excluding: {avoidList.join(", ")}
              </div>
            )}
            {avoidList.length===0&&(
              <div style={{padding:"10px 14px",background:"var(--teal-light)",border:"1px solid var(--teal-mid)",borderRadius:10,fontSize:12,color:"var(--teal-dark)",fontWeight:500,marginBottom:16}}>
                No exclusions — all peptides eligible
              </div>
            )}
            <button className="btn-main" style={{width:"100%"}} onClick={()=>setStep(6)}>Continue →</button>
          </div>)}

          {step===6&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 6px",letterSpacing:"-0.3px"}}>Experience & history</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:20}}>Sets dose conservatism and starting multipliers.</p>
            <div style={{marginBottom:20}}>
              <div className="lbl" style={{marginBottom:10}}>Experience Level</div>
              {[{id:"beginner",t:"New to Peptides",d:"Never used or just researching"},{id:"intermediate",t:"Some Experience",d:"1–2 peptides tried before"},{id:"advanced",t:"Experienced",d:"Regularly cycling multiple peptides"}].map(e=>(
                <div key={e.id} className={`exp-tile${exp===e.id?" on":""}`} onClick={()=>setExp(e.id)} style={{marginBottom:8}}>
                  <div className={`radio-ring${exp===e.id?" on":""}`}/>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,color:"var(--ink)"}}>{e.t}</div>
                    <div style={{color:"var(--ink3)",fontSize:12,marginTop:2}}>{e.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:28}}>
              <div className="lbl" style={{marginBottom:10}}>First Cycle of This Protocol?</div>
              <div style={{display:"flex",gap:8}}>
                {[["Yes — first time",true],["No — done before",false]].map(([l,v])=>(
                  <button key={String(v)} className={`seg-btn${fc===v?" on":""}`} style={{padding:"12px 8px",fontSize:13}} onClick={()=>setFc(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:28}}>
              <div className="lbl" style={{marginBottom:4}}>How many peptides in your protocol?</div>
              <div style={{color:"var(--ink3)",fontSize:12,marginBottom:14}}>The top-ranked peptides for your goals are selected. Fewer = simpler and easier to manage.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
                {[1,2,3,4,5,6].map(n=>{
                  const labels={1:"Focused",2:"Simple",3:"Balanced",4:"Full",5:"Advanced",6:"Max"};
                  const colors={1:"var(--teal)",2:"var(--teal)",3:"var(--teal)",4:"#8B5CF6",5:"#8B5CF6",6:"#E05050"};
                  const selected=protoSize===n;
                  return(
                    <div key={n} onClick={()=>setProtoSize(n)} style={{textAlign:"center",cursor:"pointer",userSelect:"none",transition:"all 0.18s",transform:selected?"translateY(-2px)":"none"}}>
                      <div style={{width:"100%",aspectRatio:"1",borderRadius:14,border:`2px solid ${selected?colors[n]:"var(--border)"}`,background:selected?`${colors[n]}15`:"var(--white)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:5,fontSize:22,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",color:selected?colors[n]:"var(--ink3)",boxShadow:selected?`0 4px 14px ${colors[n]}25`:"none",transition:"all 0.18s"}}>
                        {n}
                      </div>
                      <div style={{fontSize:9,fontWeight:700,color:selected?colors[n]:"var(--ink3)",letterSpacing:"0.5px",textTransform:"uppercase",transition:"color 0.15s"}}>{labels[n]}</div>
                    </div>
                  );
                })}
              </div>
              {protoSize&&(
                <div style={{marginTop:14,padding:"10px 14px",background:"var(--teal-light)",border:"1px solid var(--teal-mid)",borderRadius:10,fontSize:12,color:"var(--teal-dark)",fontWeight:500,animation:"in 0.2s ease both"}}>
                  {protoSize===1&&"✦ 1 peptide — laser focused. Best for beginners or targeting one specific issue."}
                  {protoSize===2&&"✦ 2 peptides — simple and effective. Easy to track and manage side effects."}
                  {protoSize===3&&"✦ 3 peptides — a solid stack. Covers multiple goals without complexity."}
                  {protoSize===4&&"✦ 4 peptides — well-rounded protocol. Good for intermediate users."}
                  {protoSize===5&&"✦ 5 peptides — comprehensive stack. Requires good tracking discipline."}
                  {protoSize===6&&"✦ 6 peptides — maximum coverage. Advanced users only — log everything carefully."}
                </div>
              )}
            </div>
            <button className="btn-main" style={{width:"100%"}} disabled={!ok[5]} onClick={()=>setStep(7)}>Review →</button>
          </div>)}

          {step===7&&(<div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 6px",letterSpacing:"-0.3px"}}>Review</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginBottom:20}}>Confirm before generating your protocol.</p>
            <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:24}}>
              {[["Goals",goals.map(id=>ALL_GOALS.find(g=>g.id===id)?.label).join(", ")],["Age",`${age}yo`],["Sex",sex],["Weight",`${weight}${wu} (${Math.round(kg)}kg)`],["Height",heightFt?`${heightFt}'${heightIn||0}"`:"—"],["Body Fat",`${bf}%`],["Conditions",conds.join(", ")],["Substances",subs.join(", ")],["Avoid",avoidList.length>0?avoidList.join(", "):"None"],["Experience",exp],["First Cycle",fc?"Yes":"No"],["Protocol Size",`${protoSize} peptide${protoSize===1?"":"s"}`]].map(([l,v])=>(
                <div key={l} style={{display:"flex",gap:14,padding:"9px 0",borderBottom:"1px solid var(--border)",alignItems:"flex-start"}}>
                  <span className="lbl" style={{minWidth:82,paddingTop:1,flexShrink:0,fontSize:9}}>{l}</span>
                  <span style={{color:"var(--ink)",fontSize:13,fontWeight:500,flex:1}}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-main" style={{width:"100%",fontSize:16,padding:"16px"}} onClick={generate}>Generate Protocol →</button>
          </div>)}
        </div>
      )}

      {/* ══ STEP 8 PREVIEW ══ */}
      {view==="building"&&step===8&&builtProto&&(
        <div className="fade-up" style={{maxWidth:640,margin:"0 auto",padding:P}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <button className="btn-outline" style={{padding:"8px 14px",fontSize:12}} onClick={()=>setStep(7)}>← Edit</button>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:16,flex:1}}>Protocol Preview</div>
            <span style={{background:"var(--teal-light)",color:"var(--teal-dark)",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,border:"1px solid var(--teal-mid)"}}>{builtProto.recommended.length+Object.values(replacementPicks).filter(Boolean).length} peptides</span>
          </div>
          <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:16,padding:16,marginBottom:14}}>
            <div className="lbl" style={{marginBottom:6}}>Calculated for</div>
            <div style={{color:"var(--ink)",fontSize:13,fontWeight:500,marginBottom:builtProto.avoidList?.length>0?8:0}}>{builtProto.profile.sex}, {builtProto.profile.age}yo · {Math.round(builtProto.profile.weightKg)}kg · {builtProto.profile.bodyFatPct}%BF · {builtProto.profile.experience}{builtProto.profile.firstCycle?" · first cycle":""}</div>
            {builtProto.avoidList?.length>0&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{color:"#B91C1C",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>Excluded by you:</span>
                {builtProto.avoidList.map(n=><span key={n} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#B91C1C",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600}}>{n}</span>)}
              </div>
            )}
          </div>
          {builtProto.removedConflicts?.map((c,ci)=>{
            const isOpen=conflictOpen[c.name];
            const picked=replacementPicks[c.name];
            const ev=EVIDENCE_TIERS[c.name];
            const removedInfo=PEPTIDE_INFO[c.name];
            return(
              <div key={ci} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:16,marginBottom:12,overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"14px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:16,flexShrink:0,marginTop:1}}>⛔</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:"#DC2626",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Conflict — Removed from stack</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,color:"#7F1D1D",marginBottom:4}}>{c.name}</div>
                    <div style={{color:"#991B1B",fontSize:11,lineHeight:1.5,marginBottom:8}}>{c.reason}</div>
                    {c.keptConflict&&<div style={{color:"#7F1D1D",fontSize:11,fontWeight:600}}>Kept: <span style={{color:"#059669",fontWeight:700}}>{c.keptConflict}</span> (higher goal match)</div>}
                  </div>
                </div>

                {/* Replacement picker toggle */}
                <button
                  onClick={()=>setConflictOpen(p=>({...p,[c.name]:!isOpen}))}
                  style={{
                    width:"100%",padding:"12px 16px",border:"none",borderTop:"1px solid #FECACA",
                    background:picked?"#ECFDF5":isOpen?"#FFF5F5":"#FEF8F8",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    transition:"all 0.18s",
                  }}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:15}}>{picked?"✅":"🔄"}</span>
                    <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:12,color:picked?"#059669":"#B91C1C"}}>
                      {picked?`Replacement: ${picked.peptide.name}`:`Pick a replacement${c.replacements.length>0?` (${c.replacements.length} options)`:""}`}
                    </span>
                  </div>
                  <span style={{color:"#7F1D1D",fontSize:14,display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.22s var(--ease)"}}>▾</span>
                </button>

                {/* Expanded replacement options */}
                {isOpen&&(
                  <div style={{padding:"0 14px 14px",animation:"up 0.25s var(--ease) both"}}>

                    {/* Show removed peptide info */}
                    {removedInfo&&(
                      <div style={{background:"#FFF5F5",border:"1px solid #FED7D7",borderRadius:12,padding:"12px 14px",marginTop:10,marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:13,color:"#7F1D1D"}}>About {c.name}</span>
                          {ev&&<span style={{fontSize:8,fontWeight:700,color:ev.color,background:ev.bg,border:`1px solid ${ev.border}`,borderRadius:10,padding:"1px 6px"}}>{ev.label}</span>}
                        </div>
                        <p style={{color:"#991B1B",fontSize:11,lineHeight:1.6,margin:0}}>{removedInfo.desc}</p>
                      </div>
                    )}

                    {/* No replacement option */}
                    <div
                      onClick={()=>setReplacementPicks(p=>{const n={...p};delete n[c.name];return n;})}
                      style={{
                        display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
                        background:!picked?"var(--teal-light)":"var(--white)",
                        border:`1.5px solid ${!picked?"var(--teal-mid)":"var(--border)"}`,
                        borderRadius:12,cursor:"pointer",marginBottom:8,transition:"all 0.15s",
                      }}>
                      <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${!picked?"var(--teal)":"var(--border2)"}`,background:!picked?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {!picked&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
                      </div>
                      <div>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:!picked?"var(--teal-dark)":"var(--ink2)"}}>No replacement</span>
                        <div style={{color:"var(--ink3)",fontSize:10,marginTop:1}}>Continue with {builtProto.recommended.length} peptide{builtProto.recommended.length===1?"":"s"}</div>
                      </div>
                    </div>

                    {/* Replacement options */}
                    {c.replacements.length>0?(
                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        <div style={{color:"var(--ink3)",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",paddingLeft:2,paddingTop:2}}>Available replacements</div>
                        {c.replacements.map(alt=>{
                          const isPicked=picked?.peptide.name===alt.peptide.name;
                          const altInfo=PEPTIDE_INFO[alt.peptide.name];
                          const altEv=EVIDENCE_TIERS[alt.peptide.name];
                          const altOpen=conflictOpen[`alt-${c.name}-${alt.peptide.name}`];
                          return(
                            <div key={alt.peptide.name} style={{
                              border:`1.5px solid ${isPicked?"var(--teal-mid)":"var(--border)"}`,
                              background:isPicked?"var(--teal-light)":"var(--white)",
                              borderRadius:14,overflow:"hidden",transition:"all 0.15s",
                            }}>
                              {/* Selection row */}
                              <div
                                onClick={()=>setReplacementPicks(p=>({...p,[c.name]:isPicked?null:alt}))}
                                style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}}>
                                <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isPicked?"var(--teal)":"var(--border2)"}`,background:isPicked?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                                  {isPicked&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                                    <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:isPicked?"var(--teal-dark)":"var(--ink)"}}>{alt.peptide.name}</span>
                                    {altEv&&<span style={{fontSize:8,fontWeight:700,color:altEv.color,background:altEv.bg,border:`1px solid ${altEv.border}`,borderRadius:10,padding:"1px 6px",lineHeight:1.3}}>{altEv.label}</span>}
                                    {altEv?.fdaFlag&&<span style={{fontSize:8,fontWeight:700,color:"#DC2626",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"1px 5px",lineHeight:1.3}}>⚑ FDA</span>}
                                  </div>
                                  <div style={{color:"var(--ink3)",fontSize:11,lineHeight:1.4}}>{alt.dose} {alt.peptide.unit} · {alt.peptide.frequency} · {alt.peptide.primaryRoute}</div>
                                </div>
                                <div style={{background:isPicked?"var(--teal)":"var(--bg)",borderRadius:8,padding:"5px 10px",textAlign:"center",flexShrink:0}}>
                                  <div style={{fontWeight:800,fontSize:13,color:isPicked?"#fff":"var(--ink2)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{Math.round(alt.score*10)/10}</div>
                                  <div style={{fontSize:8,color:isPicked?"rgba(255,255,255,0.7)":"var(--ink3)",fontWeight:600}}>score</div>
                                </div>
                              </div>

                              {/* Info toggle */}
                              <button
                                onClick={e=>{e.stopPropagation();setConflictOpen(p=>({...p,[`alt-${c.name}-${alt.peptide.name}`]:!altOpen}));}}
                                style={{width:"100%",padding:"8px 14px",border:"none",borderTop:`1px solid ${isPicked?"var(--teal-mid)":"var(--border)"}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,fontWeight:600,color:"var(--ink3)"}}>
                                <span>About {alt.peptide.name}</span>
                                <span style={{fontSize:12,transform:altOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
                              </button>

                              {/* Expanded info */}
                              {altOpen&&altInfo&&(
                                <div style={{padding:"0 14px 14px",animation:"up 0.2s var(--ease) both"}}>
                                  <p style={{color:"var(--ink2)",fontSize:11,lineHeight:1.65,margin:"0 0 8px",padding:"10px 12px",background:"var(--bg)",borderRadius:10,borderLeft:"3px solid var(--teal)"}}>{altInfo.desc}</p>
                                  {altEv&&(
                                    <div style={{background:altEv.fdaFlag?"#FEF2F2":altEv.bg,border:`1px solid ${altEv.fdaFlag?"#FECACA":altEv.border}`,borderRadius:9,padding:"8px 11px",marginBottom:8,fontSize:10,lineHeight:1.5,color:altEv.fdaFlag?"#7F1D1D":altEv.color}}>
                                      {altEv.fdaFlag?<span style={{fontWeight:700,color:"#DC2626"}}>⚑ </span>:<span style={{fontWeight:700}}>ℹ </span>}
                                      {altEv.fdaNote}
                                    </div>
                                  )}
                                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                                    <div style={{background:"#F0FFF8",border:"1px solid #A7F3D0",borderRadius:9,padding:"10px 12px"}}>
                                      <div style={{color:"#059669",fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>✓ Upsides</div>
                                      {altInfo.upsides.slice(0,3).map((u,ui)=>(
                                        <div key={ui} style={{display:"flex",gap:5,marginBottom:4}}>
                                          <span style={{color:"#059669",fontSize:10,flexShrink:0}}>+</span>
                                          <span style={{color:"#065F46",fontSize:10,lineHeight:1.45}}>{u}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:9,padding:"10px 12px"}}>
                                      <div style={{color:"#DC2626",fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>✗ Risks</div>
                                      {altInfo.risks.slice(0,3).map((r2,ri)=>(
                                        <div key={ri} style={{display:"flex",gap:5,marginBottom:4}}>
                                          <span style={{color:"#DC2626",fontSize:10,flexShrink:0}}>−</span>
                                          <span style={{color:"#7F1D1D",fontSize:10,lineHeight:1.45}}>{r2}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Timing/route summary */}
                                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:8}}>
                                    {[["Timing",alt.peptide.timing],["Route",alt.peptide.primaryRoute],["Cycle",alt.peptide.cycleNote||(alt.peptide.cycleOn?`${alt.peptide.cycleOn}wk on / ${alt.peptide.cycleOff}wk off`:"Ongoing")]].map(([l,v])=>(
                                      <div key={l} className="meta-chip"><div className="lbl" style={{marginBottom:2}}>{l}</div><div style={{color:"var(--ink)",fontSize:11,fontWeight:500}}>{v}</div></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ):(
                      <div style={{padding:"14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,textAlign:"center",marginTop:6}}>
                        <div style={{color:"#78350F",fontSize:12}}>No eligible replacements found for your goals and conditions.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {builtProto.recommended.length===0&&(
            <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:"24px 20px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:10}}>🤔</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:17,color:"#92400E",marginBottom:6}}>No peptides matched</div>
              <p style={{color:"#78350F",fontSize:12,lineHeight:1.65,margin:"0 0 16px",maxWidth:340,marginLeft:"auto",marginRight:"auto"}}>
                {builtProto.contraindicated?.length>0
                  ?"All candidates for your goals were excluded by your health conditions. Try selecting different goals or reviewing your contraindications."
                  :builtProto.avoidList?.length>0
                    ?"All candidates for your goals were in your avoid list. Try fewer exclusions or different goals."
                    :"Try adjusting your goals or settings and rebuilding."
                }
              </p>
              <button className="btn-outline" onClick={()=>setStep(1)} style={{fontSize:12}}>← Edit profile</button>
            </div>
          )}
          {builtProto.recommended.map(r=><PCard key={r.peptide.name} r={r} col={bCM([...builtProto.recommended,...Object.values(replacementPicks).filter(Boolean)])[r.peptide.name]} openInfo={openInfo} setOpenInfo={setOpenInfo}/>)}
          {/* Show picked replacement cards */}
          {Object.values(replacementPicks).filter(Boolean).map(r=>{
            const allRecs=[...builtProto.recommended,...Object.values(replacementPicks).filter(Boolean)];
            const cm=bCM(allRecs);
            return <PCard key={r.peptide.name} r={r} col={cm[r.peptide.name]} openInfo={openInfo} setOpenInfo={setOpenInfo}/>;
          })}
          {builtProto.contraindicated?.length>0&&(
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:16,padding:16,marginBottom:14}}>
              <div style={{color:"#DC2626",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>⛔ Excluded — Contraindicated</div>
              {builtProto.contraindicated.map(r=>(
                <div key={r.peptide.name} style={{padding:"9px 0",borderBottom:"1px solid #FEE2E2"}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,marginBottom:2}}>{r.peptide.name}</div>
                  <div style={{color:"#DC2626",fontSize:11}}>{r.contraFlags.join(", ")}</div>
                </div>
              ))}
            </div>
          )}
          {builtProto.recommended.length>0&&(
          <div style={{background:"linear-gradient(135deg,#3BBFB8,#2A9A93)",borderRadius:20,padding:26,textAlign:"center",marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.1)",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontSize:36,marginBottom:10}}>🚀</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:"#fff",marginBottom:8}}>Ready to start?</div>
              <p style={{color:"rgba(255,255,255,0.85)",fontSize:13,margin:"0 0 20px",lineHeight:1.65}}>Activating saves your protocol, starts your cycle timer, and unlocks daily injection tracking and weekly check-ins.</p>
              <button className="btn-main" style={{background:"#fff",color:"var(--teal)",boxShadow:"0 4px 18px rgba(0,0,0,0.18)",fontSize:16,padding:"15px 40px",position:"relative",zIndex:2}} onClick={activate}>Activate Protocol</button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ══ APP ══ */}
      {view==="app"&&(
        <div style={{maxWidth:640,margin:"0 auto",padding:P}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,letterSpacing:"-0.5px"}}>Peptide<span style={{color:"var(--teal)"}}>RX</span></div>
              <div style={{color:"var(--ink3)",fontSize:12,fontWeight:500,marginTop:1}}>{todayLbl}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{background:"var(--teal-light)",border:"1px solid var(--teal-mid)",borderRadius:20,padding:"5px 12px",display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"var(--teal)"}}/>
                <span style={{color:"var(--teal-dark)",fontSize:11,fontWeight:700}}>Week {cWeek}</span>
              </div>
            </div>
          </div>

          {/* HOME */}
          {tab==="home"&&(
            <div key="home" className="fade-up">
              {/* Cycle card */}
              <div style={{background:"linear-gradient(135deg,#3BBFB8,#2A9A93)",borderRadius:22,padding:"22px 22px 20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.12)",pointerEvents:"none"}}/>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,marginBottom:5}}>Active Cycle</div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:34,color:"#fff",lineHeight:1,letterSpacing:"-1px"}}>Week {cWeek}</div>
                      <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginTop:4}}>Started {protocol?.startedAt?fD(protocol.startedAt):"—"} · {protocol?.recommended.length} peptides</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.2)",borderRadius:12,padding:"10px 14px",textAlign:"center"}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:26,color:"#fff",lineHeight:1}}>{doneC}</div>
                      <div style={{color:"rgba(255,255,255,0.7)",fontSize:10,fontWeight:600,marginTop:2}}>/{todayP.length} today</div>
                    </div>
                  </div>
                  {protocol?.recommended.slice(0,4).map((r,idx)=>{
                    const wks=r.peptide.cycleOn||12;
                    const pct=Math.min(100,((cWeek-1)/wks)*100);
                    return(
                      <div key={r.peptide.name} style={{marginBottom:idx<3?8:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{color:"rgba(255,255,255,0.85)",fontSize:11,fontWeight:600}}>{r.peptide.name}</span>
                          <span style={{color:"rgba(255,255,255,0.65)",fontSize:10,fontWeight:600}}>{Math.min(cWeek,wks)}/{wks}wk</span>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,0.2)",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",background:"#fff",borderRadius:2,width:`${pct}%`,transition:"width 0.8s var(--ease)"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today's injections */}
              <div className="card" style={{marginBottom:12}}>
                <div className="card-pad" style={{paddingBottom:14,borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:16,color:"var(--ink)",marginBottom:2}}>Today's Injections</div>
                      <div style={{color:"var(--ink3)",fontSize:12}}>{todayLbl}</div>
                    </div>
                    {doneC===todayP.length&&todayP.length>0&&(
                      <span style={{background:"#ECFDF5",color:"#059669",fontSize:11,fontWeight:700,borderRadius:20,padding:"5px 12px",border:"1px solid #A7F3D0"}}>All done ✓</span>
                    )}
                  </div>
                </div>
                <div style={{padding:"8px 12px"}}>
                  {todayP.length===0?(
                    <div style={{textAlign:"center",padding:"24px 0"}}>
                      <div style={{fontSize:32,marginBottom:8}}>🌅</div>
                      <div style={{color:"var(--ink3)",fontSize:14,fontWeight:600}}>Rest day — no injections today</div>
                    </div>
                  ):(
                    todayP.map(r=>{
                      const log=tLogs[r.peptide.name];
                      const done=log?.done||log===true;
                      const logTime=log?.time||null;
                      const logSite=log?.site||null;
                      const col=cm[r.peptide.name];
                      const rk=getRouteKey(r.peptide.primaryRoute);
                      const siteObj=logSite?(ROUTE_SITES[rk]||[]).find(x=>x.id===logSite):null;
                      return(
                        <div key={r.peptide.name}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,cursor:"pointer",transition:"all 0.18s",border:`1.5px solid ${done?"rgba(59,191,184,0.25)":"var(--border)"}`,background:done?"var(--teal-light)":"var(--white)",marginBottom:8,userSelect:"none"}}
                          onClick={()=>openInjModal(r,col)}>
                          {/* Check ring */}
                          <div style={{width:30,height:30,borderRadius:"50%",border:`2.5px solid ${done?col:"var(--border2)"}`,background:done?col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.22s",fontSize:14,fontWeight:900,color:"#fff"}}>
                            {done?"✓":""}
                          </div>
                          {/* Info */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:done?"var(--teal-dark)":"var(--ink)"}}>{r.peptide.name}</span>
                              {(()=>{const ev=EVIDENCE_TIERS[r.peptide.name];return ev?<span style={{fontSize:8,fontWeight:700,color:ev.color,background:ev.bg,border:`1px solid ${ev.border}`,borderRadius:10,padding:"1px 6px",lineHeight:1.3,flexShrink:0}}>{ev.tier==="FDA Approved"?"✓ FDA":ev.tier==="Clinical Trials"?"◉ Trials":ev.tier==="Limited Human"?"◎ Limited":ev.tier==="Speculative"?"⚠ Spec.":"○ Preclin."}</span>:null;})()}
                            </div>
                            <div style={{color:"var(--ink3)",fontSize:12,paddingLeft:15}}>
                              {r.dose} {r.peptide.unit} · {r.peptide.primaryRoute}
                              {done&&logTime&&<span style={{marginLeft:6,color:"var(--teal)",fontWeight:600}}>· {logTime}</span>}
                              {done&&siteObj&&<span style={{marginLeft:4,color:"var(--ink2)",fontWeight:500}}>· {siteObj.short}</span>}
                            </div>
                          </div>
                          {/* Action */}
                          <div style={{flexShrink:0,textAlign:"center"}}>
                            {done?(
                              <div style={{fontSize:11,fontWeight:700,color:"var(--teal)"}}>Done ✓</div>
                            ):(
                              <div style={{background:"var(--teal)",color:"#fff",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700}}>Guide →</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {protocol?.recommended.some(r=>r.peptide.scheduleDays?.length===0)&&(
                    <div style={{margin:"6px 4px 4px",padding:"8px 12px",background:"var(--bg)",borderRadius:9,fontSize:11,color:"var(--ink3)",fontWeight:500}}>
                      As-needed: {protocol.recommended.filter(r=>r.peptide.scheduleDays?.length===0).map(r=>r.peptide.name).join(", ")}
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in */}
              {!checkedIn?(
                <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:18,padding:18,marginBottom:12,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:14,background:"#EFF6FF",border:"1px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📊</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,color:"var(--ink)",marginBottom:2}}>Week {cWeek} check-in due</div>
                    <div style={{color:"var(--ink3)",fontSize:12,fontWeight:500}}>Log weight, energy, mood & notes</div>
                  </div>
                  <button className="btn-main" style={{fontSize:12,padding:"10px 16px",flexShrink:0}} onClick={()=>setTab("checkin")}>Log</button>
                </div>
              ):(
                <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:18,padding:18,marginBottom:12,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:14,background:"#D1FAE5",border:"1px solid #6EE7B7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✅</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,color:"#059669",marginBottom:2}}>Week {cWeek} logged</div>
                    <div style={{color:"#6B7280",fontSize:12,fontWeight:500}}>{checkIns[0]&&`Energy ${checkIns[0].energy}/10 · Mood ${checkIns[0].mood}/10${checkIns[0].weight?` · ${checkIns[0].weight}`:""}`}</div>
                  </div>
                  <button className="btn-outline" style={{fontSize:11,padding:"7px 12px",flexShrink:0}} onClick={()=>setTab("checkin")}>History</button>
                </div>
              )}

              {/* Snapshot */}
              <div className="card">
                <div className="card-pad" style={{paddingBottom:14,borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"var(--ink)"}}>Active Protocol</div>
                  <button className="btn-outline" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setTab("protocol")}>Full detail →</button>
                </div>
                <div style={{padding:"6px 12px 12px"}}>
                  {protocol?.recommended.map(r=>(
                    <div key={r.peptide.name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:cm[r.peptide.name],flexShrink:0}}/>
                      <span style={{flex:1,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:13,color:"var(--ink)"}}>{r.peptide.name}</span>
                      <span style={{color:cm[r.peptide.name],fontSize:13,fontWeight:700}}>{r.dose} {r.peptide.unit}</span>
                      <span style={{color:"var(--ink3)",fontSize:10,fontWeight:600,minWidth:52,textAlign:"right"}}>{r.peptide.frequency.split("(")[0].split("→")[0].trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE */}
          {tab==="schedule"&&(
            <div key="schedule" className="fade-up">
              <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,margin:"0 0 16px",letterSpacing:"-0.3px"}}>Schedule</h2>
              <div className="card" style={{marginBottom:12}}>
                <div className="card-pad">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:16}}>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{
                      const isToday=i+1===tDow;
                      return(
                        <div key={d} style={{textAlign:"center"}}>
                          <div style={{color:isToday?"var(--teal)":"var(--ink3)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>{d}</div>
                          <div style={{minHeight:70,background:isToday?"var(--teal-light)":"var(--bg)",borderRadius:10,padding:"4px 3px",display:"flex",flexDirection:"column",gap:3,border:isToday?"1.5px solid var(--teal-mid)":"1.5px solid transparent",transition:"border-color 0.2s"}}>
                            {sched[i].length===0
                              ?<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:5,height:5,borderRadius:"50%",background:"var(--border2)"}}/></div>
                              :sched[i].map((item,j)=>(
                                <div key={j} style={{background:`${item.color}20`,border:`1px solid ${item.color}45`,borderRadius:6,padding:"2px 3px",fontSize:8,color:item.color,textAlign:"center",fontWeight:700,lineHeight:1.3}}>
                                  {item.name.split(" ")[0].replace("-","‑")}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {protocol?.recommended.map(r=>(
                      <div key={r.peptide.name} style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:cm[r.peptide.name]}}/>
                        <span style={{color:"var(--ink2)",fontSize:10,fontWeight:600}}>{r.peptide.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-pad" style={{paddingBottom:14,borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15}}>Full Schedule</div>
                </div>
                <div style={{padding:"0 20px"}}>
                  {protocol?.recommended.map(r=>(
                    <div key={r.peptide.name} style={{padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:cm[r.peptide.name]}}/>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,flex:1}}>{r.peptide.name}</span>
                        <span style={{background:`${cm[r.peptide.name]}20`,color:cm[r.peptide.name],borderRadius:10,padding:"3px 10px",fontSize:12,fontWeight:700}}>{r.dose} {r.peptide.unit}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,paddingLeft:16}}>
                        {[["Freq",r.peptide.frequency],["Route",r.peptide.primaryRoute],["Timing",r.peptide.timing],["Cycle",r.peptide.cycleNote||(r.peptide.cycleOn?`${r.peptide.cycleOn}wk / ${r.peptide.cycleOff}wk off`:"Ongoing")]].map(([l,v],idx)=>(
                          <div key={l} style={{gridColumn:idx>=2?"span 2":"span 1",background:"var(--bg)",borderRadius:8,padding:"7px 10px"}}>
                            <div className="lbl" style={{fontSize:8,marginBottom:2}}>{l}</div>
                            <div style={{color:"var(--ink2)",fontSize:11,fontWeight:500}}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHECK-IN */}
          {tab==="checkin"&&(
            <div key="checkin" className="fade-up">
              <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,margin:"0 0 6px",letterSpacing:"-0.3px"}}>Progress Tracker</h2>
              <p style={{color:"var(--ink2)",fontSize:13,marginBottom:20}}>Log weekly metrics and watch your progress over time.</p>

              {/* ── CHARTS ── */}
              {checkIns.length>=2&&(()=>{
                const ordered=[...checkIns].reverse();
                const metrics=[
                  {key:"weight",label:"Weight",unit:"",color:"#3BBFB8",type:"value"},
                  {key:"bf",label:"Body Fat",unit:"%",color:"#8B5CF6",type:"value"},
                  {key:"energy",label:"Energy",unit:"/10",color:"#F59E0B",type:"score"},
                  {key:"mood",label:"Mood",unit:"/10",color:"#EC4899",type:"score"},
                ];
                return(
                  <div className="card" style={{marginBottom:16,overflow:"hidden"}}>
                    <div style={{padding:"18px 18px 0"}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,marginBottom:14}}>Progress Charts</div>
                    </div>
                    {metrics.map(({key,label,unit,color,type})=>{
                      const raw=ordered.map(c=>({week:c.week,val:parseFloat(c[key])})).filter(d=>!isNaN(d.val));
                      if(raw.length<2)return null;
                      const vals=raw.map(d=>d.val);
                      const minV=Math.min(...vals);const maxV=Math.max(...vals);
                      const range=maxV-minV||1;
                      const W=320;const H=80;const PAD=6;const PH=H-PAD*2;const PW=W-32;
                      const pts=raw.map((d,i)=>({
                        x:32+i*(PW/(raw.length-1)),
                        y:PAD+PH-(((d.val-minV)/range)*PH),
                        val:d.val,week:d.week,
                      }));
                      const poly=pts.map(p=>`${p.x},${p.y}`).join(" ");
                      const area=[`${pts[0].x},${H}`,poly,`${pts[pts.length-1].x},${H}`].join(" ");
                      const latest=vals[vals.length-1];
                      const prev=vals[vals.length-2];
                      const delta=latest-prev;
                      const isGood=(key==="weight"||key==="bf")?delta<=0:delta>=0;
                      return(
                        <div key={key} style={{padding:"0 18px 18px",borderBottom:"1px solid var(--border)"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
                              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13}}>{label}</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16,color}}>{latest}{unit}</span>
                              {delta!==0&&<span style={{fontSize:11,fontWeight:700,color:isGood?"#059669":"#DC2626",background:isGood?"#ECFDF5":"#FEF2F2",borderRadius:20,padding:"2px 8px"}}>{delta>0?"+":""}{key==="bf"||key==="weight"?delta.toFixed(1):delta.toFixed(0)}{unit}</span>}
                            </div>
                          </div>
                          <div style={{overflowX:"auto"}}>
                            <svg viewBox={`0 0 ${Math.max(W,raw.length*50)} ${H}`} width="100%" height={H} style={{display:"block"}}>
                              <defs>
                                <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
                                  <stop offset="100%" stopColor={color} stopOpacity="0"/>
                                </linearGradient>
                              </defs>
                              {/* Y axis labels */}
                              <text x="0" y={PAD+5} fontSize="8" fill="var(--ink3)" fontFamily="sans-serif">{maxV.toFixed(type==="score"?0:1)}</text>
                              <text x="0" y={H-1} fontSize="8" fill="var(--ink3)" fontFamily="sans-serif">{minV.toFixed(type==="score"?0:1)}</text>
                              {/* Grid lines */}
                              {[0.25,0.5,0.75].map(f=>(
                                <line key={f} x1="28" x2={W} y1={PAD+PH*(1-f)} y2={PAD+PH*(1-f)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"/>
                              ))}
                              {/* Area fill */}
                              <polygon points={area} fill={`url(#grad-${key})`}/>
                              {/* Line */}
                              <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                              {/* Data points + week labels */}
                              {pts.map((p,i)=>(
                                <g key={i}>
                                  <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2"/>
                                  <text x={p.x} y={H} fontSize="8" fill="var(--ink3)" textAnchor="middle" fontFamily="sans-serif">W{p.week}</text>
                                </g>
                              ))}
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                    {/* Summary row */}
                    <div style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                      {metrics.map(({key,label,color,unit})=>{
                        const vals=ordered.map(c=>parseFloat(c[key])).filter(v=>!isNaN(v));
                        if(!vals.length)return<div key={key}/>;
                        return(
                          <div key={key} style={{textAlign:"center"}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:color,margin:"0 auto 4px"}}/>
                            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,color}}>{vals[vals.length-1]}{unit}</div>
                            <div style={{color:"var(--ink3)",fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── LOG FORM ── */}
              {!checkedIn&&!ciDone?(
                <div className="card" style={{marginBottom:16}}>
                  <div style={{background:"linear-gradient(135deg,#3BBFB8,#2A9A93)",borderRadius:"18px 18px 0 0",padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>📊</span>
                    <div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"#fff"}}>Week {cWeek} Log</div>
                      <div style={{color:"rgba(255,255,255,0.75)",fontSize:11,marginTop:1}}>Fill in what you can track this week</div>
                    </div>
                  </div>
                  <div style={{padding:20,display:"flex",flexDirection:"column",gap:20}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div><div className="lbl" style={{marginBottom:8}}>Weight</div><input type="number" placeholder="lbs or kg" value={ciW} onChange={e=>setCiW(e.target.value)}/></div>
                      <div><div className="lbl" style={{marginBottom:8}}>Body Fat %</div><input type="number" placeholder="e.g. 17.5" value={ciBf} onChange={e=>setCiBf(e.target.value)}/></div>
                    </div>
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <div className="lbl">Energy & Sleep</div>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"var(--teal)"}}>{ciE}<span style={{color:"var(--ink3)",fontSize:12}}>/10</span></span>
                      </div>
                      <RatingDots value={ciE} onChange={setCiE} color="var(--teal)"/>
                    </div>
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <div className="lbl">Mood & Libido</div>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"#8B5CF6"}}>{ciM}<span style={{color:"var(--ink3)",fontSize:12}}>/10</span></span>
                      </div>
                      <RatingDots value={ciM} onChange={setCiM} color="#8B5CF6"/>
                    </div>
                    <div>
                      <div className="lbl" style={{marginBottom:8}}>Side Effects / Notes</div>
                      <textarea placeholder="Side effects, physique changes, how you felt..." value={ciN} onChange={e=>setCiN(e.target.value)}/>
                    </div>
                    {/* Progress photos with camera */}
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <div className="lbl">Progress Photos</div>
                        <span style={{color:"var(--ink3)",fontSize:11}}>{Object.values(ciPhotos).filter(Boolean).length}/3 captured</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                        {[{key:"front",label:"Front"},{key:"side",label:"Side"},{key:"back",label:"Back"}].map(({key,label})=>{
                          const photo=ciPhotos[key];
                          return(
                            <div key={key} style={{position:"relative"}}>
                              <label style={{
                                display:"block",aspectRatio:"3/4",borderRadius:14,
                                border:photo?"2px solid var(--teal)":"2px dashed var(--border2)",
                                background:photo?"var(--white)":"var(--bg)",
                                cursor:"pointer",overflow:"hidden",position:"relative",
                                transition:"all 0.18s",
                              }}>
                                <input type="file" accept="image/*" capture="environment" onChange={e=>handlePhotoCapture(key,e)} style={{position:"absolute",opacity:0,pointerEvents:photo?"none":"auto",width:"100%",height:"100%"}}/>
                                {photo?(
                                  <img src={photo} alt={label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                                ):(
                                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:8,textAlign:"center"}}>
                                    <span style={{fontSize:24}}>📷</span>
                                    <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:11,color:"var(--ink2)",letterSpacing:"0.3px"}}>{label}</span>
                                    <span style={{fontSize:9,color:"var(--ink3)",fontWeight:500}}>Tap to capture</span>
                                  </div>
                                )}
                                {photo&&(
                                  <div style={{position:"absolute",bottom:6,left:6,right:6,background:"rgba(255,255,255,0.95)",borderRadius:8,padding:"3px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"var(--teal-dark)",backdropFilter:"blur(4px)"}}>{label} ✓</div>
                                )}
                              </label>
                              {photo&&(
                                <button onClick={()=>removePhoto(key)} style={{
                                  position:"absolute",top:6,right:6,zIndex:2,
                                  width:24,height:24,borderRadius:"50%",border:"none",
                                  background:"rgba(220,38,38,0.95)",color:"#fff",
                                  fontSize:11,fontWeight:800,cursor:"pointer",
                                  display:"flex",alignItems:"center",justifyContent:"center",
                                  boxShadow:"0 2px 6px rgba(0,0,0,0.2)",
                                }}>✕</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{marginTop:8,padding:"8px 12px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:9,fontSize:10,color:"#78350F",lineHeight:1.5}}>
                        💡 Use consistent lighting & pose. Photos save with this check-in for week-over-week comparison.
                      </div>
                    </div>
                    <button className="btn-main" style={{width:"100%",fontSize:15,padding:"15px"}} onClick={saveCI}>Save Week {cWeek} Check-in</button>
                  </div>
                </div>
              ):(
                <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:18,padding:28,marginBottom:20,textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:10}}>✅</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"#059669",marginBottom:6}}>Week {cWeek} Logged!</div>
                  <div style={{color:"#6B7280",fontSize:13}}>Come back next week to track your progress.</div>
                </div>
              )}

              {/* ── HISTORY ── */}
              {checkIns.length>0&&(
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div className="lbl">History</div>
                    <span style={{color:"var(--ink3)",fontSize:11,fontWeight:600}}>{checkIns.length} check-in{checkIns.length===1?"":"s"}</span>
                  </div>
                  {checkIns.map((c,i)=>{
                    const photoCount=c.photos?Object.values(c.photos).filter(Boolean).length:0;
                    return(
                      <div key={i} className="card" style={{marginBottom:10,cursor:"pointer",transition:"transform 0.18s,box-shadow 0.18s"}}
                        onClick={()=>setViewingCheckIn(i)}
                        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(59,191,184,0.12)";}}
                        onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                        <div className="card-pad" style={{padding:16}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                            <div>
                              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16,letterSpacing:"-0.2px"}}>Week {c.week}</div>
                              <div style={{color:"var(--ink3)",fontSize:11,marginTop:2}}>{fDF(c.date)}</div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              {i===0&&<span style={{background:"var(--teal-light)",color:"var(--teal-dark)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,border:"1px solid var(--teal-mid)"}}>Latest</span>}
                              <span style={{color:"var(--teal)",fontSize:18,fontWeight:700,marginLeft:2}}>›</span>
                            </div>
                          </div>

                          {/* Photo thumbnails preview */}
                          {photoCount>0&&(
                            <div style={{display:"flex",gap:6,marginBottom:12}}>
                              {["front","side","back"].map(angle=>{
                                const photo=c.photos?.[angle];
                                if(!photo)return null;
                                return(
                                  <div key={angle} style={{flex:1,aspectRatio:"3/4",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)"}}>
                                    <img src={photo} alt={angle} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                                  </div>
                                );
                              })}
                              {Array.from({length:3-photoCount}).map((_,k)=>(
                                <div key={`empty-${k}`} style={{flex:1,aspectRatio:"3/4",borderRadius:10,background:"var(--bg)",border:"1px dashed var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink3)",fontSize:18,opacity:0.5}}>—</div>
                              ))}
                            </div>
                          )}

                          {/* Quick metrics row */}
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                            {[
                              {l:"Wt",v:c.weight||"—",c:"#3BBFB8"},
                              {l:"BF",v:c.bf?`${c.bf}%`:"—",c:"#8B5CF6"},
                              {l:"Eng",v:c.energy,c:"#D97706"},
                              {l:"Mood",v:c.mood,c:"#9333EA"},
                            ].map(m=>(
                              <div key={m.l} style={{background:"var(--bg)",borderRadius:9,padding:"8px 4px",textAlign:"center"}}>
                                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:14,color:m.c,lineHeight:1.1}}>{m.v}</div>
                                <div style={{color:"var(--ink3)",fontSize:9,fontWeight:600,marginTop:2,letterSpacing:"0.3px"}}>{m.l}</div>
                              </div>
                            ))}
                          </div>
                          {c.notes&&<div style={{marginTop:10,color:"var(--ink2)",fontSize:11,lineHeight:1.5,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{c.notes}"</div>}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {checkIns.length===0&&(
                <div style={{textAlign:"center",padding:"32px 0",color:"var(--ink3)"}}>
                  <div style={{fontSize:36,marginBottom:10}}>📈</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,marginBottom:6}}>No data yet</div>
                  <div style={{fontSize:13}}>Log your first week above — charts appear after 2 check-ins.</div>
                </div>
              )}
            </div>
          )}

          {/* PROTOCOL */}
          {tab==="protocol"&&(
            <div key="protocol" className="fade-up">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,margin:0,letterSpacing:"-0.3px"}}>My Protocol</h2>
                <button className="btn-outline" style={{fontSize:11,padding:"7px 14px"}} onClick={rebuild}>Rebuild</button>
              </div>
              <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:14,padding:16,marginBottom:14}}>
                <div className="lbl" style={{marginBottom:6}}>Active Protocol</div>
                <div style={{color:"var(--ink2)",fontSize:13,fontWeight:500}}>{protocol&&`${protocol.profile.sex} · ${protocol.profile.age}yo · ${Math.round(protocol.profile.weightKg)}kg · ${protocol.profile.bodyFatPct}%BF · ${protocol.profile.experience} · started ${fD(protocol.startedAt)}`}</div>
              </div>
              {protocol?.removedConflicts?.map((c,i)=>(
                <div key={i} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"12px 16px",marginBottom:10,display:"flex",gap:10}}>
                  <span>⛔</span>
                  <div><div style={{color:"#DC2626",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:3}}>Stack Conflict</div><div style={{color:"#7F1D1D",fontSize:12}}><strong>{c.name}</strong> — {c.reason}</div></div>
                </div>
              ))}
              {/* Evidence Tier Legend */}
              <div className="card" style={{marginBottom:14}}>
                <div className="card-pad" style={{paddingBottom:12}}>
                  <div className="lbl" style={{marginBottom:10}}>Evidence Tiers</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[
                      {label:"FDA Approved",color:"#059669",bg:"#ECFDF5",border:"#6EE7B7",icon:"✓",desc:"Approved drug with labeled dosing and extensive clinical evidence"},
                      {label:"Active Clinical Trials",color:"#2563EB",bg:"#EFF6FF",border:"#93C5FD",icon:"◉",desc:"Human trials ongoing or completed with published efficacy data"},
                      {label:"Limited Human Data",color:"#D97706",bg:"#FFFBEB",border:"#FCD34D",icon:"◎",desc:"Some human studies exist but evidence is limited or regional"},
                      {label:"Preclinical Only",color:"#E97316",bg:"#FFF7ED",border:"#FDBA74",icon:"○",desc:"Animal/in-vitro data only — no validated human dosing protocol"},
                      {label:"Speculative",color:"#DC2626",bg:"#FEF2F2",border:"#FCA5A5",icon:"⚠",desc:"No identified human exposure data — speculative interest only"},
                    ].map(t=>(
                      <div key={t.label} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:3,background:t.bg,border:`1px solid ${t.border}`,color:t.color,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,flexShrink:0,minWidth:100,justifyContent:"center"}}>{t.icon} {t.label}</span>
                        <span style={{color:"var(--ink3)",fontSize:11}}>{t.desc}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,flexShrink:0,minWidth:100,justifyContent:"center"}}>⚑ FDA Flagged</span>
                      <span style={{color:"var(--ink3)",fontSize:11}}>Listed by FDA as compounding safety-risk substance</span>
                    </div>
                  </div>
                </div>
              </div>
              {protocol?.recommended.map(r=><PCard key={r.peptide.name} r={r} col={cm[r.peptide.name]} openInfo={openInfo} setOpenInfo={setOpenInfo}/>)}
              {protocol?.contraindicated?.length>0&&(
                <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:16,padding:16,marginBottom:14}}>
                  <div style={{color:"#DC2626",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>⛔ Excluded — Contraindicated</div>
                  {protocol.contraindicated.map(r=>(
                    <div key={r.peptide.name} style={{padding:"9px 0",borderBottom:"1px solid #FEE2E2"}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,marginBottom:2}}>{r.peptide.name}</div>
                      <div style={{color:"#DC2626",fontSize:11}}>{r.contraFlags.join(", ")}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"14px 16px",marginBottom:8}}>
                <p style={{color:"#7F1D1D",fontSize:11,margin:0,lineHeight:1.65}}>⚠️ <strong>Research & Educational Use Only — Not Medical Advice.</strong> Most peptides in this app are FDA-flagged as compounding safety-risk substances with limited or no validated human dosing. Only Semaglutide, PT-141, and Tesamorelin are FDA-approved drugs with labeled protocols. Consult a physician before use. Verify peptide purity and source.</p>
              </div>
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",marginBottom:20}}>
                <p style={{color:"var(--ink3)",fontSize:10,margin:0,lineHeight:1.65}}>Doses are derived from publicly available literature and adjusted algorithmically. Evidence tiers and FDA safety flags are shown on each peptide card — check them before making any decisions. This app does not replace medical supervision.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ BOTTOM NAV ══ */}
      {view==="app"&&(
        <nav className="bnav">
          {[{id:"home",icon:"🏠",label:"Home"},{id:"schedule",icon:"📅",label:"Schedule"},{id:"checkin",icon:"📊",label:"Check-in",badge:!checkedIn},{id:"protocol",icon:"🧬",label:"Protocol"}].map(t=>(
            <button key={t.id} className={`nav-btn${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
              <div style={{position:"relative"}}>
                <span className="ni">{t.icon}</span>
                {t.badge&&tab!==t.id&&<div style={{position:"absolute",top:-1,right:-3,width:8,height:8,borderRadius:"50%",background:"#8B5CF6",border:"2px solid #fff"}}/>}
              </div>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ══ CHECK-IN DETAIL MODAL ══ */}
      {viewingCheckIn!==null&&checkIns[viewingCheckIn]&&(()=>{
        const c=checkIns[viewingCheckIn];
        const photoCount=c.photos?Object.values(c.photos).filter(Boolean).length:0;
        const prev=checkIns[viewingCheckIn+1]; // older
        return(
          <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setViewingCheckIn(null)}>
            <div style={{position:"absolute",inset:0,background:"rgba(10,25,25,0.55)",backdropFilter:"blur(8px)"}}/>
            <div style={{position:"relative",background:"var(--bg)",borderRadius:"28px 28px 0 0",maxHeight:"94vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both"}} onClick={e=>e.stopPropagation()}>
              <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`}</style>

              {/* Drag handle */}
              <div style={{display:"flex",justifyContent:"center",paddingTop:12,paddingBottom:4,flexShrink:0}}>
                <div style={{width:36,height:4,borderRadius:2,background:"var(--border2)"}}/>
              </div>

              {/* Header */}
              <div style={{padding:"12px 22px 16px",borderBottom:"1px solid var(--border)",background:"var(--white)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,letterSpacing:"-0.5px"}}>Week {c.week}</div>
                    {viewingCheckIn===0&&<span style={{background:"var(--teal-light)",color:"var(--teal-dark)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,border:"1px solid var(--teal-mid)"}}>Latest</span>}
                  </div>
                  <div style={{color:"var(--ink3)",fontSize:12}}>{fDF(c.date)}</div>
                </div>
                <button onClick={()=>setViewingCheckIn(null)} style={{background:"var(--bg)",border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:16,color:"var(--ink2)",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>

              <div style={{overflowY:"auto",flex:1,padding:"18px 18px 32px"}}>
                {/* Photo gallery */}
                {photoCount>0&&(
                  <div className="card" style={{marginBottom:14,padding:18}}>
                    <div className="lbl" style={{marginBottom:12}}>Progress Photos</div>
                    <div style={{display:"grid",gridTemplateColumns:photoCount===1?"1fr":photoCount===2?"1fr 1fr":"1fr 1fr 1fr",gap:8}}>
                      {["front","side","back"].map(angle=>{
                        const photo=c.photos?.[angle];
                        if(!photo)return null;
                        return(
                          <div key={angle} style={{position:"relative",cursor:"pointer"}} onClick={()=>setLightboxPhoto({src:photo,label:`Week ${c.week} — ${angle.charAt(0).toUpperCase()+angle.slice(1)}`})}>
                            <div style={{aspectRatio:"3/4",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)"}}>
                              <img src={photo} alt={angle} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                            </div>
                            <div style={{position:"absolute",bottom:8,left:8,right:8,background:"rgba(255,255,255,0.95)",borderRadius:8,padding:"4px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"var(--teal-dark)",backdropFilter:"blur(4px)",letterSpacing:"0.3px",textTransform:"uppercase"}}>{angle}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{marginTop:10,fontSize:10,color:"var(--ink3)",textAlign:"center"}}>Tap any photo to enlarge</div>
                  </div>
                )}

                {/* Body metrics */}
                <div className="card" style={{marginBottom:14,padding:18}}>
                  <div className="lbl" style={{marginBottom:14}}>Body Metrics</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{background:"var(--teal-light)",border:"1px solid var(--teal-mid)",borderRadius:12,padding:14}}>
                      <div className="lbl" style={{color:"#3BBFB8",marginBottom:6,fontSize:9}}>Weight</div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:24,color:"var(--ink)",lineHeight:1}}>{c.weight||"—"}</div>
                      {prev?.weight&&c.weight&&(()=>{const d=parseFloat(c.weight)-parseFloat(prev.weight);if(isNaN(d))return null;return(<div style={{fontSize:10,fontWeight:700,color:d<=0?"#059669":"#DC2626",marginTop:4}}>{d>0?"+":""}{d.toFixed(1)} from W{prev.week}</div>);})()}
                    </div>
                    <div style={{background:"#FAF5FF",border:"1px solid #DDD6FE",borderRadius:12,padding:14}}>
                      <div className="lbl" style={{color:"#8B5CF6",marginBottom:6,fontSize:9}}>Body Fat</div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:24,color:"var(--ink)",lineHeight:1}}>{c.bf?`${c.bf}%`:"—"}</div>
                      {prev?.bf&&c.bf&&(()=>{const d=parseFloat(c.bf)-parseFloat(prev.bf);if(isNaN(d))return null;return(<div style={{fontSize:10,fontWeight:700,color:d<=0?"#059669":"#DC2626",marginTop:4}}>{d>0?"+":""}{d.toFixed(1)}% from W{prev.week}</div>);})()}
                    </div>
                  </div>
                </div>

                {/* Wellbeing scores */}
                <div className="card" style={{marginBottom:14,padding:18}}>
                  <div className="lbl" style={{marginBottom:14}}>Wellbeing</div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--ink)"}}>Energy & Sleep</span>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:"#D97706"}}>{c.energy}<span style={{color:"var(--ink3)",fontSize:11,fontWeight:600}}>/10</span></span>
                      </div>
                      <div style={{height:10,background:"#FEF3C7",borderRadius:5,overflow:"hidden"}}>
                        <div style={{height:"100%",background:"linear-gradient(90deg,#F59E0B,#D97706)",borderRadius:5,width:`${c.energy*10}%`,transition:"width 0.6s var(--ease)"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--ink)"}}>Mood & Libido</span>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:20,color:"#9333EA"}}>{c.mood}<span style={{color:"var(--ink3)",fontSize:11,fontWeight:600}}>/10</span></span>
                      </div>
                      <div style={{height:10,background:"#F3E8FF",borderRadius:5,overflow:"hidden"}}>
                        <div style={{height:"100%",background:"linear-gradient(90deg,#A78BFA,#8B5CF6)",borderRadius:5,width:`${c.mood*10}%`,transition:"width 0.6s var(--ease)"}}/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {c.notes&&(
                  <div className="card" style={{marginBottom:14,padding:18}}>
                    <div className="lbl" style={{marginBottom:10}}>Notes</div>
                    <p style={{margin:0,color:"var(--ink2)",fontSize:14,lineHeight:1.7,fontStyle:"italic",padding:"14px 16px",background:"var(--bg)",borderRadius:12,borderLeft:"3px solid var(--teal)"}}>"{c.notes}"</p>
                  </div>
                )}

                {/* Comparison to previous */}
                {prev&&(
                  <div style={{padding:"12px 16px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:12,marginBottom:14}}>
                    <div className="lbl" style={{marginBottom:8}}>vs. Week {prev.week}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,fontSize:11}}>
                      {[
                        {k:"weight",l:"Wt",inv:true},
                        {k:"bf",l:"BF%",inv:true},
                        {k:"energy",l:"Eng",inv:false},
                        {k:"mood",l:"Mood",inv:false},
                      ].map(({k,l,inv})=>{
                        const cur=parseFloat(c[k]);const old=parseFloat(prev[k]);
                        if(isNaN(cur)||isNaN(old))return<div key={k} style={{textAlign:"center",color:"var(--ink3)"}}>—</div>;
                        const d=cur-old;
                        const good=inv?d<=0:d>=0;
                        return(
                          <div key={k} style={{textAlign:"center"}}>
                            <div style={{color:"var(--ink3)",fontSize:9,fontWeight:700,marginBottom:3,letterSpacing:"0.3px"}}>{l}</div>
                            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:13,color:good?"#059669":"#DC2626"}}>{d>0?"+":""}{d.toFixed(1)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delete option */}
                <button
                  onClick={()=>{
                    if(confirm(`Delete Week ${c.week} check-in? This cannot be undone.`)){
                      const u=checkIns.filter((_,idx)=>idx!==viewingCheckIn);
                      setCheckIns(u);sSet("prx-c",u);setViewingCheckIn(null);
                    }
                  }}
                  style={{width:"100%",padding:"12px",background:"transparent",border:"1.5px solid #FECACA",borderRadius:12,color:"#DC2626",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.18s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#FEF2F2";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                  Delete this check-in
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ PHOTO LIGHTBOX ══ */}
      {lightboxPhoto&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"in 0.2s ease both"}} onClick={()=>setLightboxPhoto(null)}>
          <button onClick={()=>setLightboxPhoto(null)} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"50%",width:42,height:42,cursor:"pointer",color:"#fff",fontSize:20,backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>✕</button>
          <div style={{position:"absolute",top:24,left:24,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:14,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(10px)",padding:"8px 14px",borderRadius:20}}>{lightboxPhoto.label}</div>
          <img src={lightboxPhoto.src} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}} onClick={e=>e.stopPropagation()}/>
        </div>
      )}

      {/* ══ INJECTION MODAL ══ */}
      {pinModal&&(
        <InjectionModal
          r={pinModal.r}
          col={pinModal.col}
          history={pinHistory[pinModal.r.peptide.name]||[]}
          onConfirm={confirmInj}
          onClose={()=>setPinModal(null)}
        />
      )}
    </div>
  );
}
