export const COLORS = {
  // Brand Colors — VIDYAM School Edition violet system
  primary: "#6D28D9",       // School Edition primary violet
  primaryDark: "#3B0764",   // Deepest shade, sidebar/hero gradients, pressed states
  secondary: "#7C3AED",     // Light accent violet
  accent: "#A78BFA",        // Lightest accent, avatars/gradients

  // Neutral Colors (lavender-tinted light mode base, matching web tokens)
  background: "#F7F6FB",    // App background
  surface: "#FFFFFF",       // Cards
  surfaceDark: "#ECEAF4",   // Secondary surface / chips
  border: "#E5E1F0",        // Soft border lines

  // Text Colors
  text: "#1E1B2E",          // Dark ink for body text
  textSecondary: "#6B7280", // Muted gray for secondary text
  textMuted: "#9CA3AF",     // Soft gray for placeholders

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#0891B2",

  // Overlays / Highlights
  white: "#FFFFFF",
  transparent: "transparent",
  overlay: "rgba(59, 7, 100, 0.4)",   // Translucent deep-violet overlay
  glass: "rgba(255, 255, 255, 0.85)",
} as const;

export type ThemeColors = typeof COLORS;
export default COLORS;
