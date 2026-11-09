import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CharacterOverview, LevelEvent } from '../domain/character.model';
import { CHARACTER_GATEWAY } from './character.gateway';

export const REFRESH_INTERVAL_MS = 60_000;

/**
 * Facade: the page's state as signals. Loads overview + history, refreshes
 * every minute and keeps a ticking `now` so relative times stay correct.
 * A failed refresh keeps the data already shown.
 */
@Injectable()
export class CharacterFacade {
  private readonly gateway = inject(CHARACTER_GATEWAY);

  readonly overview = signal<CharacterOverview | null>(null);
  readonly history = signal<LevelEvent[]>([]);
  readonly error = signal<string | null>(null);
  readonly now = signal(new Date());
  readonly loading = computed(() => this.overview() === null && this.error() === null);

  constructor() {
    const timer = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  refresh(): void {
    forkJoin({ overview: this.gateway.getOverview(), history: this.gateway.getLevelHistory() }).subscribe({
      next: ({ overview, history }) => {
        this.overview.set(overview);
        this.history.set(history);
        this.error.set(null);
        this.now.set(new Date());
      },
      error: () => {
        this.now.set(new Date());
        if (!this.overview()) {
          this.error.set('No pudimos obtener los datos del Yogui. Reintentaremos en un minuto.');
        }
      },
    });
  }
}
