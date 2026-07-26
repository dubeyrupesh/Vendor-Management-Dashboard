import type { QualityDataSource, XrayTestCounts } from "../types";

/** Deterministic stub — replace with a real Jira/Xray client later. */
export class StubJiraXraySource implements Pick<QualityDataSource, "getXrayTestCounts"> {
  async getXrayTestCounts(projectExternalId: string, quarter: string): Promise<XrayTestCounts> {
    void quarter;
    const hash = hashString(projectExternalId);
    const automated = 40 + (hash % 80);
    const manual = 10 + (hash % 40);
    return { manual, automated };
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
