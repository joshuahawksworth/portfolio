import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/components/apps/WordApp';

describe('renderMarkdown (Word print layout)', () => {
  it('renders headings, emphasis, lists, quotes and code fences', () => {
    const html = renderMarkdown(
      ['# Title', '', 'Some **bold** and *italic* with `code`.', '- one', '- two', '> quoted', '```ts', 'const a = 1;', '```'].join('\n')
    );
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<ul>\n<li>one</li>\n<li>two</li>\n</ul>');
    expect(html).toContain('<blockquote>quoted</blockquote>');
    expect(html).toContain('<pre><code>const a = 1;</code></pre>');
  });

  it('escapes HTML in the source', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
  });
});
