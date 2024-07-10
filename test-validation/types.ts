type VariationValue = string | number | boolean | object;

interface AllocationEvaluation {
  key: string;
  allocationEvaluationCode: string;
  orderPosition: number;
}

interface FlagEvaluationDetails {
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

interface SubjectTestCase {
  subjectKey: string;
  subjectAttributes: Record<string, string | number | boolean>;
  assignment: VariationValue;
  evaluationDetails: FlagEvaluationDetails;
}

export interface IAssignmentTestCase {
  flag: string;
  variationType: string;
  defaultValue: VariationValue;
  subjects: SubjectTestCase[];
}
