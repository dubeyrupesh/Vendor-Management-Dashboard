import type { QualityDataSource, XrayTestCounts } from "../types";

/** Deterministic stub — replace with a real Jira/Xray client later. */
export class StubJiraXraySource implements Pick<QualityDataSource, "getXrayTestCounts"> {
  async getXrayTestCounts(projectExternalId: string, quarter: string): Promise<XrayTestCounts> {
    const hash = hashString(`${projectExternalId}:${quarter}:xray`);
    const automated = 35 + (hash % 90);
    const manual = 8 + (hash % 45);
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
