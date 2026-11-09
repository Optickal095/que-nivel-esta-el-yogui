import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FunStat } from '../core/domain/character.model';

@Component({
  selector: 'app-fun-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Datos curiosos</h2>
      @if (stats().length > 0) {
        <ul>
          @for (stat of stats(); track stat.id) {
            <li>
              <strong>{{ stat.value.toLocaleString('es-CL') }}</strong>
              <span>{{ stat.label }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="muted">Blizzard todavía no entrega estas estadísticas.</p>
      }
    </section>
  `,
  styles: `
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    li {
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.04);
    }
    strong {
      display: block;
      font-size: 1.6rem;
      line-height: 1.2;
      color: var(--gold);
    }
    span {
      font-size: 0.85rem;
      color: var(--muted);
    }
  `,
})
export class FunStatsComponent {
  readonly stats = input.required<FunStat[]>();
}
