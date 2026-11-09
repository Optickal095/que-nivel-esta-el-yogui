import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LevelEvent } from '../core/domain/character.model';
import { shortDateTime } from '../core/domain/formatting';
import { levelChartGeometry } from '../core/domain/level-chart';

const WIDTH = 720;
const HEIGHT = 220;

@Component({
  selector: 'app-level-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Historial de nivel</h2>
      @if (geometry(); as g) {
        <svg
          [attr.viewBox]="'0 0 ' + width + ' ' + height"
          role="img"
          aria-label="Nivel del personaje a lo largo del tiempo"
        >
          @for (tick of g.yTicks; track tick.level) {
            <line class="grid" [attr.x1]="28" [attr.x2]="width - 28" [attr.y1]="tick.y" [attr.y2]="tick.y" />
            <text class="tick" x="4" [attr.y]="tick.y + 4">{{ tick.level }}</text>
          }
          <path class="line" [attr.d]="g.path" />
          @for (p of g.points; track p.at.getTime()) {
            <circle [class]="p.source" [attr.cx]="p.x" [attr.cy]="p.y" r="5">
              <title>Nivel {{ p.level }} · {{ format(p.at) }}</title>
            </circle>
          }
        </svg>
        <p class="caption">
          Registro desde el {{ format(events()[0].at) }} · los puntos verdes son subidas detectadas en
          vivo
        </p>
      } @else {
        <p class="muted">Todavía no hay historial.</p>
      }
    </section>
  `,
  styles: `
    svg {
      width: 100%;
      height: auto;
    }
    .grid {
      stroke: rgba(255, 255, 255, 0.08);
    }
    .tick {
      fill: var(--muted);
      font-size: 12px;
    }
    .line {
      fill: none;
      stroke: var(--gold);
      stroke-width: 3;
    }
    circle {
      fill: var(--gold);
      stroke: var(--bg);
      stroke-width: 2;
    }
    circle.live {
      fill: #3ddc84;
    }
    .caption {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      color: var(--muted);
    }
  `,
})
export class LevelHistoryComponent {
  readonly events = input.required<LevelEvent[]>();
  readonly now = input.required<Date>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly geometry = computed(() => levelChartGeometry(this.events(), this.now(), WIDTH, HEIGHT));
  protected readonly format = shortDateTime;
}
