// Theme Configuration for Emlak CRM
// Each theme has light and dark variants

export interface ThemeColors {
  // Primary colors
  primary: string;        // Main brand color
  primaryHover: string;   // Hover state
  primaryLight: string;   // Light variant (backgrounds)
  primaryDark: string;    // Dark variant

  // Accent colors
  accent: string;         // Secondary accent
  accentHover: string;

  // Sidebar
  sidebarBg: string;
  sidebarBgDark: string;
  sidebarText: string;
  sidebarTextDark: string;
  sidebarActive: string;
  sidebarActiveDark: string;
  sidebarActiveBg: string;
  sidebarActiveBgDark: string;

  // Content area
  contentBg: string;
  contentBgDark: string;

  // Cards
  cardBg: string;
  cardBgDark: string;
  cardBorder: string;
  cardBorderDark: string;

  // FAB
  fabBg: string;
  fabGlow: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Klasik',
    description: 'Mevcut tema - Sky Blue tonları',
    colors: {
      primary: '#0ea5e9',        // sky-500
      primaryHover: '#0284c7',   // sky-600
      primaryLight: '#e0f2fe',   // sky-100
      primaryDark: '#0369a1',    // sky-700

      accent: '#6366f1',         // indigo-500
      accentHover: '#4f46e5',    // indigo-600

      sidebarBg: '#ffffff',
      sidebarBgDark: '#1e293b',  // slate-800
      sidebarText: '#475569',    // slate-600
      sidebarTextDark: '#94a3b8', // slate-400
      sidebarActive: '#0ea5e9',
      sidebarActiveDark: '#38bdf8',
      sidebarActiveBg: '#f0f9ff', // sky-50
      sidebarActiveBgDark: 'rgba(14, 165, 233, 0.2)',

      contentBg: '#f8fafc',      // slate-50
      contentBgDark: '#0f172a',  // slate-900

      cardBg: '#ffffff',
      cardBgDark: '#1e293b',
      cardBorder: '#e2e8f0',     // slate-200
      cardBorderDark: '#334155', // slate-700

      fabBg: '#0ea5e9',
      fabGlow: 'rgba(14, 165, 233, 0.5)',
    }
  },
  {
    id: 'professional-dark',
    name: 'Koyu Profesyonel',
    description: 'Lacivert ve altın - Lüks emlak ofisi havası',
    colors: {
      primary: '#d4af37',        // Gold
      primaryHover: '#c9a227',
      primaryLight: '#fef3c7',   // amber-100
      primaryDark: '#b8860b',

      accent: '#1e3a5f',         // Navy
      accentHover: '#15294a',

      sidebarBg: '#0f172a',      // Very dark navy
      sidebarBgDark: '#020617',
      sidebarText: '#94a3b8',
      sidebarTextDark: '#64748b',
      sidebarActive: '#d4af37',
      sidebarActiveDark: '#fbbf24',
      sidebarActiveBg: 'rgba(212, 175, 55, 0.15)',
      sidebarActiveBgDark: 'rgba(212, 175, 55, 0.2)',

      contentBg: '#1e293b',
      contentBgDark: '#0f172a',

      cardBg: '#1e293b',
      cardBgDark: '#0f172a',
      cardBorder: '#334155',
      cardBorderDark: '#1e293b',

      fabBg: '#d4af37',
      fabGlow: 'rgba(212, 175, 55, 0.5)',
    }
  },
  {
    id: 'nature',
    name: 'Doğal Toprak',
    description: 'Orman yeşili ve kahve - Organik, samimi',
    colors: {
      primary: '#166534',        // green-800
      primaryHover: '#14532d',   // green-900
      primaryLight: '#dcfce7',   // green-100
      primaryDark: '#15803d',    // green-700

      accent: '#92400e',         // amber-800 (kahve tonu)
      accentHover: '#78350f',

      sidebarBg: '#faf7f2',      // Warm cream
      sidebarBgDark: '#1c1917',  // stone-900
      sidebarText: '#57534e',    // stone-600
      sidebarTextDark: '#a8a29e', // stone-400
      sidebarActive: '#166534',
      sidebarActiveDark: '#4ade80',
      sidebarActiveBg: '#f0fdf4', // green-50
      sidebarActiveBgDark: 'rgba(22, 101, 52, 0.3)',

      contentBg: '#fafaf9',      // stone-50
      contentBgDark: '#0c0a09',  // stone-950

      cardBg: '#ffffff',
      cardBgDark: '#1c1917',
      cardBorder: '#e7e5e4',     // stone-200
      cardBorderDark: '#44403c', // stone-700

      fabBg: '#166534',
      fabGlow: 'rgba(22, 101, 52, 0.5)',
    }
  },
  {
    id: 'mediterranean',
    name: 'Akdeniz',
    description: 'Terracotta ve zeytin - Sıcak, Türkiye\'ye uygun',
    colors: {
      primary: '#c2410c',        // orange-700 (terracotta)
      primaryHover: '#9a3412',   // orange-800
      primaryLight: '#ffedd5',   // orange-100
      primaryDark: '#ea580c',    // orange-600

      accent: '#4d7c0f',         // lime-700 (zeytin yeşili)
      accentHover: '#3f6212',

      sidebarBg: '#fffbeb',      // Warm cream (amber-50)
      sidebarBgDark: '#292524',  // stone-800
      sidebarText: '#78716c',    // stone-500
      sidebarTextDark: '#a8a29e',
      sidebarActive: '#c2410c',
      sidebarActiveDark: '#fb923c',
      sidebarActiveBg: '#fff7ed', // orange-50
      sidebarActiveBgDark: 'rgba(194, 65, 12, 0.25)',

      contentBg: '#fefce8',      // yellow-50
      contentBgDark: '#1c1917',

      cardBg: '#ffffff',
      cardBgDark: '#292524',
      cardBorder: '#fde68a',     // amber-200
      cardBorderDark: '#57534e',

      fabBg: '#c2410c',
      fabGlow: 'rgba(194, 65, 12, 0.5)',
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Siyah-beyaz, tek vurgu rengi - Modern, net',
    colors: {
      primary: '#18181b',        // zinc-900
      primaryHover: '#27272a',   // zinc-800
      primaryLight: '#f4f4f5',   // zinc-100
      primaryDark: '#09090b',    // zinc-950

      accent: '#dc2626',         // red-600 (tek vurgu)
      accentHover: '#b91c1c',

      sidebarBg: '#ffffff',
      sidebarBgDark: '#09090b',  // zinc-950
      sidebarText: '#71717a',    // zinc-500
      sidebarTextDark: '#a1a1aa', // zinc-400
      sidebarActive: '#18181b',
      sidebarActiveDark: '#fafafa',
      sidebarActiveBg: '#f4f4f5',
      sidebarActiveBgDark: 'rgba(255, 255, 255, 0.1)',

      contentBg: '#fafafa',      // zinc-50
      contentBgDark: '#18181b',  // zinc-900

      cardBg: '#ffffff',
      cardBgDark: '#27272a',
      cardBorder: '#e4e4e7',     // zinc-200
      cardBorderDark: '#3f3f46', // zinc-700

      fabBg: '#dc2626',
      fabGlow: 'rgba(220, 38, 38, 0.5)',
    }
  },
  {
    id: 'sunset',
    name: 'Gün Batımı',
    description: 'Turuncu ve coral - Enerjik, sıcak',
    colors: {
      primary: '#ea580c',        // orange-600
      primaryHover: '#c2410c',   // orange-700
      primaryLight: '#ffedd5',   // orange-100
      primaryDark: '#9a3412',    // orange-800

      accent: '#db2777',         // pink-600
      accentHover: '#be185d',

      sidebarBg: '#fff7ed',      // orange-50
      sidebarBgDark: '#1c1917',
      sidebarText: '#78716c',
      sidebarTextDark: '#d6d3d1',
      sidebarActive: '#ea580c',
      sidebarActiveDark: '#fb923c',
      sidebarActiveBg: '#ffedd5',
      sidebarActiveBgDark: 'rgba(234, 88, 12, 0.25)',

      contentBg: '#fffbeb',      // amber-50
      contentBgDark: '#0c0a09',

      cardBg: '#ffffff',
      cardBgDark: '#1c1917',
      cardBorder: '#fed7aa',     // orange-200
      cardBorderDark: '#44403c',

      fabBg: '#ea580c',
      fabGlow: 'rgba(234, 88, 12, 0.5)',
    }
  },
  {
    id: 'ocean',
    name: 'Okyanus',
    description: 'Derin mavi ve turkuaz - Sakin, güvenilir',
    colors: {
      primary: '#0891b2',        // cyan-600
      primaryHover: '#0e7490',   // cyan-700
      primaryLight: '#cffafe',   // cyan-100
      primaryDark: '#155e75',    // cyan-800

      accent: '#7c3aed',         // violet-600
      accentHover: '#6d28d9',

      sidebarBg: '#f0fdfa',      // teal-50
      sidebarBgDark: '#134e4a',  // teal-900
      sidebarText: '#5eead4',
      sidebarTextDark: '#99f6e4',
      sidebarActive: '#0891b2',
      sidebarActiveDark: '#22d3ee',
      sidebarActiveBg: '#ecfeff', // cyan-50
      sidebarActiveBgDark: 'rgba(8, 145, 178, 0.3)',

      contentBg: '#f0fdfa',
      contentBgDark: '#042f2e',  // teal-950

      cardBg: '#ffffff',
      cardBgDark: '#134e4a',
      cardBorder: '#99f6e4',     // teal-200
      cardBorderDark: '#115e59', // teal-800

      fabBg: '#0891b2',
      fabGlow: 'rgba(8, 145, 178, 0.5)',
    }
  }
];

export const getThemeById = (id: string): Theme => {
  return themes.find(t => t.id === id) || themes[0];
};

export const defaultThemeId = 'classic';
