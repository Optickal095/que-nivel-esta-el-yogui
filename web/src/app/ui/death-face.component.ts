import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The Yogui's face with the death count "tattooed" on the forehead.
 * The number sits over the photo with CSS (multiply blend + slight rotation
 * to follow the head), so it updates with the data without editing the image.
 */
@Component({
  selector: 'app-death-face',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="face" [attr.aria-label]="'Muertes: ' + deaths()">
      <img src="yogui-face.jpg" alt="" />
      <span class="tattoo" aria-hidden="true">
        <span class="flourish">☙</span>
        <span class="count">{{ deaths() }}</span>
        <span class="flourish">❧</span>
      </span>
    </figure>
  `,
  styles: `
    .face {
      position: relative;
      margin: 0;
      container-type: inline-size;
      border-radius: 1rem;
      overflow: hidden;
      aspect-ratio: 480 / 560;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* Centered on the forehead of yogui-face.jpg (measured on the 480×560 crop). */
    .tattoo {
      position: absolute;
      left: 51%;
      top: 30.5%;
      transform: translate(-50%, -50%) rotate(-4deg);
      display: flex;
      align-items: center;
      gap: 3cqw;
      white-space: nowrap;
      color: rgba(28, 22, 22, 0.8);
      mix-blend-mode: multiply;
      filter: blur(0.3px);
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1;
    }
    .count {
      font-size: 17cqw;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .flourish {
      font-size: 7cqw;
      opacity: 0.75;
    }
  `,
})
export class DeathFaceComponent {
  readonly deaths = input.required<number>();
}
