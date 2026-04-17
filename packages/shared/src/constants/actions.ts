import type { WritingAction } from '../types/prompt';

export const WRITING_ACTIONS: WritingAction[] = [
  // ---- Fix ----
  {
    id: 'fix',
    label: 'Fix grammar & spelling',
    description: 'Correct grammar, spelling, and punctuation errors',
    icon: '✓',
    slash: '/fix',
    category: 'fix',
    promptTemplate: 'fix-grammar',
  },

  // ---- Rewrite ----
  {
    id: 'rewrite',
    label: 'Rewrite for clarity',
    description: 'Rewrite to be clearer and easier to read',
    icon: '↻',
    slash: '/rewrite',
    category: 'rewrite',
    promptTemplate: 'rewrite-clarity',
  },
  {
    id: 'sharpen',
    label: 'Sharpen',
    description: 'Make the writing tighter and more precise',
    icon: '◆',
    slash: '/sharpen',
    category: 'rewrite',
    promptTemplate: 'sharpen',
  },
  {
    id: 'simplify',
    label: 'Simplify',
    description: 'Use simpler words and shorter sentences',
    icon: '≡',
    slash: '/simplify',
    category: 'rewrite',
    promptTemplate: 'simplify',
  },
  {
    id: 'paraphrase',
    label: 'Paraphrase',
    description: 'Rephrase in different words while keeping the same meaning',
    icon: '⇄',
    slash: '/paraphrase',
    category: 'rewrite',
    promptTemplate: 'paraphrase',
  },
  {
    id: 'vocabulary',
    label: 'Enhance vocabulary',
    description: 'Suggest stronger, more engaging word choices',
    icon: '✦',
    slash: '/vocabulary',
    category: 'rewrite',
    promptTemplate: 'vocabulary-enhance',
  },

  // ---- Tone ----
  {
    id: 'professional',
    label: 'Professional',
    description: 'Polished, business-appropriate tone',
    icon: '◈',
    slash: '/professional',
    category: 'tone',
    promptTemplate: 'tone-professional',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, conversational, and approachable',
    icon: '○',
    slash: '/friendly',
    category: 'tone',
    promptTemplate: 'tone-friendly',
  },
  {
    id: 'persuasive',
    label: 'Persuasive',
    description: 'Compelling and convincing',
    icon: '▸',
    slash: '/persuasive',
    category: 'tone',
    promptTemplate: 'tone-persuasive',
  },
  {
    id: 'confident',
    label: 'Confident',
    description: 'Assertive and self-assured without being aggressive',
    icon: '◉',
    slash: '/confident',
    category: 'tone',
    promptTemplate: 'tone-confident',
  },
  {
    id: 'formal',
    label: 'Formal',
    description: 'Formal register for official communication',
    icon: '▣',
    slash: '/formal',
    category: 'tone',
    promptTemplate: 'tone-formal',
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'Scholarly tone suitable for papers and research',
    icon: '◫',
    slash: '/academic',
    category: 'tone',
    promptTemplate: 'tone-academic',
  },

  // ---- Length ----
  {
    id: 'shorten',
    label: 'Shorten',
    description: 'Make it more concise without losing meaning',
    icon: '⊟',
    slash: '/shorten',
    category: 'length',
    promptTemplate: 'shorten',
  },
  {
    id: 'expand',
    label: 'Expand',
    description: 'Add more detail and depth',
    icon: '⊞',
    slash: '/expand',
    category: 'length',
    promptTemplate: 'expand',
  },
  {
    id: 'summarise',
    label: 'Summarise',
    description: 'Create a concise summary',
    icon: '∑',
    slash: '/summarise',
    category: 'length',
    promptTemplate: 'summarise',
  },

  // ---- Analyse ----
  {
    id: 'tone-detect',
    label: 'Detect tone',
    description: 'Analyse how your writing comes across to readers',
    icon: '◎',
    slash: '/tone',
    category: 'analyse',
    promptTemplate: 'tone-detect',
  },

  // ---- Generate ----
  {
    id: 'reply',
    label: 'Generate reply',
    description: 'Draft a reply to the selected text',
    icon: '↩',
    slash: '/reply',
    category: 'generate',
    promptTemplate: 'generate-reply',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    description: 'Generate ideas and angles based on the topic',
    icon: '✧',
    slash: '/brainstorm',
    category: 'generate',
    promptTemplate: 'brainstorm',
  },
  {
    id: 'draft',
    label: 'Draft from notes',
    description: 'Turn rough notes or bullet points into polished prose',
    icon: '▤',
    slash: '/draft',
    category: 'generate',
    promptTemplate: 'draft',
  },
  {
    id: 'custom',
    label: 'Custom instruction',
    description: 'Write your own instruction for the AI',
    icon: '⌘',
    slash: '/custom',
    category: 'rewrite',
    promptTemplate: 'custom',
  },
];

export const ACTION_CATEGORIES = {
  fix: { label: 'Fix', order: 0 },
  rewrite: { label: 'Rewrite', order: 1 },
  tone: { label: 'Tone', order: 2 },
  length: { label: 'Length', order: 3 },
  analyse: { label: 'Analyse', order: 4 },
  generate: { label: 'Generate', order: 5 },
} as const;

export function getActionById(id: string): WritingAction | undefined {
  return WRITING_ACTIONS.find((a) => a.id === id);
}

export function getActionBySlash(slash: string): WritingAction | undefined {
  const normalized = slash.startsWith('/') ? slash : `/${slash}`;
  return WRITING_ACTIONS.find((a) => a.slash === normalized);
}

export function getActionsByCategory(category: string): WritingAction[] {
  return WRITING_ACTIONS.filter((a) => a.category === category);
}
