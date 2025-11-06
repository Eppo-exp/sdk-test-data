export enum ERuleConditionOperator {
  'LT' = 'LT',
  'LTE' = 'LTE',
  'GT' = 'GT',
  'GTE' = 'GTE',
  'MATCHES' = 'MATCHES',
  'ONE_OF' = 'ONE_OF',
  'NOT_ONE_OF' = 'NOT_ONE_OF',
  'IS_NULL' = 'IS_NULL',
}

export enum ERuleConditionValuesType {
  PLAIN_STRING = 'PLAIN_STRING',
  STRING_ARRAY = 'STRING_ARRAY',
  SEM_VER = 'SEM_VER',
  REGEX = 'REGEX',
  NUMERIC = 'NUMERIC',
}

// object used in the RAC API response
export interface ITargetingRuleCondition {
  operator: string;
  attribute: string;
  value: number | boolean | string | string[];
}