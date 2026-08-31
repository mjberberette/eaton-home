export interface ThemeOption {
  id: string;
  name: string;
  tagline: string;
  /** Accent hex used for the swatch preview */
  accent: string;
  /** Deep atmosphere tint for the swatch preview */
  deep: string;
}

/** Curated household palettes. `dusk` is the built-in default (no data-theme attr). */
export const THEMES: ThemeOption[] = [
  { id: "dusk", name: "Dusk Teal", tagline: "The original — home at twilight", accent: "#3cdbc8", deep: "#186e64" },
  { id: "ember", name: "Ember", tagline: "Copper warmth, fireside calm", accent: "#ff9d68", deep: "#924e24" },
  { id: "lavender", name: "Lavender Haze", tagline: "Soft violet, late-evening sky", accent: "#b8a7ff", deep: "#5e4eb2" },
  { id: "rose", name: "Rosé", tagline: "Blush glass, golden-hour glow", accent: "#f7a8c4", deep: "#9e4a6a" },
  { id: "golden", name: "Golden Hour", tagline: "Honey light through the windows", accent: "#ffcf5e", deep: "#967022" },
  { id: "juniper", name: "Juniper", tagline: "Evergreen, fresh off the trail", accent: "#6fd695", deep: "#2c7a4c" },
  { id: "glacier", name: "Glacier", tagline: "Cool blue, crisp mountain air", accent: "#82c7ff", deep: "#346a9e" },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));

export function themeStorageKey(userName: string) {
  return `eaton-theme:${userName.toLowerCase()}`;
}

export function applyTheme(id: string) {
  const root = document.documentElement;
  if (id === "dusk" || !THEME_IDS.has(id)) delete root.dataset.theme;
  else root.dataset.theme = id;
}

export function loadTheme(userName: string): string {
  try {
    const saved = localStorage.getItem(themeStorageKey(userName));
    return saved && THEME_IDS.has(saved) ? saved : "dusk";
  } catch {
    return "dusk";
  }
}

export function saveTheme(userName: string, id: string) {
  try {
    localStorage.setItem(themeStorageKey(userName), id);
  } catch {
    // Storage unavailable — theme still applies for the session
  }
}
