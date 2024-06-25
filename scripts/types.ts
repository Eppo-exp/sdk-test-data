export type VariationValue = string | number | boolean | object;

export interface AllocationEvaluation {
  key: string;
  allocationEvaluationCode: string;
  orderPosition: number;
}

export interface FlagEvaluationDetails {
  value: VariationValue
  variationKey: string | null;
  variationValue: VariationValue | null;
  flagEvaluationCode: string;
  flagEvaluationDescription: string;
  matchedRule: any;
  matchedAllocation: AllocationEvaluation | null;
  unmatchedAllocations: Array<AllocationEvaluation>;
  unevaluatedAllocations: Array<AllocationEvaluation>;
}

export interface SubjectTestCase {
  subjectKey: string;
  subjectAttributes: Record<string, string | number | boolean>;
  assignment: VariationValue;
  assignmentDetails: FlagEvaluationDetails;
}

export interface IAssignmentTestCase {
  flag: string;
  variationType: string;
  defaultValue: VariationValue;
  subjects: SubjectTestCase[];
}
