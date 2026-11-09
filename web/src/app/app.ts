import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CharacterFacade } from './core/application/character.facade';
import { CommentsFacade } from './core/application/comments.facade';
import {
  deathsAtLevelText,
  levelSinceText,
  presenceText,
  timeAgo,
} from './core/domain/formatting';
import { CommentsComponent } from './ui/comments.component';
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
    CommentsComponent,
  ],
  providers: [CharacterFacade, CommentsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly facade = inject(CharacterFacade);
  protected readonly comments = inject(CommentsFacade);
  /** Moderation stays hidden from visitors: open the site with "?moderar" to see it. */
  protected readonly moderationRequested = new URLSearchParams(
    inject(DOCUMENT).location.search,
  ).has('moderar');

  protected readonly presence = computed(() => {
    const c = this.facade.overview();
    return c ? presenceText(c.presence, this.facade.now()) : null;
  });
  protected readonly levelSince = computed(() => {
    const c = this.facade.overview();
    return c ? levelSinceText(c.levelSince, c.level, this.facade.now()) : null;
  });
  protected readonly deathsAtLevel = computed(() => {
    const c = this.facade.overview();
    return c ? deathsAtLevelText(c.deathsAtLevel, c.level) : null;
  });
  protected readonly updatedAgo = computed(() => {
    const c = this.facade.overview();
    return c ? timeAgo(c.profileFetchedAt, this.facade.now()) : null;
  });

  ngOnInit(): void {
    this.facade.refresh();
    this.comments.load();
  }
}
