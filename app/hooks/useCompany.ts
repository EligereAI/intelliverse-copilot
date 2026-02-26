"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCompany,
  resolveModalities,
  getIntroMessages,
  getSupportFlags,
} from "@/app/services/company/companyService";
import type { Company, ResolvedModality } from "@/app/types/company";

export type CompanyStatus = "idle" | "loading" | "ready" | "error";

export interface UseCompanyReturn {
  company: Company | null;
  modalities: ResolvedModality[];
  introMessages: string[];
  status: CompanyStatus;
  error: string | null;
  collectFeedback: boolean;
  requiredSupportButton: boolean;
  retry: () => void;
}

export function useCompany(
  companyId: string,
  lang = "en",
): UseCompanyReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [modalities, setModalities] = useState<ResolvedModality[]>([]);
  const [introMessages, setIntroMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<CompanyStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [collectFeedback, setCollectFeedback] = useState(false);
  const [requiredSupportButton, setRequiredSupportButton] = useState(false);

  const load = useCallback(async () => {
    const id = companyId.trim();

    if (!id) {
      setError("Company ID is not configured (NEXT_PUBLIC_COMPANY_ID is empty)");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const data = await fetchCompany(id);
      setCompany(data);
      setModalities(resolveModalities(data, lang));
      setIntroMessages(getIntroMessages(data, lang));

      const flags = getSupportFlags(data);

      setCollectFeedback(flags.collectFeedback);
      setRequiredSupportButton(flags.requiredSupportButton);

      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company");
      setStatus("error");
    }
  }, [companyId, lang]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    company,
    modalities,
    introMessages,
    status,
    error,
    collectFeedback,
    requiredSupportButton,
    retry: load,
  };
}