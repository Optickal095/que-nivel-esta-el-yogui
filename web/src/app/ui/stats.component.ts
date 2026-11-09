import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CharacterStats } from '../core/domain/character.model';

@Component({
  selector: 'app-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Estadísticas</h2>
      @if (rows(); as rows) {
        <dl>
          @for (row of rows; track row.label) {
            <div>
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          }
        </dl>
      } @else {
        <p class="muted">Sin estadísticas por ahora.</p>
      }
    </section>
  `,
  styles: `
    dl {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.5rem 1.5rem;
    }
    div {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.3rem 0;
    }
    dt {
      color: var(--muted);
    }
    dd {
      margin: 0 0 0 0.5rem;
      font-weight: 600;
      white-space: nowrap;
    }
  `,
})
export class StatsComponent {
  readonly stats = input.required<CharacterStats | null>();

  protected readonly rows = computed(() => {
    const s = this.stats();
    if (!s) return null;
    const pct = (n: number) => `${n.toFixed(2)} %`;
    return [
      { label: 'Vida', value: s.health },
      { label: s.powerType, value: s.power },
      { label: 'Fuerza', value: s.strength },
      { label: 'Agilidad', value: s.agility },
      { label: 'Aguante', value: s.stamina },
      { label: 'Intelecto', value: s.intellect },
      { label: 'Espíritu', value: s.spirit },
      { label: 'Armadura', value: s.armor },
      { label: 'Defensa', value: s.defense },
      { label: 'Poder de ataque', value: s.attackPower },
      { label: 'P. ataque a distancia', value: s.rangedAttackPower },
      { label: 'Crítico cuerpo a cuerpo', value: pct(s.meleeCritPct) },
      { label: 'Crítico a distancia', value: pct(s.rangedCritPct) },
      { label: 'Crítico con hechizos', value: pct(s.spellCritPct) },
      { label: 'Esquivar', value: pct(s.dodgePct) },
    ];
  });
}
