export type AssignmentRequest = {
  flag: string;
  subjectKey: string;
  assignmentType: string;
  defaultValue: object;
  subjectAttributes: Record<string, object>;
};
