export type DemoStatus = "pass" | "fail" | "skipped";

export type DemoApiKeyStatus = {
  label: string;
  names: string[];
  configured: boolean;
};

export type DemoTestResult = {
  id: string;
  title: string;
  status: DemoStatus;
  latencyMs: number;
  summary: string;
  issues: string[];
  details: unknown;
};

export type DemoVerificationResponse = {
  generatedAt: string;
  apiKeys: DemoApiKeyStatus[];
  summary: {
    total: number;
    passing: number;
    failing: number;
    skipped: number;
  };
  tests: DemoTestResult[];
  finalMessage: string;
};
