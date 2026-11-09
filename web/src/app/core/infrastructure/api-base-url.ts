import { InjectionToken } from '@angular/core';

/**
 * Where the NestJS API lives.
 * - Local dev: '' → same origin, `ng serve` proxies /api to localhost:3000.
 * - GitHub Pages: injected at build time with
 *   `ng build --define "NG_API_BASE_URL='https://<render-service>.onrender.com'"`.
 */
declare const NG_API_BASE_URL: string | undefined;

export const API_BASE_URL = new InjectionToken<string>('ApiBaseUrl', {
  providedIn: 'root',
  factory: () => (typeof NG_API_BASE_URL === 'string' ? NG_API_BASE_URL.replace(/\/$/, '') : ''),
});
