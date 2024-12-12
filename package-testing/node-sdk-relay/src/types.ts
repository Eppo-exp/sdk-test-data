export type AttributeType = string | number | boolean;
export type SubjectAttributes = Record<string, AttributeType>;

export class AssignmentDto {
  flag: string;
  assignmentType: string;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: SubjectAttributes;
}
