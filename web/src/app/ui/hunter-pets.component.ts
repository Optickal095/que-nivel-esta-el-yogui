import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HunterPet } from '../core/domain/character.model';

/** The hunter's pets: render, name, level and species. The active one goes first. */
@Component({
  selector: 'app-hunter-pets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>{{ pets().length === 1 ? 'Mascota' : 'Mascotas' }}</h2>
      <ul>
        @for (pet of pets(); track $index) {
          <li>
            @if (pet.imageUrl) {
              <div class="frame">
                <img [src]="pet.imageUrl" [alt]="pet.creature" loading="lazy" />
              </div>
            } @else {
              <div class="placeholder" aria-hidden="true">🐾</div>
            }
            <div class="info">
              <p class="name">
                {{ pet.name }}
                @if (pet.active && pets().length > 1) {
                  <span class="active">Activa</span>
                }
              </p>
              <p class="creature">{{ pet.creature }}</p>
              <p class="level">Nivel <strong>{{ pet.level }}</strong></p>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .frame,
    .placeholder {
      width: 140px;
      height: 140px;
      flex-shrink: 0;
      border-radius: 0.75rem;
      overflow: hidden;
      background: #1b1b1b;
    }
    /* Blizzard's render leaves a lot of empty space around the creature. */
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.9);
    }
    .placeholder {
      display: grid;
      place-items: center;
      font-size: 2.5rem;
    }
    p {
      margin: 0;
    }
    .name {
      font-size: 1.4rem;
      font-weight: 700;
    }
    .creature {
      color: var(--muted);
    }
    .level {
      margin-top: 0.35rem;
    }
    .level strong {
      color: var(--gold);
      font-size: 1.2rem;
    }
    .active {
      margin-left: 0.4rem;
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      vertical-align: middle;
      color: #1a1300;
      background: var(--gold);
    }
  `,
})
export class HunterPetsComponent {
  readonly pets = input.required<HunterPet[]>();
}
