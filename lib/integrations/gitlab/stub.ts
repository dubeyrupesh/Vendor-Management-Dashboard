import type { QualityDataSource } from "../types";

/** Deterministic stub — replace with a real GitLab client later. */
export class StubGitLabSource implements Pick<QualityDataSource, "getAutomationCoverage" | "getProdDefectCount"> {
  async getAutomationCoverage(projectExternalId: string, quarter: string): Promise<number | null> {
    const hash = hashString(`${projectExternalId}:${quarter}:coverage`);
    return 55 + (hash % 46);
  }

  async getProdDefectCount(projectExternalId: string, quarter: string): Promise<number> {
    const hash = hashString(`${projectExternalId}:${quarter}:defects`);
    return hash % 7;
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
