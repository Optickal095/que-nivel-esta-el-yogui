import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PresenceText } from '../core/domain/formatting';

@Component({
  selector: 'app-presence-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badge" [class]="'badge ' + text().tone" role="status">
      <span class="dot" aria-hidden="true"></span>
      <span class="label">{{ text().label }}</span>
      @if (text().detail) {
        <span class="detail">{{ text().detail }}</span>
      }
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
    .online .dot {
      background: #3ddc84;
      box-shadow: 0 0 0 0 rgba(61, 220, 132, 0.6);
      animation: pulse 2s infinite;
    }
    .offline .dot {
      background: #e0533d;
    }
    .label {
      font-weight: 600;
    }
    .detail {
      color: var(--muted);
    }
    @keyframes pulse {
      70% {
        box-shadow: 0 0 0 0.6rem rgba(61, 220, 132, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(61, 220, 132, 0);
      }
    }
  `,
})
export class PresenceBadgeComponent {
  readonly text = input.required<PresenceText>();
}
