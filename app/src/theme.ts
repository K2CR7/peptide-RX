// Ported from the old web prototype's CSS custom properties (legacy/peptide_rx.jsx)
// so the new app keeps the same visual identity.
export const colors = {
  teal: "#3BBFB8",
  tealLight: "#E8F8F7",
  tealMid: "#B8E8E6",
  tealDark: "#2A9A93",
  bg: "#F4F7F8",
  white: "#FFFFFF",
  ink: "#1A2B2B",
  ink2: "#4A6060",
  ink3: "#8AABAB",
  border: "#E0ECEC",
  border2: "#C8DEDE",
  red: "#E05050",
  amber: "#D4820A",
  green: "#2A9A6A",
} as const;

export const radii = {
  sm: 9,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const spacing = (n: number) => n * 4;
