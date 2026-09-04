import { describe, expect, it } from 'vitest';
import { renderToString } from 'hono/jsx/dom/server';
import { Icon } from '../../src/views/icon';

describe('Icon', () => {
  it('gives meaningful icons an accessible English name', () => {
    expect(renderToString(Icon({ name: 'lock', label: 'Answers are sealed' }))).toContain(
      'aria-label="Answers are sealed"',
    );
  });
  it('hides decorative icons from assistive technology', () => {
    const html = renderToString(Icon({ name: 'clock' }));
    expect(html).toContain('class="size-4 flex items-center"');
    expect(html).toContain('aria-hidden="true"');
  });
});
