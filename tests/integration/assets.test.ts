import { describe, expect, it } from 'vitest';
import { iconSvg } from '../../src/generated/icons';
import { createApp } from '../../src/app';

describe('visual assets', () => {
  it('contains only the fixed generated icon allowlist', () => {
    expect(Object.keys(iconSvg).sort()).toEqual([
      'arrowLeft',
      'arrowRight',
      'bookOpen',
      'check',
      'clock',
      'copy',
      'edit',
      'feather',
      'lock',
      'trash',
      'unlock',
      'users',
    ]);
    expect(JSON.stringify(iconSvg)).not.toContain('<script');
  });
  it('loads the fixed stylesheet from the shared page layout', async () => {
    expect(await (await createApp().request('http://example.test/')).text()).toContain(
      'href="/styles.css"',
    );
  });
});
