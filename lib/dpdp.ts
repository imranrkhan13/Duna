import type { PronunciationResult } from "./types";
export { CONSENT_NOTICE } from "./privacy";

const RETENTION_MS = 24 * 60 * 60 * 1000;

type StoredResult = {
  result: PronunciationResult;
  timeout: NodeJS.Timeout;
};

const store = new Map<string, StoredResult>();

export function createResultId() {
  return crypto.randomUUID();
}

export function getExpiryDate(now = Date.now()) {
  return new Date(now + RETENTION_MS);
}

export function rememberResult(result: PronunciationResult) {
  forgetResult(result.id);

  const timeout = setTimeout(() => {
    store.delete(result.id);
  }, RETENTION_MS);

  if (typeof timeout.unref === "function") {
    timeout.unref();
  }

  store.set(result.id, { result, timeout });
}

export function getResult(id: string) {
  const stored = store.get(id);
  if (!stored) {
    return null;
  }

  if (new Date(stored.result.expiresAt).getTime() <= Date.now()) {
    forgetResult(id);
    return null;
  }

  return stored.result;
}

export function forgetResult(id: string) {
  const stored = store.get(id);
  if (!stored) {
    return;
  }

  clearTimeout(stored.timeout);
  store.delete(id);
}

export function assertConsent(consentValue: FormDataEntryValue | null) {
  if (consentValue !== "true") {
    throw new Error("Consent is required before audio can be processed.");
  }
}
