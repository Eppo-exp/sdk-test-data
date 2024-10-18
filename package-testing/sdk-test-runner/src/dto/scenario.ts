export type Scenario = {
  ufcPath: string;
  banditModelPath: string;
  testCases: string;
};

export interface Scenarios {
  [index: string]: Scenario;
}
