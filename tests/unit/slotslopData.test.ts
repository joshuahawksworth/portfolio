import { describe, expect, it } from 'vitest';
import { classifySlot, HARNESSES } from '../../src/components/apps/slotslopData';

function findHarness(label: string) {
  const harness = HARNESSES.find((item) => item.label === label);
  if (!harness) throw new Error(`Missing harness: ${label}`);
  return harness;
}

describe('slotslop data', () => {
  it('builds the real cursor command syntax', () => {
    const harness = findHarness('Cursor CLI');
    const model = harness.models.find((item) => item.id === 'gpt-5.5');
    if (!model) throw new Error('Missing GPT-5.5 for Cursor CLI');

    expect(harness.buildCommand(model, 'medium', 'release slotslop')).toBe(
      "cursor-agent --model gpt-5.5 'release slotslop'"
    );
  });

  it('classifies Gemini rolls as tough luck', () => {
    const harness = findHarness('Antigravity CLI');
    const model = harness.models.find((item) => item.id === 'gemini-3.5-flash');
    if (!model) throw new Error('Missing Gemini Flash for Antigravity CLI');

    const outcome = classifySlot(harness, model, 'medium');
    expect(outcome.kind).toBe('gemini');
    expect(outcome.title).toContain('T O U G H');
  });
});
