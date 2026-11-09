import { TestBed } from '@angular/core/testing';
import { FakeCommentsGateway, MemoryModerationKeyStore } from '../../testing/fake-comments.gateway';
import { CommentsFacade } from './comments.facade';
import { COMMENTS_GATEWAY, MODERATION_KEY_STORE } from './comments.gateway';

describe('CommentsFacade', () => {
  let gateway: FakeCommentsGateway;
  let keys: MemoryModerationKeyStore;

  function create(): CommentsFacade {
    TestBed.configureTestingModule({
      providers: [
        CommentsFacade,
        { provide: COMMENTS_GATEWAY, useValue: gateway },
        { provide: MODERATION_KEY_STORE, useValue: keys },
      ],
    });
    return TestBed.inject(CommentsFacade);
  }

  beforeEach(() => {
    gateway = new FakeCommentsGateway();
    keys = new MemoryModerationKeyStore();
  });

  it('loads the comments', () => {
    const facade = create();
    facade.load();
    expect(facade.comments().map((c) => c.body)).toEqual(['¡Vamos Yogui!']);
  });

  it('puts a new comment on top and signals the form to clear', () => {
    const facade = create();
    facade.load();
    facade.post({ author: '', body: 'Sube rápido', website: '' });
    expect(facade.comments()[0]).toEqual(jasmine.objectContaining({ author: 'Anónimo', body: 'Sube rápido' }));
    expect(facade.posted()).toBe(1);
    expect(facade.posting()).toBeFalse();
  });

  it('shows the reason when a comment is rejected', () => {
    gateway.postError = new Error('Espera unos segundos antes de comentar de nuevo.');
    const facade = create();
    facade.post({ author: '', body: 'otra', website: '' });
    expect(facade.error()).toContain('Espera');
    expect(facade.posted()).toBe(0);
  });

  it('enters moderation with a valid key, remembers it and deletes', () => {
    const facade = create();
    facade.load();
    facade.unlock('admin-key');
    expect(facade.moderating()).toBeTrue();
    expect(keys.key).toBe('admin-key');

    facade.remove(1);
    expect(gateway.removed).toEqual([1]);
    expect(facade.comments()).toEqual([]);
  });

  it('rejects a wrong key and resumes moderation from a saved key', () => {
    const facade = create();
    facade.unlock('nope');
    expect(facade.moderating()).toBeFalse();
    expect(facade.error()).toContain('incorrecta');

    TestBed.resetTestingModule();
    keys = new MemoryModerationKeyStore('admin-key');
    expect(create().moderating()).toBeTrue();
  });
});
