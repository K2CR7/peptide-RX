// Same goal taxonomy as the peptide side (ported from legacy/peptide_rx.jsx
// ALL_GOALS). Used only to map a peptide's reference `goals` to something we
// can cross-reference against nutrients below — the nutrition screen itself
// is organized by nutrient, not by goal (see NUTRIENT_GUIDANCE).
export interface WellnessGoal {
  id: string;
  label: string;
  icon: string;
}

export const WELLNESS_GOALS: WellnessGoal[] = [
  { id: "muscle", label: "Muscle / Bulk", icon: "⚡" },
  { id: "fatloss", label: "Fat Loss / Lean Out", icon: "🔥" },
  { id: "skin", label: "Skin & Anti-Aging", icon: "✨" },
  { id: "recovery", label: "Recovery & Healing", icon: "🔄" },
  { id: "sleep", label: "Sleep & GH Optimization", icon: "🌙" },
  { id: "cognitive", label: "Cognitive / Nootropic", icon: "🧠" },
  { id: "longevity", label: "Longevity", icon: "♾️" },
  { id: "libido", label: "Libido & Hormones", icon: "💫" },
  { id: "immune", label: "Immune Support", icon: "🛡️" },
  { id: "gut", label: "Gut Health", icon: "🌿" },
];

export interface NutrientGuidance {
  nutrient: string;
  benefits: string;
  foods: string[];
}

// One entry per nutrient, benefits consolidated across every goal it used to
// be duplicated under (e.g. Zinc no longer appears separately in Skin,
// Sleep, Libido, and Immune sections — it appears once, covering all of it).
export const NUTRIENT_GUIDANCE: NutrientGuidance[] = [
  { nutrient: "Protein", benefits: "Muscle repair & growth, keeps you full during a deficit, tissue recovery.", foods: ["Chicken breast", "Eggs", "Greek yogurt", "Fish", "Lean beef", "Cottage cheese", "Tofu"] },
  { nutrient: "Fiber", benefits: "Satiety, feeds gut bacteria, supports metabolic and heart health.", foods: ["Oats", "Beans", "Vegetables", "Berries", "Chia seeds", "Whole grains"] },
  { nutrient: "Omega-3", benefits: "Reduces inflammation, supports skin barrier, brain function, and cardiovascular health.", foods: ["Salmon", "Sardines", "Walnuts", "Flaxseed", "Algae oil"] },
  { nutrient: "Vitamin C", benefits: "Collagen synthesis for skin & connective tissue repair, immune cell function.", foods: ["Citrus", "Bell peppers", "Strawberries", "Kiwi", "Broccoli"] },
  { nutrient: "Zinc", benefits: "Skin and tissue repair, immune signaling, hormone production, sleep quality.", foods: ["Oysters", "Beef", "Pumpkin seeds", "Chickpeas", "Cashews"] },
  { nutrient: "Vitamin D", benefits: "Immune regulation, hormonal balance.", foods: ["Fatty fish", "Egg yolks", "Fortified milk", "Sunlight"] },
  { nutrient: "Magnesium", benefits: "Nervous system relaxation, sleep quality, muscle function.", foods: ["Pumpkin seeds", "Almonds", "Spinach", "Dark chocolate"] },
  { nutrient: "Calcium", benefits: "Bone density, especially under training load.", foods: ["Dairy", "Fortified plant milk", "Sardines", "Leafy greens"] },
  { nutrient: "B Vitamins", benefits: "Energy metabolism, neuron function.", foods: ["Whole grains", "Leafy greens", "Eggs", "Legumes"] },
  { nutrient: "Choline", benefits: "Neurotransmitter production, cognitive function.", foods: ["Eggs", "Liver", "Soybeans"] },
  { nutrient: "Polyphenols / Antioxidants", benefits: "Combats cellular aging, anti-inflammatory.", foods: ["Berries", "Green tea", "Dark chocolate", "Olive oil"] },
  { nutrient: "Probiotics", benefits: "Gut microbiome diversity.", foods: ["Yogurt", "Kefir", "Sauerkraut", "Kimchi"] },
  { nutrient: "Prebiotic Fiber", benefits: "Feeds the probiotic bacteria above.", foods: ["Garlic", "Onion", "Leeks", "Asparagus"] },
  { nutrient: "Creatine-Rich Foods", benefits: "Strength & power output.", foods: ["Red meat", "Salmon", "Herring"] },
  { nutrient: "Healthy Fats", benefits: "Steroid hormone synthesis.", foods: ["Avocado", "Olive oil", "Nuts", "Egg yolks"] },
  { nutrient: "Tryptophan", benefits: "Precursor to melatonin/serotonin — supports sleep onset.", foods: ["Turkey", "Oats", "Milk", "Bananas"] },
];

// Which nutrients matter most for each wellness goal — used only to flag
// nutrients as "from your stack" based on what a peptide's reference data
// says it's for, not to filter or group the nutrient list itself.
export const GOAL_TO_NUTRIENTS: Record<string, string[]> = {
  muscle: ["Protein", "Creatine-Rich Foods", "Calcium"],
  fatloss: ["Fiber", "Protein"],
  skin: ["Vitamin C", "Zinc", "Omega-3"],
  recovery: ["Protein", "Vitamin C", "Omega-3"],
  sleep: ["Magnesium", "Tryptophan", "Zinc"],
  cognitive: ["Omega-3", "Choline", "B Vitamins"],
  longevity: ["Omega-3", "Polyphenols / Antioxidants", "Fiber"],
  libido: ["Zinc", "Vitamin D", "Healthy Fats"],
  immune: ["Vitamin D", "Vitamin C", "Zinc"],
  gut: ["Fiber", "Probiotics", "Prebiotic Fiber"],
};
