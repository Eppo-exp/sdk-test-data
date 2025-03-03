import { createHash } from 'crypto';

import {
  AllocationDto,
  BanditFlagVariationDto,
  BanditReferenceDto,
  FlagDto,
  RuleDto,
  ShardDto,
  SplitDto,
  UFCFormatEnum,
  UniversalFlagConfig,
  VariationDto,
  ITargetingRuleCondition
} from './ufc.dto';

export function md5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

export function base64Encode(input: string): string {
  return Buffer.from(input).toString('base64');
}

export function obfuscateUniversalFlagConfig(ufc: UniversalFlagConfig): UniversalFlagConfig {
  // Start building a new, obfuscated, UniversalFlagConfig
  // We opted to do this instead of starting with a copy and mutating in-place for two reasons:
  //   1. The code is easier to understand as it doesn't mutate in-place
  //   2. If anything sensitive is added to the UFC but forgotten to be explicitly obfuscated, it could slip through
  const obfuscatedUfc = new UniversalFlagConfig();

  // update format
  obfuscatedUfc.format = UFCFormatEnum.CLIENT;

  // copy over fields that are not obfuscated
  obfuscatedUfc.environment = ufc.environment;
  if (ufc.createdAt) {
    obfuscatedUfc.createdAt = ufc.createdAt;
  }

  // Obfuscate flags
  obfuscatedUfc.flags = {};
  Object.values(ufc.flags).forEach((flagDto) => {
    const obfuscatedFlagDto = obfuscateFlag(flagDto);
    obfuscatedUfc.flags[obfuscatedFlagDto.key] = obfuscatedFlagDto;
  });

  // Obfuscate bandits
  if (ufc.bandits) {
    const obfuscatedBandits: Record<string, BanditFlagVariationDto[]> = {};
    Object.entries(ufc.bandits).forEach(([banditKey, banditFlagVariations]) => {
      obfuscatedBandits[md5Hash(banditKey)] = banditFlagVariations.map(
        obfuscateBanditFlagVariation,
      );
    });
    obfuscatedUfc.bandits = obfuscatedBandits;
  }
  if (ufc.banditReferences) {
    const obfuscatedBanditReferences: Record<string, BanditReferenceDto> = {};
    Object.entries(ufc.banditReferences).forEach(([banditKey, banditReference]) => {
      obfuscatedBanditReferences[md5Hash(banditKey)] = obfuscateBanditReference(banditReference);
    });
    obfuscatedUfc.banditReferences = obfuscatedBanditReferences;
  }
  return obfuscatedUfc;
}

function obfuscateFlag(flagDto: FlagDto): FlagDto {
  const obfuscatedFlagDto = new FlagDto();

  // We hash the flag key as the SDK will have an exact value to hash and compare
  obfuscatedFlagDto.key = md5Hash(flagDto.key);

  // copy over fields we are not obfuscating
  obfuscatedFlagDto.enabled = flagDto.enabled;
  obfuscatedFlagDto.variationType = flagDto.variationType;
  obfuscatedFlagDto.totalShards = flagDto.totalShards;

  // Obfuscate variations
  obfuscatedFlagDto.variations = {};
  Object.values(flagDto.variations).forEach((variationDto) => {
    const obfuscatedVariationDto = obfuscateVariationDto(variationDto);
    obfuscatedFlagDto.variations[obfuscatedVariationDto.key] = obfuscatedVariationDto;
  });

  // Obfuscate allocations (Note: we map as it's an array, and we want to preserve order)
  obfuscatedFlagDto.allocations = flagDto.allocations.map(obfuscateAllocation);

  return obfuscatedFlagDto;
}

function obfuscateVariationDto(variationDto: VariationDto): VariationDto {
  const obfuscatedVariationDto = new VariationDto();
  obfuscatedVariationDto.key = base64Encode(variationDto.key);

  // Obfuscate any non-null/non-undefined (note loose comparison) values
  obfuscatedVariationDto.value =
    variationDto.value != null ? base64Encode(variationDto.value.toString()) : variationDto.value;

  // Copy over algorithmType, unobfuscated, if present
  if (variationDto.algorithmType) {
    obfuscatedVariationDto.algorithmType = variationDto.algorithmType;
  }

  return obfuscatedVariationDto;
}

function obfuscateAllocation(allocationDto: AllocationDto): AllocationDto {
  const obfuscatedAllocationDto = new AllocationDto();
  obfuscatedAllocationDto.key = base64Encode(allocationDto.key);

  // Leave doLog unobfuscated
  obfuscatedAllocationDto.doLog = allocationDto.doLog;

  // Obfuscate startAt and endAt, if present
  if (allocationDto.startAt) {
    obfuscatedAllocationDto.startAt = base64Encode(allocationDto.startAt);
  }
  if (allocationDto.endAt) {
    obfuscatedAllocationDto.endAt = base64Encode(allocationDto.endAt);
  }

  // Obfuscate rules, if present, conserving order
  if (allocationDto.rules) {
    obfuscatedAllocationDto.rules = allocationDto.rules.map(obfuscateRule);
  }

  // Obfuscate splits, preserving order
  obfuscatedAllocationDto.splits = allocationDto.splits.map(obfuscateSplit);

  return obfuscatedAllocationDto;
}

function obfuscateRule(ruleDto: RuleDto): RuleDto {
  const obfuscatedRuleDto = new RuleDto();

  // Obfuscate conditions, preserving order
  obfuscatedRuleDto.conditions = ruleDto.conditions.map(obfuscateConditionInPlace);
  return obfuscatedRuleDto;
}

function obfuscateConditionInPlace(condition: ITargetingRuleCondition): ITargetingRuleCondition {
  // Note: we return the object in one shot instead of building out the keys as it's an interface not a DTO object
  return {
    operator: md5Hash(condition.operator), // We can hash, as the SDK knows the set of possibilities
    attribute: md5Hash(condition.attribute), // We can hash, as the SDK has the exact attributes to check for exact matches
    value: obfuscateConditionValueForOperator(condition.value, condition.operator), // How we obfuscate depends on the operator
  };
}

function obfuscateConditionValueForOperator<T extends ITargetingRuleCondition>(
  value: T['value'],
  operator: string,
): string | string[] {
  if (['ONE_OF', 'NOT_ONE_OF', 'IS_NULL'].includes(operator)) {
    // We hash values when it's an exact comparison because we can compare hashes
    if (Array.isArray(value)) {
      return value.map(md5Hash);
    } else {
      return md5Hash(value.toString());
    }
  }

  // Everything else (e.g., inequalities, regular expressions) we need to just encode, so that we
  // can reverse for evaluation
  return base64Encode(value.toString());
}

function obfuscateSplit(splitDto: SplitDto): SplitDto {
  const obfuscatedSplitDto = new SplitDto();
  obfuscatedSplitDto.variationKey = base64Encode(splitDto.variationKey);

  // Obfuscate shards, if present, as their keys could contain sensitive information
  if (splitDto.shards) {
    obfuscatedSplitDto.shards = splitDto.shards.map(obfuscateShard);
  }

  // Obfuscate extra logging, if present
  if (splitDto.extraLogging) {
    obfuscatedSplitDto.extraLogging = {};
    for (const [extraLoggingKey, extraLoggingValue] of Object.entries(splitDto.extraLogging)) {
      obfuscatedSplitDto.extraLogging[base64Encode(extraLoggingKey)] = base64Encode(
        extraLoggingValue,
      );
    }
  }

  return obfuscatedSplitDto;
}

function obfuscateShard(shardDto: ShardDto): ShardDto {
  const obfuscatedShardDto = new ShardDto();

  // Copy over ranges unobfuscated
  obfuscatedShardDto.ranges = structuredClone(shardDto.ranges);

  // Obfuscate salt
  obfuscatedShardDto.salt = base64Encode(shardDto.salt);

  return obfuscatedShardDto;
}

function obfuscateBanditReference(properties: BanditReferenceDto) {
  const obfuscatedProperties = new BanditReferenceDto();
  obfuscatedProperties.modelVersion = properties.modelVersion
    ? md5Hash(properties.modelVersion)
    : null;
  obfuscatedProperties.flagVariations = properties.flagVariations.map(obfuscateBanditFlagVariation);
  return obfuscatedProperties;
}

function obfuscateBanditFlagVariation(banditFlagVariation: BanditFlagVariationDto) {
  const obfuscatedBanditFlagVariation = new BanditFlagVariationDto();
  // Everything can be hashed as we'll have the values and be doing direct lookups
  obfuscatedBanditFlagVariation.key = md5Hash(banditFlagVariation.key);
  obfuscatedBanditFlagVariation.flagKey = md5Hash(banditFlagVariation.flagKey);
  obfuscatedBanditFlagVariation.allocationKey = md5Hash(banditFlagVariation.allocationKey);
  obfuscatedBanditFlagVariation.variationKey = md5Hash(banditFlagVariation.variationKey);
  obfuscatedBanditFlagVariation.variationValue = md5Hash(banditFlagVariation.variationValue);

  return obfuscatedBanditFlagVariation;
}
