export type XrayTestCounts = {
  manual: number;
  automated: number;
};

export interface QualityDataSource {
  getAutomationCoverage(projectExternalId: string, quarter: string): Promise<number | null>;
  getXrayTestCounts(projectExternalId: string, quarter: string): Promise<XrayTestCounts>;
  getProdDefectCount(projectExternalId: string, quarter: string): Promise<number>;
}
