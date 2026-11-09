import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AUTHOR_MAX_LENGTH,
  BODY_MAX_LENGTH,
  Comment,
  CommentDraft,
} from '../core/domain/comment.model';
import { shortDateTime, timeAgo } from '../core/domain/formatting';

/** Comments: the form, the list and (with the key) the delete buttons. Only shows and emits. */
@Component({
  selector: 'app-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2>Comentarios</h2>

      <form (submit)="submit($event)">
        <input
          class="author"
          type="text"
          placeholder="Tu nombre (opcional)"
          aria-label="Tu nombre"
          [maxLength]="authorMax"
          [value]="author()"
          (input)="author.set($any($event.target).value)"
        />
        <textarea
          rows="3"
          placeholder="Déjale un mensaje al Yogui…"
          aria-label="Mensaje"
          [maxLength]="bodyMax"
          [value]="body()"
          (input)="body.set($any($event.target).value)"
        ></textarea>
        <!-- Honeypot: invisible to people, bots fill it in. -->
        <input
          class="hp"
          type="text"
          name="website"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
          [value]="website()"
          (input)="website.set($any($event.target).value)"
        />
        <div class="actions">
          <span class="count" [class.over]="remaining() < 0">{{ remaining() }}</span>
          <button type="submit" [disabled]="!canSend()">
            {{ posting() ? 'Enviando…' : 'Comentar' }}
          </button>
        </div>
      </form>

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      @if (comments().length > 0) {
        <ul>
          @for (comment of comments(); track comment.id) {
            <li>
              <div class="head">
                <strong>{{ comment.author }}</strong>
                <time [attr.datetime]="comment.createdAt.toISOString()" [title]="fullDate(comment)">
                  {{ ago(comment) }}
                </time>
                @if (moderating()) {
                  <button
                    type="button"
                    class="delete"
                    [attr.aria-label]="'Borrar comentario de ' + comment.author"
                    (click)="remove.emit(comment.id)"
                  >
                    Borrar
                  </button>
                }
              </div>
              <p>{{ comment.body }}</p>
            </li>
          }
        </ul>
      } @else {
        <p class="muted">Todavía no hay comentarios. ¡Sé el primero!</p>
      }

      @if (showModeration()) {
        <div class="moderation">
          @if (moderating()) {
            <button type="button" class="link" (click)="lock.emit()">Salir de moderación</button>
          } @else if (askingKey()) {
            <form (submit)="sendKey($event)">
              <input
                type="password"
                placeholder="Clave de moderación"
                aria-label="Clave de moderación"
                [value]="key()"
                (input)="key.set($any($event.target).value)"
              />
              <button type="submit" class="link" [disabled]="!key().trim()">Entrar</button>
            </form>
          } @else {
            <button type="button" class="link" (click)="askingKey.set(true)">Moderar</button>
          }
        </div>
      }
    </section>
  `,
  styles: `
    form {
      display: grid;
      gap: 0.6rem;
    }
    input,
    textarea {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border-radius: 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
      font: inherit;
    }
    textarea {
      resize: vertical;
    }
    .author {
      max-width: 280px;
    }
    .hp {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      opacity: 0;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
    }
    .count {
      font-size: 0.8rem;
      color: var(--muted);
    }
    .count.over {
      color: #ff6b6b;
    }
    button[type='submit']:not(.link) {
      padding: 0.5rem 1.2rem;
      border: 0;
      border-radius: 0.6rem;
      background: var(--gold);
      color: #1a1300;
      font-weight: 700;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .error {
      color: #ff6b6b;
      margin: 0.75rem 0 0;
    }
    ul {
      list-style: none;
      margin: 1.25rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.75rem;
    }
    li {
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.04);
    }
    .head {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
    }
    time {
      font-size: 0.8rem;
      color: var(--muted);
    }
    li p {
      margin: 0.3rem 0 0;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
    .delete {
      margin-left: auto;
      border: 0;
      background: none;
      color: #ff6b6b;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .moderation {
      margin-top: 1rem;
      text-align: right;
    }
    .moderation form {
      display: inline-flex;
      gap: 0.5rem;
    }
    .moderation input {
      width: 200px;
      padding: 0.3rem 0.6rem;
      font-size: 0.85rem;
    }
    .link {
      border: 0;
      background: none;
      color: var(--muted);
      font-size: 0.8rem;
      cursor: pointer;
      text-decoration: underline;
    }
  `,
})
export class CommentsComponent {
  readonly comments = input.required<Comment[]>();
  readonly now = input.required<Date>();
  readonly posting = input(false);
  readonly error = input<string | null>(null);
  readonly moderating = input(false);
  /** The "Moderar" link is hidden unless the page asks for it (see App). */
  readonly showModeration = input(false);
  /** Changes after each successful post: clears the form. */
  readonly posted = input(0);

  readonly send = output<CommentDraft>();
  readonly remove = output<number>();
  readonly unlock = output<string>();
  readonly lock = output<void>();

  protected readonly authorMax = AUTHOR_MAX_LENGTH;
  protected readonly bodyMax = BODY_MAX_LENGTH;
  protected readonly author = signal('');
  protected readonly body = signal('');
  protected readonly website = signal('');
  protected readonly askingKey = signal(false);
  protected readonly key = signal('');

  protected readonly remaining = computed(() => BODY_MAX_LENGTH - this.body().length);
  protected readonly canSend = computed(
    () => !this.posting() && this.body().trim().length > 0 && this.remaining() >= 0,
  );

  constructor() {
    effect(() => {
      if (this.posted() > 0) this.body.set('');
    });
    effect(() => {
      if (this.moderating()) {
        this.askingKey.set(false);
        this.key.set('');
      }
    });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.canSend()) return;
    this.send.emit({ author: this.author(), body: this.body(), website: this.website() });
  }

  protected sendKey(event: Event): void {
    event.preventDefault();
    const key = this.key().trim();
    if (key) this.unlock.emit(key);
  }

  protected ago(comment: Comment): string {
    return timeAgo(comment.createdAt, this.now());
  }

  protected fullDate(comment: Comment): string {
    return shortDateTime(comment.createdAt);
  }
}
