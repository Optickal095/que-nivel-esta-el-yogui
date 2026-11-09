import { Observable, of, throwError } from 'rxjs';
import { CharacterGateway } from '../core/application/character.gateway';
import { CharacterOverview, LevelEvent } from '../core/domain/character.model';

export function anOverview(overrides: Partial<CharacterOverview> = {}): CharacterOverview {
  return {
    name: 'Dr',
    surname: 'Yogui',
    level: 10,
    className: 'Cazador',
    race: 'Tauren',
    faction: 'Horda',
    ruleset: 'JcJ',
    guild: null,
    equippedItemLevel: 4,
    lastLoginAt: new Date('2026-11-09T00:07:19Z'),
    achievementPoints: 0,
    honorableKills: 0,
    questsCompleted: 41,
    deaths: 24,
    deathsAtLevel: { count: 2, exact: false },
    portraitUrl: null,
    equipment: [
      {
        slot: 'RANGED',
        slotName: 'A distancia',
        name: 'Escopeta compacta',
        quality: 'UNCOMMON',
        itemLevel: 13,
        iconUrl: null,
        enchantments: [],
      },
    ],
    stats: null,
    professions: [{ name: 'Herbalism', skill: 3, maxSkill: 75 }],
    reputations: [],
    funStats: [{ id: 107, label: 'Criaturas muertas', value: 393 }],
    levelSince: { at: new Date('2026-11-09T02:00:00Z'), exact: false },
    profileFetchedAt: new Date('2026-11-09T02:00:00Z'),
    ...overrides,
  };
}

/** Test double for the CharacterGateway port. */
export class FakeCharacterGateway implements CharacterGateway {
  overview: CharacterOverview | Error = anOverview();
  history: LevelEvent[] = [{ level: 10, at: new Date('2026-11-09T02:00:00Z') }];
  calls = 0;

  getOverview(): Observable<CharacterOverview> {
    this.calls++;
    return this.overview instanceof Error ? throwError(() => this.overview) : of(this.overview);
  }

  getLevelHistory(): Observable<LevelEvent[]> {
    return of(this.history);
  }
}
