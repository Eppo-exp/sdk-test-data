import {
  UniversalFlagConfig as UniversalFlagConfigProto,
  EnvironmentDto as EnvironmentDtoProto,
  FlagDto as FlagDtoProto,
  VariationDto as VariationDtoProto,
  AllocationDto as AllocationDtoProto,
  RuleDto as RuleDtoProto,
  SplitDto as SplitDtoProto,
  ShardDto as ShardDtoProto,
  RangeDto as RangeDtoProto,
  TargetingRuleCondition as TargetingRuleConditionProto,
  BanditReferenceDto as BanditReferenceDtoProto,
  BanditFlagVariationDto as BanditFlagVariationDtoProto,
  BanditFlagVariations as BanditFlagVariationsProto,
  StringArray,
  UFCFormat,
  ExperimentVariationValueType,
  ExperimentVariationAlgorithmType,
} from '../generated/ufc_pb';

import {
  UniversalFlagConfig,
  EnvironmentDto,
  FlagDto,
  VariationDto,
  AllocationDto,
  RuleDto,
  SplitDto,
  ShardDto,
  RangeDto,
  BanditReferenceDto,
  BanditFlagVariationDto,
} from '../dto/ufc.dto';

import { UFCFormatEnum } from '../dto/ufc-format.enum';
import { ExperimentVariationValueTypeEnum } from '../dto/experiment-variation-value-type.enum';
import { ExperimentVariationAlgorithmTypeEnum } from '../dto/experiment-variation-algorithm-type.enum';
import { ITargetingRuleCondition } from '../dto/targeting-rule-condition';

export class ProtobufSerializationHelper {
  /**
   * Convert UniversalFlagConfig DTO to protobuf message
   */
  static toProtobuf(ufc: UniversalFlagConfig): UniversalFlagConfigProto {
    const proto = new UniversalFlagConfigProto();

    proto.setCreatedAt(ufc.createdAt);
    proto.setFormat(this.convertUFCFormat(ufc.format));
    proto.setEnvironment(this.convertEnvironmentDto(ufc.environment));

    // Convert flags map
    const flagsMap = proto.getFlagsMap();
    Object.entries(ufc.flags).forEach(([key, flag]) => {
      flagsMap.set(key, this.convertFlagDto(flag));
    });

    // Convert bandit references map
    if (ufc.banditReferences) {
      const banditReferencesMap = proto.getBanditReferencesMap();
      Object.entries(ufc.banditReferences).forEach(([key, banditRef]) => {
        banditReferencesMap.set(key, this.convertBanditReferenceDto(banditRef));
      });
    }

    // Convert deprecated bandits map if present
    if (ufc.bandits) {
      const banditsMap = proto.getBanditsMap();
      Object.entries(ufc.bandits).forEach(([key, banditVariations]) => {
        const banditFlagVariations = new BanditFlagVariationsProto();
        const variationsList = banditVariations.map(variation =>
          this.convertBanditFlagVariationDto(variation)
        );
        banditFlagVariations.setVariationsList(variationsList);
        banditsMap.set(key, banditFlagVariations);
      });
    }

    return proto;
  }

  /**
   * Serialize UniversalFlagConfig to binary protobuf
   */
  static serialize(ufc: UniversalFlagConfig): Uint8Array {
    const proto = this.toProtobuf(ufc);
    return proto.serializeBinary();
  }

  private static convertUFCFormat(format: UFCFormatEnum): UFCFormat {
    switch (format) {
      case UFCFormatEnum.SERVER:
        return UFCFormat.SERVER;
      case UFCFormatEnum.CLIENT:
        return UFCFormat.CLIENT;
      default:
        return UFCFormat.SERVER;
    }
  }

  private static convertEnvironmentDto(env: EnvironmentDto): EnvironmentDtoProto {
    const proto = new EnvironmentDtoProto();
    proto.setName(env.name);
    return proto;
  }

  private static convertFlagDto(flag: FlagDto): FlagDtoProto {
    const proto = new FlagDtoProto();

    proto.setKey(flag.key);
    proto.setEnabled(flag.enabled);
    proto.setVariationType(this.convertVariationType(flag.variationType));
    proto.setTotalShards(flag.totalShards);

    if (flag.entityId !== undefined) {
      proto.setEntityId(flag.entityId);
    }

    // Convert variations map
    const variationsMap = proto.getVariationsMap();
    Object.entries(flag.variations).forEach(([key, variation]) => {
      variationsMap.set(key, this.convertVariationDto(variation));
    });

    // Convert allocations list
    const allocationsList = flag.allocations.map(allocation =>
      this.convertAllocationDto(allocation)
    );
    proto.setAllocationsList(allocationsList);

    return proto;
  }

  private static convertVariationType(type: ExperimentVariationValueTypeEnum): ExperimentVariationValueType {
    switch (type) {
      case ExperimentVariationValueTypeEnum.BOOLEAN:
        return ExperimentVariationValueType.BOOLEAN;
      case ExperimentVariationValueTypeEnum.INTEGER:
        return ExperimentVariationValueType.INTEGER;
      case ExperimentVariationValueTypeEnum.NUMERIC:
        return ExperimentVariationValueType.NUMERIC;
      case ExperimentVariationValueTypeEnum.STRING:
        return ExperimentVariationValueType.STRING;
      case ExperimentVariationValueTypeEnum.JSON:
        return ExperimentVariationValueType.JSON;
      default:
        return ExperimentVariationValueType.STRING;
    }
  }

  private static convertVariationDto(variation: VariationDto): VariationDtoProto {
    const proto = new VariationDtoProto();

    proto.setKey(variation.key);

    // Handle the union type value (boolean | number | string)
    const value = variation.value;
    if (typeof value === 'boolean') {
      proto.setBoolValue(value);
    } else if (typeof value === 'number') {
      proto.setNumberValue(value);
    } else {
      proto.setStringValue(String(value));
    }

    if (variation.algorithmType) {
      proto.setAlgorithmType(this.convertAlgorithmType(variation.algorithmType));
    }

    return proto;
  }

  private static convertAlgorithmType(type: ExperimentVariationAlgorithmTypeEnum): ExperimentVariationAlgorithmType {
    switch (type) {
      case ExperimentVariationAlgorithmTypeEnum.CONSTANT:
        return ExperimentVariationAlgorithmType.CONSTANT;
      case ExperimentVariationAlgorithmTypeEnum.CONTEXTUAL_BANDIT:
        return ExperimentVariationAlgorithmType.CONTEXTUAL_BANDIT;
      default:
        return ExperimentVariationAlgorithmType.CONSTANT;
    }
  }

  private static convertAllocationDto(allocation: AllocationDto): AllocationDtoProto {
    const proto = new AllocationDtoProto();

    proto.setKey(allocation.key);
    proto.setDoLog(allocation.doLog);

    if (allocation.startAt) {
      proto.setStartAt(allocation.startAt);
    }

    if (allocation.endAt) {
      proto.setEndAt(allocation.endAt);
    }

    // Convert rules list
    if (allocation.rules) {
      const rulesList = allocation.rules.map(rule => this.convertRuleDto(rule));
      proto.setRulesList(rulesList);
    }

    // Convert splits list
    const splitsList = allocation.splits.map(split => this.convertSplitDto(split));
    proto.setSplitsList(splitsList);

    return proto;
  }

  private static convertRuleDto(rule: RuleDto): RuleDtoProto {
    const proto = new RuleDtoProto();

    const conditionsList = rule.conditions.map(condition =>
      this.convertTargetingRuleCondition(condition)
    );
    proto.setConditionsList(conditionsList);

    return proto;
  }

  private static convertTargetingRuleCondition(condition: ITargetingRuleCondition): TargetingRuleConditionProto {
    const proto = new TargetingRuleConditionProto();

    proto.setOperator(condition.operator);
    proto.setAttribute(condition.attribute);

    // Handle the union type value (number | boolean | string | string[])
    const value = condition.value;
    if (typeof value === 'number') {
      proto.setNumberValue(value);
    } else if (typeof value === 'boolean') {
      proto.setBoolValue(value);
    } else if (Array.isArray(value)) {
      const stringArray = new StringArray();
      stringArray.setValuesList(value);
      proto.setStringArrayValue(stringArray);
    } else {
      proto.setStringValue(String(value));
    }

    return proto;
  }

  private static convertSplitDto(split: SplitDto): SplitDtoProto {
    const proto = new SplitDtoProto();

    proto.setVariationKey(split.variationKey);

    // Convert shards list
    const shardsList = split.shards.map(shard => this.convertShardDto(shard));
    proto.setShardsList(shardsList);

    // Convert extra logging map
    if (split.extraLogging) {
      const extraLoggingMap = proto.getExtraLoggingMap();
      Object.entries(split.extraLogging).forEach(([key, value]) => {
        extraLoggingMap.set(key, value);
      });
    }

    return proto;
  }

  private static convertShardDto(shard: ShardDto): ShardDtoProto {
    const proto = new ShardDtoProto();

    proto.setSalt(shard.salt);

    // Convert ranges list
    const rangesList = shard.ranges.map(range => this.convertRangeDto(range));
    proto.setRangesList(rangesList);

    return proto;
  }

  private static convertRangeDto(range: RangeDto): RangeDtoProto {
    const proto = new RangeDtoProto();

    proto.setStart(range.start);
    proto.setEnd(range.end);

    return proto;
  }

  private static convertBanditReferenceDto(banditRef: BanditReferenceDto): BanditReferenceDtoProto {
    const proto = new BanditReferenceDtoProto();

    if (banditRef.modelVersion) {
      proto.setModelVersion(banditRef.modelVersion);
    }

    // Convert flag variations list
    const flagVariationsList = banditRef.flagVariations.map(variation =>
      this.convertBanditFlagVariationDto(variation)
    );
    proto.setFlagVariationsList(flagVariationsList);

    return proto;
  }

  private static convertBanditFlagVariationDto(variation: BanditFlagVariationDto): BanditFlagVariationDtoProto {
    const proto = new BanditFlagVariationDtoProto();

    proto.setKey(variation.key);
    proto.setFlagKey(variation.flagKey);
    proto.setAllocationKey(variation.allocationKey);
    proto.setVariationKey(variation.variationKey);
    proto.setVariationValue(variation.variationValue);

    return proto;
  }
}