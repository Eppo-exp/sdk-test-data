export type AssignmentRequest = {
  flag: string;
  subjectKey: string;
  variationType: string;
  defaultValue: object;
  subjectAttributes: Record<string, object>;
};
