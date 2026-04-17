export type ActionId =
  | 'fix'
  | 'rewrite'
  | 'sharpen'
  | 'shorten'
  | 'expand'
  | 'professional'
  | 'friendly'
  | 'persuasive'
  | 'confident'
  | 'formal'
  | 'academic'
  | 'simplify'
  | 'paraphrase'
  | 'vocabulary'
  | 'tone-detect'
  | 'reply'
  | 'summarise'
  | 'brainstorm'
  | 'draft'
  | 'custom';

export interface WritingAction {
  id: ActionId;
  label: string;
  description: string;
  icon: string;
  slash: string;
  category: ActionCategory;
  promptTemplate: string;
}

export type ActionCategory = 'fix' | 'rewrite' | 'tone' | 'length' | 'generate' | 'analyse';

export interface PromptContext {
  selectedText: string;
  surroundingText?: string;
  fieldType?: string;
  pageTitle?: string;
  pageUrl?: string;
  tabContexts?: TabContext[];
  customInstruction?: string;
  writingStyle?: WritingStyle;
}

export interface TabContext {
  tabId: number;
  title: string;
  url: string;
  content: string;
  relevanceScore?: number;
}

export interface WritingStyle {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  isBuiltIn: boolean;
  category: ActionCategory;
}
