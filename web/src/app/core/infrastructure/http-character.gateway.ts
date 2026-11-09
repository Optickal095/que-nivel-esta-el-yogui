import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CharacterGateway } from '../application/character.gateway';
import { CharacterOverview, LevelEvent, Presence } from '../domain/character.model';

/** JSON as the API sends it: dates are ISO strings. */
type OverviewDto = Omit<
  CharacterOverview,
  'lastLoginAt' | 'profileFetchedAt' | 'presence' | 'levelSince'
> & {
  lastLoginAt: string;
  profileFetchedAt: string;
  presence: Omit<Presence, 'lastSeenAt'> & { lastSeenAt: string | null };
  levelSince: { at: string; exact: boolean } | null;
};
type LevelEventDto = Omit<LevelEvent, 'at'> & { at: string };

/** Adapter: CharacterGateway over the NestJS API (same origin: /api). Parses ISO dates. */
@Injectable()
export class HttpCharacterGateway implements CharacterGateway {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<CharacterOverview> {
    return this.http.get<OverviewDto>('/api/character').pipe(
      map((dto) => ({
        ...dto,
        lastLoginAt: new Date(dto.lastLoginAt),
        profileFetchedAt: new Date(dto.profileFetchedAt),
        levelSince: dto.levelSince && { ...dto.levelSince, at: new Date(dto.levelSince.at) },
        funStats: dto.funStats ?? [],
        presence: {
          ...dto.presence,
          lastSeenAt: dto.presence.lastSeenAt ? new Date(dto.presence.lastSeenAt) : null,
        },
      })),
    );
  }

  getLevelHistory(): Observable<LevelEvent[]> {
    return this.http
      .get<LevelEventDto[]>('/api/character/history')
      .pipe(map((events) => events.map((e) => ({ ...e, at: new Date(e.at) }))));
  }
}
