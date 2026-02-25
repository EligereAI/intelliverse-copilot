// ── Modality ───────────────────────────────────────────────────────────────────
export interface ModalityConfig {
  label: string | Record<string, string>;   // can be a plain string OR a lang-keyed map
  description?: string;
  chainOfThoughtActive?: boolean;
}

// ── Bot (per modality) ─────────────────────────────────────────────────────────
export interface BotConfig {
  bot_welcome_message: Record<string, string[]>;  // { en: [...] }
  voiceInputLanguages?: string[];
  productImages?: boolean;
  definedTags?: string[];
  [key: string]: unknown;                         // allow extra fields
}

// ── CSS / branding ─────────────────────────────────────────────────────────────
export interface CompanyCss {
  logo?: string;
  botName: string;
  fontFamily?: string;
  fontSize?: string;
  startChatBtn?: {
    bg?: string;
    url?: string;
    text?: string;
  };
  titleBar?: { color?: string; bg?: string };
  chatArea?: { color?: string; bg?: string };
  botMessage?: { color?: string; bg?: string; icon?: string };
  userMessage?: { color?: string; bg?: string };
}

// ── Support URLs (per modality + lang) ────────────────────────────────────────
export type SupportUrl = Record<string, Record<string, string>>;

// ── Company ────────────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  website?: string;
  status: boolean;
  css: CompanyCss;

  // Modality keys → display config
  modality?: Record<string, ModalityConfig>;

  // Modality keys → bot runtime config
  bots?: Record<string, BotConfig>;

  // Fallback when neither modality nor bots defined
  bot_welcome_message?: Record<string, string[]>;

  support?: {
    welcome_message?: Record<string, string[]>;
    privacyPolicyEnabled?: boolean;
    privacyPolicy?: string | Record<string, string>;
    disclaimer?: string | Record<string, string>;
  };

  bot_intro_message?: Record<string, string[]>;

  // Feature flags
  voiceInputEnabled?: boolean;
  voiceOutputEnabled?: boolean;
  commentEnabled?: boolean;
  humanSupportDisabled?: boolean;
  mathJaxEnabled?: boolean;
  markedJsEnabled?: boolean;
  collectFeedback?: boolean;
  persistSession?: boolean;
  enablePopout?: boolean;
  popOutMessage?: string;
  mandateFeedback?: boolean;

  // Languages
  default_language?: string;
  languages?: string[];
  voiceInputLanguages?: string[];

  supportUrl?: SupportUrl;
}

// ── Resolved modality (mirrors server's defineModality output) ─────────────────
export interface ResolvedModality {
  key: string;                          // e.g. "technical"
  displayLabel: string;                 // resolved for current lang
  description?: string;
  chainOfThoughtActive: boolean;
  bot_welcome_message: Record<string, string[]>;
  voiceInputLanguages: string[];
  productImages: boolean;
  definedTags: string[];
}