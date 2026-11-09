import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** "Última conexión hace 2 h (9 nov, 01:24 a. m.)". */
@Component({
  selector: 'app-last-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badge">
      <span class="dot" aria-hidden="true"></span>
      <span class="label">Última conexión</span>
      <span class="detail">{{ text() }}</span>
    </div>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      font-size: 0.95rem;
    }
    .dot {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 50%;
      background: #8a8f98;
    }
    .label {
      font-weight: 600;
    }
    .detail {
      color: var(--muted);
    }
  `,
})
export class LastLoginComponent {
  readonly text = input.required<string>();
}
