import type { PromptTemplate, ActionCategory } from '@draftly/shared';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'fix-grammar',
    name: 'Fix Grammar & Spelling',
    category: 'fix',
    isBuiltIn: true,
    template: `Fix the grammar, spelling, and punctuation in the following text. Preserve the original meaning, tone, and style. Only correct errors — do not rephrase or rewrite unless necessary for grammatical correctness.

Return ONLY the corrected text with no explanation, preamble, or commentary.

Text:
{{text}}`,
  },
  {
    id: 'rewrite-clarity',
    name: 'Rewrite for Clarity',
    category: 'rewrite',
    isBuiltIn: true,
    template: `Rewrite the following text to be clearer and easier to read. Improve sentence structure and flow while preserving the original meaning and key information.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    category: 'rewrite',
    isBuiltIn: true,
    template: `Sharpen the following text. Make it tighter, more precise, and more impactful. Remove filler words, reduce redundancy, and strengthen word choices. Keep the same meaning and tone.

Return ONLY the sharpened text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'shorten',
    name: 'Shorten',
    category: 'length',
    isBuiltIn: true,
    template: `Make the following text shorter and more concise. Remove unnecessary words and phrases while preserving all key information and meaning. Aim for roughly 50-70% of the original length.

Return ONLY the shortened text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'expand',
    name: 'Expand',
    category: 'length',
    isBuiltIn: true,
    template: `Expand the following text with more detail, examples, or explanation where appropriate. Make it more thorough and informative while maintaining the same tone and style.

Return ONLY the expanded text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-professional',
    name: 'Professional Tone',
    category: 'tone',
    isBuiltIn: true,
    template: `Rewrite the following text in a professional, polished tone suitable for business communication. Keep the same message and information, but adjust the language to be formal yet approachable.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-friendly',
    name: 'Friendly Tone',
    category: 'tone',
    isBuiltIn: true,
    template: `Rewrite the following text in a warm, friendly, and conversational tone. Make it feel natural and approachable while preserving the core message.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-persuasive',
    name: 'Persuasive Tone',
    category: 'tone',
    isBuiltIn: true,
    template: `Rewrite the following text to be more persuasive and compelling. Use stronger language, better structure, and rhetorical techniques to make the argument more convincing. Keep the same core points.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'simplify',
    name: 'Simplify',
    category: 'rewrite',
    isBuiltIn: true,
    template: `Simplify the following text. Use shorter sentences, simpler words, and a more direct style. Make it accessible to a broad audience without losing the essential meaning.

Return ONLY the simplified text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'generate-reply',
    name: 'Generate Reply',
    category: 'generate',
    isBuiltIn: true,
    template: `Draft a thoughtful reply to the following message. Match an appropriate tone based on the context — professional if the original is professional, casual if it's casual. Be helpful and direct.

{{#if customInstruction}}
Additional instruction: {{customInstruction}}
{{/if}}

Return ONLY the reply text with no explanation or meta-commentary.

Message to reply to:
{{text}}`,
  },
  {
    id: 'summarise',
    name: 'Summarise',
    category: 'length',
    isBuiltIn: true,
    template: `Summarise the following text concisely. Capture the key points in a brief summary. Use bullet points if the content has multiple distinct points, otherwise use a short paragraph.

Return ONLY the summary with no preamble.

Text:
{{text}}`,
  },
  {
    id: 'paraphrase',
    name: 'Paraphrase',
    category: 'rewrite',
    isBuiltIn: true,
    template: `Rephrase the following text using different words and sentence structures while preserving the exact same meaning. The result should read naturally and not feel like a mechanical substitution.

Return ONLY the paraphrased text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'vocabulary-enhance',
    name: 'Enhance Vocabulary',
    category: 'rewrite',
    isBuiltIn: true,
    template: `Improve the vocabulary in the following text. Replace weak, generic, or overused words with stronger, more precise, and more engaging alternatives. Keep the meaning and tone intact. Do not make it sound unnatural or overly complex — aim for elevated but readable.

Return ONLY the improved text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-confident',
    name: 'Confident Tone',
    category: 'tone',
    isBuiltIn: true,
    template: `Rewrite the following text to sound more confident and assertive. Remove hedging language (maybe, I think, sort of, perhaps, just), use active voice, and make statements direct and decisive. Do not make it aggressive — aim for calm authority.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-formal',
    name: 'Formal Tone',
    category: 'tone',
    isBuiltIn: true,
    template: `Rewrite the following text in a formal register suitable for official correspondence, legal documents, or institutional communication. Use proper grammar, avoid contractions, and maintain a respectful, impersonal tone.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-academic',
    name: 'Academic Tone',
    category: 'tone',
    isBuiltIn: true,
    template: `Rewrite the following text in an academic style suitable for research papers, essays, or scholarly publications. Use precise language, formal register, appropriate hedging, and objective tone. Avoid colloquialisms and first person where possible.

Return ONLY the rewritten text with no explanation.

Text:
{{text}}`,
  },
  {
    id: 'tone-detect',
    name: 'Detect Tone',
    category: 'analyse',
    isBuiltIn: true,
    template: `Analyse the tone of the following text. Provide:

1. **Overall tone** (e.g. professional, casual, aggressive, passive, friendly, formal, uncertain, confident)
2. **Emotional register** (e.g. neutral, positive, negative, enthusiastic, apologetic)
3. **Formality level** (1-5, where 1 is very casual and 5 is very formal)
4. **Confidence level** (1-5, where 1 is very hedging and 5 is very assertive)
5. **Key signals** — the specific words or phrases that create this impression
6. **Suggestion** — one brief recommendation for how the tone could be improved for clarity or impact

Keep the analysis concise and actionable.

Text:
{{text}}`,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    category: 'generate',
    isBuiltIn: true,
    template: `Based on the following text or topic, brainstorm 5-7 creative ideas, angles, or directions. For each idea, give a one-line description. Be diverse — include obvious angles and unexpected ones.

{{#if customInstruction}}
Focus: {{customInstruction}}
{{/if}}

Topic/text:
{{text}}`,
  },
  {
    id: 'draft',
    name: 'Draft from Notes',
    category: 'generate',
    isBuiltIn: true,
    template: `Turn the following rough notes, bullet points, or fragments into polished, well-structured prose. Maintain the key information and intent. Fill in natural transitions and connective tissue. Match an appropriate tone based on the content.

{{#if customInstruction}}
Style guidance: {{customInstruction}}
{{/if}}

Return ONLY the drafted text with no explanation.

Notes:
{{text}}`,
  },
  {
    id: 'custom',
    name: 'Custom',
    category: 'rewrite',
    isBuiltIn: true,
    template: `{{customInstruction}}

Text:
{{text}}`,
  },
];

export function getTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ActionCategory): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((t) => t.category === category);
}
