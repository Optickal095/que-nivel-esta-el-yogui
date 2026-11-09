import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { CHARACTER_GATEWAY } from './core/application/character.gateway';
import { HttpCharacterGateway } from './core/infrastructure/http-character.gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    // Port → adapter binding (swap for a fake in tests).
    { provide: CHARACTER_GATEWAY, useClass: HttpCharacterGateway },
  ],
};
