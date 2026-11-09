import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CharacterOverview } from '../core/domain/character.model';
import { LevelSinceText, classColor } from '../core/domain/formatting';
import { LastLoginComponent } from './last-login.component';

@Component({
  selector: 'app-hero',
  imports: [LastLoginComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = character();
    <section class="hero" [style.--class-color]="color()">
      <div class="portrait">
        @if (c.portraitUrl) {
          <img [src]="c.portraitUrl" [alt]="'Render de ' + c.name + ' ' + c.surname" />
        } @else {
          <div class="placeholder" aria-hidden="true">{{ initials() }}</div>
          <p class="hint">Blizzard todavía no genera la imagen del personaje.</p>
        }
      </div>

      <div class="info">
        <h1>¿Qué nivel está el Yogui?</h1>
        <p class="answer">
          Nivel <strong>{{ c.level }}</strong>
        </p>
        @if (levelSince(); as since) {
          <p class="since">
            {{ since.text }}
            @if (since.note) {
              <span class="since-note">{{ since.note }}</span>
            }
          </p>
        }
        <p class="name">{{ c.name }} {{ c.surname }}</p>
        <p class="meta">
          {{ c.className }} {{ c.race.toLowerCase() }} · {{ c.faction }} · {{ c.ruleset }}
          @if (c.guild) {
            · &lt;{{ c.guild }}&gt;
          }
        </p>
        <app-last-login [text]="lastLogin()" />
        <dl class="facts">
          @if (c.deaths !== null) {
            <div class="deaths">
              <dt><span aria-hidden="true">💀</span> Muertes</dt>
              <dd>{{ c.deaths }}</dd>
              @if (deathsAtLevel(); as atLevel) {
                <dd class="deaths-level">{{ atLevel }}</dd>
              }
            </div>
          }
          <div>
            <dt>Item level</dt>
            <dd>{{ c.equippedItemLevel }}</dd>
          </div>
          <div>
            <dt>Misiones</dt>
            <dd>{{ c.questsCompleted }}</dd>
          </div>
          <div>
            <dt>Logros</dt>
            <dd>{{ c.achievementPoints }}</dd>
          </div>
          <div>
            <dt>Muertes con honor</dt>
            <dd>{{ c.honorableKills }}</dd>
          </div>
        </dl>
      </div>
    </section>
  `,
  styles: `
    .hero {
      display: grid;
      grid-template-columns: minmax(180px, 280px) 1fr;
      gap: 2rem;
      align-items: center;
    }
    .portrait img {
      width: 100%;
      border-radius: 1rem;
    }
    .placeholder {
      aspect-ratio: 3 / 4;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      font-size: 4rem;
      font-weight: 800;
      color: var(--class-color);
      background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.08), transparent 70%),
        var(--card);
      border: 2px solid color-mix(in srgb, var(--class-color) 50%, transparent);
    }
    .hint {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      color: var(--muted);
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.4rem, 3vw, 2rem);
      color: var(--muted);
      font-weight: 600;
    }
    .answer {
      margin: 0.25rem 0;
      font-size: clamp(2.5rem, 8vw, 4.5rem);
      line-height: 1;
      font-weight: 800;
    }
    .answer strong {
      color: var(--gold);
    }
    .since {
      margin: 0.5rem 0 0;
      font-size: 1.05rem;
      font-weight: 600;
    }
    .since-note {
      display: block;
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--muted);
    }
    .name {
      margin: 0.75rem 0 0;
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--class-color);
    }
    .meta {
      margin: 0.25rem 0 1rem;
      color: var(--muted);
    }
    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin: 1.25rem 0 0;
    }
    dt {
      font-size: 0.8rem;
      color: var(--muted);
    }
    dd {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
    }
    .deaths dd {
      color: #ff6b6b;
    }
    .deaths .deaths-level {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--muted);
    }
    @media (max-width: 640px) {
      .hero {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .portrait {
        max-width: 200px;
        margin: 0 auto;
      }
      .facts {
        justify-content: center;
      }
    }
  `,
})
export class HeroComponent {
  readonly character = input.required<CharacterOverview>();
  readonly lastLogin = input.required<string>();
  readonly levelSince = input<LevelSinceText | null>(null);
  /** e.g. "al menos 2 en nivel 13". */
  readonly deathsAtLevel = input<string | null>(null);

  protected readonly color = computed(() => classColor(this.character().className));
  protected readonly initials = computed(
    () => `${this.character().name[0] ?? ''}${this.character().surname[0] ?? ''}`,
  );
}
