export interface ITargetingRuleCondition {
  operator: string;

  attribute: string;

  value: number | boolean | string | string[];
}

export enum ExperimentVariationAlgorithmTypeEnum {
  CONSTANT = 'CONSTANT',
  CONTEXTUAL_BANDIT = 'CONTEXTUAL_BANDIT',
}

export enum ExperimentVariationValueTypeEnum {
  BOOLEAN = 'BOOLEAN',
  INTEGER = 'INTEGER',
  JSON = 'JSON',
  NUMERIC = 'NUMERIC',
  STRING = 'STRING',
}

export enum UFCFormatEnum {
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
}

export class UniversalFlagConfig {
  createdAt!: string; // ISODate
  format!: UFCFormatEnum;
  environment!: EnvironmentDto; // used for evaluation "details"
  flags!: Record<string, FlagDto>;
  banditReferences?: Record<string, BanditReferenceDto>;
  /**
   * @deprecated Moving bandit information to `banditReferences`
   */
  bandits?: Record<string, BanditFlagVariationDto[]>;
}

export class EnvironmentDto {
  name!: string;
}

export class FlagDto {
  key!: string;
  enabled!: boolean;
  variationType!: ExperimentVariationValueTypeEnum;
  variations!: Record<string, VariationDto>;
  allocations!: AllocationDto[];
  totalShards!: number;
}

export class VariationDto {
  key!: string;
  value!: boolean | number | string; // JSON represented as string
  algorithmType?: ExperimentVariationAlgorithmTypeEnum;
}

export class AllocationDto {
  key!: string;
  rules?: RuleDto[];
  startAt?: string; // ISODate
  endAt?: string; // ISODate
  splits!: SplitDto[];
  doLog!: boolean;
}

export class RuleDto {
  conditions!: ITargetingRuleCondition[];
}

export class SplitDto {
  variationKey!: string;
  shards!: ShardDto[];
  extraLogging?: Record<string, string>;
}

export class ShardDto {
  salt!: string;
  ranges!: RangeDto[];
}

export class RangeDto {
  start!: number; // inclusive
  end!: number; // exclusive
}

export class BanditFlagVariationDto {
  key!: string;
  flagKey!: string;
  allocationKey!: string;
  variationKey!: string;
  variationValue!: string;
}

export class BanditReferenceDto {
  modelVersion!: string | null;
  flagVariations!: BanditFlagVariationDto[];
}
