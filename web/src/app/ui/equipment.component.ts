import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EquippedItem } from '../core/domain/character.model';
import { QUALITY_COLORS, sortBySlot } from '../core/domain/formatting';

@Component({
  selector: 'app-equipment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Equipo</h2>
      @if (items().length === 0) {
        <p class="muted">Sin ítems equipados.</p>
      } @else {
        <ul>
          @for (item of sorted(); track item.slot) {
            <li [style.--quality]="color(item)">
              @if (item.iconUrl) {
                <img [src]="item.iconUrl" alt="" width="40" height="40" loading="lazy" />
              } @else {
                <span class="icon-placeholder" aria-hidden="true"></span>
              }
              <div>
                <span class="name">{{ item.name }}</span>
                <span class="slot">{{ item.slotName }} · nivel {{ item.itemLevel }}</span>
                @for (enchant of item.enchantments; track enchant) {
                  <span class="enchant">{{ enchant }}</span>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.75rem;
    }
    li {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    img,
    .icon-placeholder {
      width: 40px;
      height: 40px;
      flex: none;
      border-radius: 6px;
      border: 2px solid var(--quality);
      background: #000;
    }
    .name {
      display: block;
      color: var(--quality);
      font-weight: 600;
    }
    .slot,
    .enchant {
      display: block;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .enchant {
      color: #1eff00;
    }
  `,
})
export class EquipmentComponent {
  readonly items = input.required<EquippedItem[]>();

  protected readonly sorted = computed(() => sortBySlot(this.items()));
  protected color(item: EquippedItem): string {
    return QUALITY_COLORS[item.quality];
  }
}
