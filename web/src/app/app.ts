import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CharacterFacade } from './core/application/character.facade';
import { levelSinceText, presenceText, timeAgo } from './core/domain/formatting';
import { EquipmentComponent } from './ui/equipment.component';
import { FunStatsComponent } from './ui/fun-stats.component';
import { HeroComponent } from './ui/hero.component';
import { LevelHistoryComponent } from './ui/level-history.component';
import { ProgressComponent } from './ui/progress.component';
import { StatsComponent } from './ui/stats.component';

/** Page shell: reads state from the facade and hands it to presentational components. */
@Component({
  selector: 'app-root',
  imports: [
    HeroComponent,
    EquipmentComponent,
    StatsComponent,
    ProgressComponent,
    FunStatsComponent,
    LevelHistoryComponent,
  ],
  providers: [CharacterFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly facade = inject(CharacterFacade);

  protected readonly presence = computed(() => {
    const c = this.facade.overview();
    return c ? presenceText(c.presence, this.facade.now()) : null;
  });
  protected readonly levelSince = computed(() => {
    const c = this.facade.overview();
    return c ? levelSinceText(c.levelSince, c.level, this.facade.now()) : null;
  });
  protected readonly updatedAgo = computed(() => {
    const c = this.facade.overview();
    return c ? timeAgo(c.profileFetchedAt, this.facade.now()) : null;
  });

  ngOnInit(): void {
    this.facade.refresh();
  }
}
