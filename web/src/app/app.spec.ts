import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { CHARACTER_GATEWAY } from './core/application/character.gateway';
import { COMMENTS_GATEWAY, MODERATION_KEY_STORE } from './core/application/comments.gateway';
import { FakeCharacterGateway, anOverview } from './testing/fake-character.gateway';
import { FakeCommentsGateway, MemoryModerationKeyStore } from './testing/fake-comments.gateway';

describe('App (page)', () => {
  let gateway: FakeCharacterGateway;

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    gateway = new FakeCharacterGateway();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: CHARACTER_GATEWAY, useValue: gateway },
        { provide: COMMENTS_GATEWAY, useValue: new FakeCommentsGateway() },
        { provide: MODERATION_KEY_STORE, useValue: new MemoryModerationKeyStore() },
      ],
    }).compileComponents();
  });

  it('answers the question with the level and the character', () => {
    const page = render();
    expect(page.querySelector('h1')?.textContent).toContain('¿Qué nivel está el Yogui?');
    expect(page.querySelector('.answer')?.textContent).toContain('10');
    expect(page.textContent).toContain('Dr Yogui');
    expect(page.textContent).toContain('Cazador tauren');
  });

  it('shows the last connection and the equipment', () => {
    const page = render();
    expect(page.textContent).toContain('Última conexión');
    expect(page.textContent).toContain('Escopeta compacta');
    expect(page.textContent).toContain('Herbalism');
  });

  it('shows the time at the current level and the fun stats', () => {
    const page = render();
    expect(page.querySelector('.since')?.textContent).toContain('Lleva al menos');
    expect(page.querySelector('.since')?.textContent).toContain('en nivel 10');
    expect(page.textContent).toContain('Datos curiosos');
    expect(page.textContent).toContain('Criaturas muertas');
  });

  it('shows "Conectado ahora" when live presence says online', () => {
    gateway.overview = anOverview({
      level: 11,
      presence: { status: 'online', lastSeenAt: new Date(), source: 'live' },
    });
    const page = render();
    expect(page.textContent).toContain('Conectado ahora');
    expect(page.querySelector('.answer')?.textContent).toContain('11');
  });

  it('shows an error message when the API is down', () => {
    gateway.overview = new Error('down');
    expect(render().textContent).toContain('No pudimos obtener los datos');
  });

  it('shows the deaths, total and at the current level', () => {
    const deaths = render().querySelector('.deaths')?.textContent ?? '';
    expect(deaths).toContain('Muertes');
    expect(deaths).toContain('24');
    expect(deaths).toContain('2 en nivel 10 desde que se registró');
  });

  it('shows the comments and the form', () => {
    const page = render();
    expect(page.textContent).toContain('Comentarios');
    expect(page.textContent).toContain('¡Vamos Yogui!');
    expect(page.querySelector('textarea')).not.toBeNull();
  });
});
