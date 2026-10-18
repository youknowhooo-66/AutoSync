import type { Express, Router } from 'express';

export interface MountSpec {
  prefix: string;
  router: Router;
  /** Alias mounts reuse a canonical router, so their routes are covered through it. */
  alias?: boolean;
}

interface Layer {
  name: string;
  handle: unknown;
  matchers?: Array<(path: string) => unknown>;
  route?: { path: string | string[]; methods: Record<string, boolean>; stack: Layer[] };
}

/**
 * Lists "METHOD /prefix/path" for every route reachable through the mounts.
 *
 * Express 5 does not keep the mount path of `app.use(prefix, router)` as a string,
 * so the prefixes come from `mounts` and are checked against each layer's matcher.
 * Throws when the app mounts a router that is not declared in `mounts`, so a new
 * module cannot slip in without isolation coverage.
 */
export function listRoutes(app: Express, mounts: MountSpec[]): string[] {
  const stack = (app as unknown as { router: { stack: Layer[] } }).router.stack;
  const mounted = stack.filter((l) => l.name === 'router' && !l.route);
  const unknown = mounted.filter((l) => !mounts.some((m) => m.router === l.handle && l.matchers?.[0]?.(m.prefix)));
  if (unknown.length > 0) {
    throw new Error(`${unknown.length} mounted router(s) are not declared in the isolation route manifest`);
  }

  const routes = new Set<string>();
  for (const mount of mounts) {
    if (mount.alias) continue;
    if (!mounted.some((l) => l.handle === mount.router && l.matchers?.[0]?.(mount.prefix))) {
      throw new Error(`Router declared at ${mount.prefix} is not mounted there`);
    }
    for (const layer of (mount.router as unknown as { stack: Layer[] }).stack) {
      if (!layer.route) {
        if (layer.name === 'router') throw new Error(`Nested router under ${mount.prefix} is not supported`);
        continue;
      }
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const method of Object.keys(layer.route.methods)) {
        for (const p of paths) {
          routes.add(`${method.toUpperCase()} ${mount.prefix}${p === '/' ? '' : p}`);
        }
      }
    }
  }
  return [...routes].sort();
}
