export const colors = {
  // Brand / Primary
  primary: 'var(--primary)',
  primaryHover: 'var(--primary-hover)',
  primaryForeground: 'var(--primary-foreground)',

  // Surfaces & Backgrounds
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  surface: 'var(--surface)',
  surfaceElevated: 'var(--surface-elevated)',
  surfaceMuted: 'var(--surface-muted)',

  // Borders
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',

  // Status & Feedback
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)',
  warning: 'var(--warning)',
  warningForeground: 'var(--warning-foreground)',
  danger: 'var(--danger)',
  dangerForeground: 'var(--danger-foreground)',
  info: 'var(--info)',
  infoForeground: 'var(--info-foreground)',

  // Typography
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
} as const;

export type ColorToken = keyof typeof colors;
