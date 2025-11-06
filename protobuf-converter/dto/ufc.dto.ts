import { ExperimentVariationAlgorithmTypeEnum } from 'src/experiment/models/experiment-variation-algorithm-type.enum';
import { ExperimentVariationValueTypeEnum } from 'src/experiment/models/experiment-variation-value-type.enum';
import { UFCFormatEnum } from 'src/randomized-assignment/constants/ufc-format.enum';
import { ITargetingRuleCondition } from 'src/targeting/models/targeting-rule-condition';

export class UniversalFlagConfig {
  createdAt: string; // ISODate
  format: UFCFormatEnum;
  environment: EnvironmentDto; // used for evaluation "details"
  flags: Record<string, FlagDto>;
  banditReferences?: Record<string, BanditReferenceDto>;
  /**
   * @deprecated Moving bandit information to `banditReferences`
   */
  bandits?: Record<string, BanditFlagVariationDto[]>;
}

export class EnvironmentDto {
  name: string;
}

export class FlagDto {
  key: string;
  enabled: boolean;
  variationType: ExperimentVariationValueTypeEnum;
  variations: Record<string, VariationDto>;
  allocations: AllocationDto[];
  totalShards: number;
  entityId?: number;
}

export class VariationDto {
  key: string;
  value: boolean | number | string; // JSON represented as string
  algorithmType?: ExperimentVariationAlgorithmTypeEnum;
}

export class AllocationDto {
  key: string;
  rules?: RuleDto[];
  startAt?: string; // ISODate
  endAt?: string; // ISODate
  splits: SplitDto[];
  doLog: boolean;
}

export class RuleDto {
  conditions: ITargetingRuleCondition[];
}

export class SplitDto {
  variationKey: string;
  shards: ShardDto[];
  extraLogging?: Record<string, string>;
}

export class ShardDto {
  salt: string;
  ranges: RangeDto[];
}

export class RangeDto {
  start: number; // inclusive
  end: number; // exclusive
}

export class BanditFlagVariationDto {
  key: string;
  flagKey: string;
  allocationKey: string;
  variationKey: string;
  variationValue: string;
}

export class BanditReferenceDto {
  modelVersion: string | null;
  flagVariations: BanditFlagVariationDto[];
}
