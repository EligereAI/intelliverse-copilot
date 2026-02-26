import type { Company, ResolvedModality, BotConfig, ModalityConfig } from "@/app/types/company";

// Fetch company config from our Next.js API route
export async function fetchCompany(companyId: string): Promise<Company> {
  const id = companyId.trim();
  const url = `/api/company?companyId=${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Failed to fetch company: ${res.status}`);
  }

  return res.json() as Promise<Company>;
}

// Resolve label string from language-keyed map or plain string
function resolveLabel(
  label: string | Record<string, string> | undefined,
  lang: string,
  fallback: string,
): string {
  if (!label) return fallback;
  if (typeof label === "string") return label;
  return label[lang] ?? label["en"] ?? fallback;
}

// Mirror of server's defineModality — works on the raw MongoDB document
export function resolveModalities(
  company: Company,
  lang = "en",
): ResolvedModality[] {
  const { modality, bots } = company;

  const makeResolved = (
    key: string,
    botData: BotConfig,
    modalityDisplay?: ModalityConfig,
  ): ResolvedModality => ({
    key,
    displayLabel: resolveLabel(modalityDisplay?.label, lang, key),
    description: modalityDisplay?.description,
    chainOfThoughtActive: modalityDisplay?.chainOfThoughtActive === true,
    bot_welcome_message: botData.bot_welcome_message ?? {},
    voiceInputLanguages: botData.voiceInputLanguages ?? [],
    productImages: botData.productImages ?? false,
    definedTags: botData.definedTags ?? [],
  });

  // Case 1: Both modality map and bots map exist
  if (
    modality && typeof modality === "object" && Object.keys(modality).length > 0 &&
    bots   && typeof bots   === "object" && Object.keys(bots).length   > 0
  ) {
    return Object.keys(modality)
      .filter((k) => bots[k])
      .map((k) => makeResolved(k, bots[k], modality[k]));
  }

  // Case 2: Only bots, no modality display config
  if (bots && typeof bots === "object" && Object.keys(bots).length >= 1) {
    return Object.keys(bots).map((k) =>
      makeResolved(k, bots[k], { label: k }),
    );
  }

  // Case 3: Flat company — no modality/bots split
  const flatBot: BotConfig = {
    bot_welcome_message: company.bot_welcome_message ?? {},
    voiceInputLanguages: company.voiceInputLanguages ?? [],
    productImages: false,
    definedTags: [],
  };
  return [makeResolved("default", flatBot, { label: "Chat" })];
}

// Welcome messages for a resolved modality
export function getWelcomeMessages(
  modality: ResolvedModality,
  lang = "en",
): string[] {
  const msgs = modality.bot_welcome_message;
  return msgs[lang] ?? msgs["en"] ?? [];
}

// Intro messages shown on the modality picker screen
export function getIntroMessages(company: Company, lang = "en"): string[] {
  const intro = company.bot_intro_message;
  if (!intro) return [];
  return intro[lang] ?? intro["en"] ?? [];
}

export interface SupportFlags {
  collectFeedback: boolean;
  requiredSupportButton: boolean;
}

export function getSupportFlags(company: Company): SupportFlags {
  const collectFeedback = Boolean(
    company.collectFeedback ?? company.support?.collectFeedback ?? false,
  );

  const requiredSupportButton = Boolean(company.requiredSupportButton ?? false);

  return { collectFeedback, requiredSupportButton };
}