import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { CHARACTER_GATEWAY } from './core/application/character.gateway';
import { COMMENTS_GATEWAY, MODERATION_KEY_STORE } from './core/application/comments.gateway';
import { HttpCharacterGateway } from './core/infrastructure/http-character.gateway';
import { HttpCommentsGateway } from './core/infrastructure/http-comments.gateway';
import { LocalStorageModerationKeyStore } from './core/infrastructure/local-storage-moderation-key.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    // Port → adapter binding (swap for a fake in tests).
    { provide: CHARACTER_GATEWAY, useClass: HttpCharacterGateway },
    { provide: COMMENTS_GATEWAY, useClass: HttpCommentsGateway },
    { provide: MODERATION_KEY_STORE, useClass: LocalStorageModerationKeyStore },
  ],
};
