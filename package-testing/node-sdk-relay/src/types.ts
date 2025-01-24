import { AssignmentTypes } from './eppoClientProxy';
import { Attributes, BanditSubjectAttributes, BanditActions } from '@eppo/node-server-sdk';

export class AssignmentDto {
  flag: string;
  assignmentType: AssignmentTypes;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: Attributes;
}

export class BanditDto {
  flag: string;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: BanditSubjectAttributes;
  actions: BanditActions;
}

type BanditActionsTestRunnerInput = {
  actionKey: string;
  numericAttributes: Attributes;
  categoricalAttributes: Attributes;
};

export type BanditTestRunnerInput = {
  flag: string;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: BanditSubjectAttributes;
  actions: BanditActionsTestRunnerInput[];
};
