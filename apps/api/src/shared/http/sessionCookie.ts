import type { CookieOptions, Request } from 'express';
import { env } from '../config/env';

export const SESSION_COOKIE = 'autosync_session';

const DURATION_UNITS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Converts a jsonwebtoken-style duration ("1d", "12h", "3600") to milliseconds. */
export function durationToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) return DURATION_UNITS.d;
  return Number(match[1]) * (match[2] ? DURATION_UNITS[match[2]] : 1_000);
}

/**
 * httpOnly keeps the token out of reach of injected scripts; SameSite=Lax stops
 * other sites from sending it on cross-site POSTs. Front and API share the domain
 * behind Caddy, so the cookie is first-party.
 */
export function sessionCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.NODE_ENV === 'staging',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

/** Reads the session token without pulling in cookie-parser. */
export function readSessionCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) {
      const value = part.slice(index + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
