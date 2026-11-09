import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CharacterOverview, LevelEvent } from '../domain/character.model';

/** Port: where the character data comes from. Components never call HTTP directly. */
export interface CharacterGateway {
  getOverview(): Observable<CharacterOverview>;
  getLevelHistory(): Observable<LevelEvent[]>;
}

export const CHARACTER_GATEWAY = new InjectionToken<CharacterGateway>('CharacterGateway');
