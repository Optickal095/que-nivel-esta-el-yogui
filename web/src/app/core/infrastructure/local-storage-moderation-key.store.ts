import { Injectable } from '@angular/core';
import { ModerationKeyStore } from '../application/comments.gateway';

const STORAGE_KEY = 'yogui.moderationKey';

/** Adapter: keeps the moderation key in this browser only (localStorage). */
@Injectable()
export class LocalStorageModerationKeyStore implements ModerationKeyStore {
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null; // storage blocked (private mode, etc.)
    }
  }

  set(key: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // not remembered; moderation still works for this visit
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clear
    }
  }
}
