import type { QualityDataSource } from "../types";

/** Deterministic stub — replace with a real GitLab client later. */
export class StubGitLabSource implements Pick<QualityDataSource, "getAutomationCoverage" | "getProdDefectCount"> {
  async getAutomationCoverage(projectExternalId: string, quarter: string): Promise<number | null> {
    void quarter;
    const hash = hashString(projectExternalId);
    return 60 + (hash % 41);
  }

  async getProdDefectCount(projectExternalId: string, quarter: string): Promise<number> {
    void quarter;
    const hash = hashString(projectExternalId);
    return hash % 6;
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
