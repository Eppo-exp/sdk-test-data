import { AssignmentTypes } from './eppoClientProxy';

export type AttributeType = string | number | boolean;
export type Attributes = Record<string, AttributeType>;
export type SubjectAttributes = Record<string, AttributeType>;
export type BanditActions = Record<string, ContextAttributes>;

export type ContextAttributes = {
  actionKey: string;
  numericAttributes: Attributes;
  categoricalAttributes: Attributes;
};

export class AssignmentDto {
  flag: string;
  assignmentType: AssignmentTypes;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: SubjectAttributes;
}

export class BanditDto {
  flag: string;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: SubjectAttributes;
  actions: BanditActions;
}
