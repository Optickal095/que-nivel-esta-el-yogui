import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Profession, Reputation } from '../core/domain/character.model';

/** Professions and reputations, each as a labelled progress bar. */
@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Profesiones</h2>
      @for (p of professions(); track p.name) {
        <div class="bar-row">
          <div class="bar-label">
            <span>{{ p.name }}</span><span class="muted">{{ p.skill }} / {{ p.maxSkill }}</span>
          </div>
          <div class="bar"><span [style.width.%]="percent(p.skill, p.maxSkill)"></span></div>
        </div>
      } @empty {
        <p class="muted">Sin profesiones.</p>
      }

      <h2 class="second">Reputaciones</h2>
      @for (r of reputations(); track r.faction) {
        <div class="bar-row">
          <div class="bar-label">
            <span>{{ r.faction }}</span>
            <span class="muted">{{ r.standing }} · {{ r.value }} / {{ r.max }}</span>
          </div>
          <div class="bar rep"><span [style.width.%]="percent(r.value, r.max)"></span></div>
        </div>
      } @empty {
        <p class="muted">Sin reputaciones.</p>
      }
    </section>
  `,
  styles: `
    .second {
      margin-top: 1.5rem;
    }
    .bar-row {
      margin-bottom: 0.75rem;
    }
    .bar-label {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    .bar {
      height: 0.5rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--gold);
    }
    .bar.rep span {
      background: #3ddc84;
    }
  `,
})
export class ProgressComponent {
  readonly professions = input.required<Profession[]>();
  readonly reputations = input.required<Reputation[]>();

  protected percent(value: number, max: number): number {
    return max > 0 ? Math.min(100, (value / max) * 100) : 0;
  }
}
