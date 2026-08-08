// Same goal taxonomy as the peptide side (ported from legacy/peptide_rx.jsx
// ALL_GOALS), reused here so a user's wellness goals drive food/micronutrient
// guidance instead of a dosing calculation.
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
  why: string;
  foods: string[];
}

export const GOAL_NUTRITION_GUIDANCE: Record<string, NutrientGuidance[]> = {
  muscle: [
    { nutrient: "Protein", why: "Muscle protein synthesis", foods: ["Chicken breast", "Eggs", "Greek yogurt", "Whey protein", "Lean beef"] },
    { nutrient: "Creatine-rich foods", why: "Strength & power output", foods: ["Red meat", "Salmon", "Herring"] },
    { nutrient: "Calcium", why: "Bone density under load", foods: ["Dairy", "Fortified plant milk", "Sardines", "Leafy greens"] },
  ],
  fatloss: [
    { nutrient: "Fiber", why: "Satiety at a calorie deficit", foods: ["Oats", "Beans", "Vegetables", "Berries", "Chia seeds"] },
    { nutrient: "Protein", why: "Preserves lean mass while cutting", foods: ["Chicken breast", "Cottage cheese", "White fish", "Tofu"] },
    { nutrient: "Volume foods", why: "Fullness per calorie", foods: ["Leafy greens", "Cucumber", "Zucchini", "Berries"] },
  ],
  skin: [
    { nutrient: "Vitamin C", why: "Collagen synthesis", foods: ["Citrus", "Bell peppers", "Strawberries", "Kiwi"] },
    { nutrient: "Zinc", why: "Skin repair", foods: ["Oysters", "Pumpkin seeds", "Chickpeas", "Beef"] },
    { nutrient: "Omega-3", why: "Reduces inflammation, skin barrier", foods: ["Salmon", "Walnuts", "Flaxseed", "Sardines"] },
  ],
  recovery: [
    { nutrient: "Protein", why: "Tissue repair", foods: ["Eggs", "Chicken", "Fish", "Greek yogurt"] },
    { nutrient: "Vitamin C", why: "Collagen & connective tissue repair", foods: ["Citrus", "Kiwi", "Broccoli", "Bell peppers"] },
    { nutrient: "Omega-3", why: "Inflammation modulation", foods: ["Salmon", "Sardines", "Walnuts", "Chia seeds"] },
  ],
  sleep: [
    { nutrient: "Magnesium", why: "Nervous system relaxation", foods: ["Pumpkin seeds", "Almonds", "Spinach", "Dark chocolate"] },
    { nutrient: "Tryptophan", why: "Precursor to melatonin/serotonin", foods: ["Turkey", "Oats", "Milk", "Bananas"] },
    { nutrient: "Zinc", why: "Sleep quality", foods: ["Pumpkin seeds", "Cashews", "Chickpeas"] },
  ],
  cognitive: [
    { nutrient: "Omega-3 (DHA)", why: "Brain structure & function", foods: ["Salmon", "Sardines", "Walnuts", "Algae oil"] },
    { nutrient: "Choline", why: "Neurotransmitter production", foods: ["Eggs", "Liver", "Soybeans"] },
    { nutrient: "B vitamins", why: "Energy metabolism in neurons", foods: ["Whole grains", "Leafy greens", "Eggs", "Legumes"] },
  ],
  longevity: [
    { nutrient: "Omega-3", why: "Cardiovascular & anti-inflammatory", foods: ["Fatty fish", "Walnuts", "Flaxseed"] },
    { nutrient: "Polyphenols", why: "Antioxidant, cellular aging", foods: ["Berries", "Green tea", "Dark chocolate", "Olive oil"] },
    { nutrient: "Fiber", why: "Metabolic & gut health", foods: ["Legumes", "Whole grains", "Vegetables"] },
  ],
  libido: [
    { nutrient: "Zinc", why: "Hormone production", foods: ["Oysters", "Beef", "Pumpkin seeds"] },
    { nutrient: "Vitamin D", why: "Hormonal regulation", foods: ["Fatty fish", "Egg yolks", "Fortified milk"] },
    { nutrient: "Healthy fats", why: "Steroid hormone synthesis", foods: ["Avocado", "Olive oil", "Nuts", "Egg yolks"] },
  ],
  immune: [
    { nutrient: "Vitamin D", why: "Immune cell regulation", foods: ["Fatty fish", "Egg yolks", "Fortified foods", "Sunlight"] },
    { nutrient: "Vitamin C", why: "Immune cell function", foods: ["Citrus", "Bell peppers", "Broccoli"] },
    { nutrient: "Zinc", why: "Immune signaling", foods: ["Oysters", "Beef", "Pumpkin seeds", "Lentils"] },
  ],
  gut: [
    { nutrient: "Fiber", why: "Feeds beneficial gut bacteria", foods: ["Oats", "Beans", "Bananas", "Vegetables"] },
    { nutrient: "Probiotics", why: "Gut microbiome diversity", foods: ["Yogurt", "Kefir", "Sauerkraut", "Kimchi"] },
    { nutrient: "Prebiotic fiber", why: "Feeds probiotic bacteria", foods: ["Garlic", "Onion", "Leeks", "Asparagus"] },
  ],
};
