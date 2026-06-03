export type Effort = 'no-reasoning' | 'low' | 'medium' | 'high';
export type Provider = 'anthropic' | 'openai' | 'google';
export type Vibe = 'win' | 'lose' | 'soclose';
export type OutcomeKind = 'win' | 'soclose' | 'bust' | 'loweffort' | 'gemini';

export interface ModelDef {
  id: string;
  label: string;
  provider: Provider;
  slug: string;
  efforts: Effort[];
}

export interface HarnessDef {
  id: string;
  label: string;
  models: ModelDef[];
  buildCommand: (model: ModelDef, effort: Effort, prompt: string) => string;
}

export interface Outcome {
  kind: OutcomeKind;
  vibe: Vibe;
  title: string;
  subtitle: string;
  hue: number | null;
}

export const EFFORTS: Effort[] = ['no-reasoning', 'low', 'medium', 'high'];

export const quotePrompt = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
const hasReasoning = (effort: Effort) => effort !== 'no-reasoning';

export const MODELS = {
  'sonnet-4.6': {
    id: 'sonnet-4.6',
    label: 'Sonnet 4.6',
    provider: 'anthropic',
    slug: 'claude-sonnet-4-6',
    efforts: EFFORTS,
  },
  'haiku-4.6': {
    id: 'haiku-4.6',
    label: 'Haiku 4.6',
    provider: 'anthropic',
    slug: 'claude-haiku-4-6',
    efforts: EFFORTS,
  },
  'opus-4.8': {
    id: 'opus-4.8',
    label: 'Opus 4.8',
    provider: 'anthropic',
    slug: 'claude-opus-4-8',
    efforts: EFFORTS,
  },
  'gpt-5.5': {
    id: 'gpt-5.5',
    label: 'GPT-5.5',
    provider: 'openai',
    slug: 'gpt-5.5',
    efforts: ['low', 'medium', 'high'],
  },
  'gpt-5.4': {
    id: 'gpt-5.4',
    label: 'GPT-5.4',
    provider: 'openai',
    slug: 'gpt-5.4',
    efforts: ['low', 'medium', 'high'],
  },
  'gpt-5.4-mini': {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4-mini',
    provider: 'openai',
    slug: 'gpt-5.4-mini',
    efforts: ['no-reasoning', 'low', 'medium'],
  },
  'gpt-5.3-codex-spark': {
    id: 'gpt-5.3-codex-spark',
    label: 'GPT-5.3-codex-spark',
    provider: 'openai',
    slug: 'gpt-5.3-codex-spark',
    efforts: ['low', 'medium', 'high'],
  },
  'gemini-3.1-pro': {
    id: 'gemini-3.1-pro',
    label: 'Gemini 3.1 Pro',
    provider: 'google',
    slug: 'gemini-3.1-pro',
    efforts: ['low', 'medium', 'high'],
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    provider: 'google',
    slug: 'gemini-3.5-flash',
    efforts: EFFORTS,
  },
} satisfies Record<string, ModelDef>;

type ModelKey = keyof typeof MODELS;
const models = (...keys: ModelKey[]) => keys.map((key) => MODELS[key]);

export const HARNESSES: HarnessDef[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    models: models('sonnet-4.6', 'haiku-4.6', 'opus-4.8'),
    buildCommand: (model, effort, prompt) =>
      `claude --model ${model.id}${hasReasoning(effort) ? ` --effort ${effort}` : ''} ${quotePrompt(prompt)}`,
  },
  {
    id: 'codex',
    label: 'Codex',
    models: models('gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex-spark'),
    buildCommand: (model, effort, prompt) =>
      `codex -m ${model.id}${hasReasoning(effort) ? ` -c model_reasoning_effort="${effort}"` : ''} ${quotePrompt(prompt)}`,
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    models: models(
      'sonnet-4.6',
      'haiku-4.6',
      'opus-4.8',
      'gpt-5.5',
      'gpt-5.4',
      'gpt-5.4-mini',
      'gpt-5.3-codex-spark',
      'gemini-3.1-pro',
      'gemini-3.5-flash'
    ),
    buildCommand: (model, effort, prompt) =>
      `opencode run -m ${model.provider}/${model.slug}${hasReasoning(effort) ? ` --variant ${effort}` : ''} ${quotePrompt(prompt)}`,
  },
  {
    id: 'pi',
    label: 'Pi',
    models: models('sonnet-4.6', 'haiku-4.6', 'opus-4.8', 'gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini'),
    buildCommand: (model, _effort, prompt) => `pi --model ${model.id} ${quotePrompt(prompt)}`,
  },
  {
    id: 'antigravity',
    label: 'Antigravity CLI',
    models: models('gemini-3.1-pro', 'gemini-3.5-flash'),
    buildCommand: (model, _effort, prompt) => `agy -m ${model.id} ${quotePrompt(prompt)}`,
  },
  {
    id: 'cursor',
    label: 'Cursor CLI',
    models: models('sonnet-4.6', 'opus-4.8', 'gpt-5.5', 'gpt-5.4', 'gemini-3.1-pro'),
    buildCommand: (model, _effort, prompt) =>
      `cursor-agent --model ${model.id} ${quotePrompt(prompt)}`,
  },
];

const GREAT_MODELS = new Set(['opus-4.8', 'gpt-5.5']);
const DUMB_MODELS = new Set(['sonnet-4.6', 'haiku-4.6', 'gpt-5.4-mini', 'gpt-5.3-codex-spark']);
const GOOD_HARNESSES = new Set(['cursor', 'claude-code', 'codex']);

export function classifySlot(harness: HarnessDef, model: ModelDef, effort: Effort): Outcome {
  const lowEffort = effort === 'no-reasoning' || effort === 'low';

  if (model.provider === 'google') {
    return {
      kind: 'gemini',
      vibe: 'lose',
      hue: 265,
      title: '🫠  T O U G H   L U C K  : (',
      subtitle: `you rolled ${model.label}. tough luck :(   —   press ⏎ to run it anyway`,
    };
  }

  if (DUMB_MODELS.has(model.id)) {
    return {
      kind: 'bust',
      vibe: 'lose',
      hue: 0,
      title: '💀  B U S T  💀',
      subtitle: `${model.label}?! that thing couldn't ship a semicolon. catastrophic.   —   ⏎ anyway`,
    };
  }

  if (lowEffort) {
    if (GREAT_MODELS.has(model.id) && GOOD_HARNESSES.has(harness.id)) {
      return {
        kind: 'soclose',
        vibe: 'soclose',
        hue: 38,
        title: '😫  S O   C L O S E !',
        subtitle: `${model.label} on ${harness.label}… and then ${effort} effort?! so close.   —   ⏎ to run it`,
      };
    }

    return {
      kind: 'loweffort',
      vibe: 'lose',
      hue: 14,
      title: '📉  L O W   E F F O R T',
      subtitle: `${effort} reasoning on ${model.label}? you get what you pay for.   —   ⏎ anyway`,
    };
  }

  return {
    kind: 'win',
    vibe: 'win',
    hue: null,
    title: '🎉  J A C K P O T !  🎉',
    subtitle: `${model.label} on ${harness.label} @ ${effort} effort — now go ship it 🚀   —   ⏎ to run`,
  };
}

export function positiveMod(value: number, length: number) {
  return ((value % length) + length) % length;
}
