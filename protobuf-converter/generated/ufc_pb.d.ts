// package: ufc
// file: ufc.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class UniversalFlagConfig extends jspb.Message { 
    getCreatedAt(): string;
    setCreatedAt(value: string): UniversalFlagConfig;
    getFormat(): UFCFormat;
    setFormat(value: UFCFormat): UniversalFlagConfig;

    hasEnvironment(): boolean;
    clearEnvironment(): void;
    getEnvironment(): EnvironmentDto | undefined;
    setEnvironment(value?: EnvironmentDto): UniversalFlagConfig;

    getFlagsMap(): jspb.Map<string, FlagDto>;
    clearFlagsMap(): void;

    getBanditReferencesMap(): jspb.Map<string, BanditReferenceDto>;
    clearBanditReferencesMap(): void;

    getBanditsMap(): jspb.Map<string, BanditFlagVariations>;
    clearBanditsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UniversalFlagConfig.AsObject;
    static toObject(includeInstance: boolean, msg: UniversalFlagConfig): UniversalFlagConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UniversalFlagConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UniversalFlagConfig;
    static deserializeBinaryFromReader(message: UniversalFlagConfig, reader: jspb.BinaryReader): UniversalFlagConfig;
}

export namespace UniversalFlagConfig {
    export type AsObject = {
        createdAt: string,
        format: UFCFormat,
        environment?: EnvironmentDto.AsObject,

        flagsMap: Array<[string, FlagDto.AsObject]>,

        banditReferencesMap: Array<[string, BanditReferenceDto.AsObject]>,

        banditsMap: Array<[string, BanditFlagVariations.AsObject]>,
    }
}

export class EnvironmentDto extends jspb.Message { 
    getName(): string;
    setName(value: string): EnvironmentDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnvironmentDto.AsObject;
    static toObject(includeInstance: boolean, msg: EnvironmentDto): EnvironmentDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnvironmentDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnvironmentDto;
    static deserializeBinaryFromReader(message: EnvironmentDto, reader: jspb.BinaryReader): EnvironmentDto;
}

export namespace EnvironmentDto {
    export type AsObject = {
        name: string,
    }
}

export class FlagDto extends jspb.Message { 
    getKey(): string;
    setKey(value: string): FlagDto;
    getEnabled(): boolean;
    setEnabled(value: boolean): FlagDto;
    getVariationType(): ExperimentVariationValueType;
    setVariationType(value: ExperimentVariationValueType): FlagDto;

    getVariationsMap(): jspb.Map<string, VariationDto>;
    clearVariationsMap(): void;
    clearAllocationsList(): void;
    getAllocationsList(): Array<AllocationDto>;
    setAllocationsList(value: Array<AllocationDto>): FlagDto;
    addAllocations(value?: AllocationDto, index?: number): AllocationDto;
    getTotalShards(): number;
    setTotalShards(value: number): FlagDto;

    hasEntityId(): boolean;
    clearEntityId(): void;
    getEntityId(): number | undefined;
    setEntityId(value: number): FlagDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FlagDto.AsObject;
    static toObject(includeInstance: boolean, msg: FlagDto): FlagDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FlagDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FlagDto;
    static deserializeBinaryFromReader(message: FlagDto, reader: jspb.BinaryReader): FlagDto;
}

export namespace FlagDto {
    export type AsObject = {
        key: string,
        enabled: boolean,
        variationType: ExperimentVariationValueType,

        variationsMap: Array<[string, VariationDto.AsObject]>,
        allocationsList: Array<AllocationDto.AsObject>,
        totalShards: number,
        entityId?: number,
    }
}

export class VariationDto extends jspb.Message { 
    getKey(): string;
    setKey(value: string): VariationDto;

    hasBoolValue(): boolean;
    clearBoolValue(): void;
    getBoolValue(): boolean;
    setBoolValue(value: boolean): VariationDto;

    hasNumberValue(): boolean;
    clearNumberValue(): void;
    getNumberValue(): number;
    setNumberValue(value: number): VariationDto;

    hasStringValue(): boolean;
    clearStringValue(): void;
    getStringValue(): string;
    setStringValue(value: string): VariationDto;

    hasAlgorithmType(): boolean;
    clearAlgorithmType(): void;
    getAlgorithmType(): ExperimentVariationAlgorithmType | undefined;
    setAlgorithmType(value: ExperimentVariationAlgorithmType): VariationDto;

    getValueCase(): VariationDto.ValueCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VariationDto.AsObject;
    static toObject(includeInstance: boolean, msg: VariationDto): VariationDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VariationDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VariationDto;
    static deserializeBinaryFromReader(message: VariationDto, reader: jspb.BinaryReader): VariationDto;
}

export namespace VariationDto {
    export type AsObject = {
        key: string,
        boolValue: boolean,
        numberValue: number,
        stringValue: string,
        algorithmType?: ExperimentVariationAlgorithmType,
    }

    export enum ValueCase {
        VALUE_NOT_SET = 0,
        BOOL_VALUE = 2,
        NUMBER_VALUE = 3,
        STRING_VALUE = 4,
    }

}

export class AllocationDto extends jspb.Message { 
    getKey(): string;
    setKey(value: string): AllocationDto;
    clearRulesList(): void;
    getRulesList(): Array<RuleDto>;
    setRulesList(value: Array<RuleDto>): AllocationDto;
    addRules(value?: RuleDto, index?: number): RuleDto;

    hasStartAt(): boolean;
    clearStartAt(): void;
    getStartAt(): string | undefined;
    setStartAt(value: string): AllocationDto;

    hasEndAt(): boolean;
    clearEndAt(): void;
    getEndAt(): string | undefined;
    setEndAt(value: string): AllocationDto;
    clearSplitsList(): void;
    getSplitsList(): Array<SplitDto>;
    setSplitsList(value: Array<SplitDto>): AllocationDto;
    addSplits(value?: SplitDto, index?: number): SplitDto;
    getDoLog(): boolean;
    setDoLog(value: boolean): AllocationDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AllocationDto.AsObject;
    static toObject(includeInstance: boolean, msg: AllocationDto): AllocationDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AllocationDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AllocationDto;
    static deserializeBinaryFromReader(message: AllocationDto, reader: jspb.BinaryReader): AllocationDto;
}

export namespace AllocationDto {
    export type AsObject = {
        key: string,
        rulesList: Array<RuleDto.AsObject>,
        startAt?: string,
        endAt?: string,
        splitsList: Array<SplitDto.AsObject>,
        doLog: boolean,
    }
}

export class RuleDto extends jspb.Message { 
    clearConditionsList(): void;
    getConditionsList(): Array<TargetingRuleCondition>;
    setConditionsList(value: Array<TargetingRuleCondition>): RuleDto;
    addConditions(value?: TargetingRuleCondition, index?: number): TargetingRuleCondition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RuleDto.AsObject;
    static toObject(includeInstance: boolean, msg: RuleDto): RuleDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RuleDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RuleDto;
    static deserializeBinaryFromReader(message: RuleDto, reader: jspb.BinaryReader): RuleDto;
}

export namespace RuleDto {
    export type AsObject = {
        conditionsList: Array<TargetingRuleCondition.AsObject>,
    }
}

export class SplitDto extends jspb.Message { 
    getVariationKey(): string;
    setVariationKey(value: string): SplitDto;
    clearShardsList(): void;
    getShardsList(): Array<ShardDto>;
    setShardsList(value: Array<ShardDto>): SplitDto;
    addShards(value?: ShardDto, index?: number): ShardDto;

    getExtraLoggingMap(): jspb.Map<string, string>;
    clearExtraLoggingMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SplitDto.AsObject;
    static toObject(includeInstance: boolean, msg: SplitDto): SplitDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SplitDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SplitDto;
    static deserializeBinaryFromReader(message: SplitDto, reader: jspb.BinaryReader): SplitDto;
}

export namespace SplitDto {
    export type AsObject = {
        variationKey: string,
        shardsList: Array<ShardDto.AsObject>,

        extraLoggingMap: Array<[string, string]>,
    }
}

export class ShardDto extends jspb.Message { 
    getSalt(): string;
    setSalt(value: string): ShardDto;
    clearRangesList(): void;
    getRangesList(): Array<RangeDto>;
    setRangesList(value: Array<RangeDto>): ShardDto;
    addRanges(value?: RangeDto, index?: number): RangeDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShardDto.AsObject;
    static toObject(includeInstance: boolean, msg: ShardDto): ShardDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShardDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShardDto;
    static deserializeBinaryFromReader(message: ShardDto, reader: jspb.BinaryReader): ShardDto;
}

export namespace ShardDto {
    export type AsObject = {
        salt: string,
        rangesList: Array<RangeDto.AsObject>,
    }
}

export class RangeDto extends jspb.Message { 
    getStart(): number;
    setStart(value: number): RangeDto;
    getEnd(): number;
    setEnd(value: number): RangeDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RangeDto.AsObject;
    static toObject(includeInstance: boolean, msg: RangeDto): RangeDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RangeDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RangeDto;
    static deserializeBinaryFromReader(message: RangeDto, reader: jspb.BinaryReader): RangeDto;
}

export namespace RangeDto {
    export type AsObject = {
        start: number,
        end: number,
    }
}

export class TargetingRuleCondition extends jspb.Message { 
    getOperator(): string;
    setOperator(value: string): TargetingRuleCondition;
    getAttribute(): string;
    setAttribute(value: string): TargetingRuleCondition;

    hasNumberValue(): boolean;
    clearNumberValue(): void;
    getNumberValue(): number;
    setNumberValue(value: number): TargetingRuleCondition;

    hasBoolValue(): boolean;
    clearBoolValue(): void;
    getBoolValue(): boolean;
    setBoolValue(value: boolean): TargetingRuleCondition;

    hasStringValue(): boolean;
    clearStringValue(): void;
    getStringValue(): string;
    setStringValue(value: string): TargetingRuleCondition;

    hasStringArrayValue(): boolean;
    clearStringArrayValue(): void;
    getStringArrayValue(): StringArray | undefined;
    setStringArrayValue(value?: StringArray): TargetingRuleCondition;

    getValueCase(): TargetingRuleCondition.ValueCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TargetingRuleCondition.AsObject;
    static toObject(includeInstance: boolean, msg: TargetingRuleCondition): TargetingRuleCondition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TargetingRuleCondition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TargetingRuleCondition;
    static deserializeBinaryFromReader(message: TargetingRuleCondition, reader: jspb.BinaryReader): TargetingRuleCondition;
}

export namespace TargetingRuleCondition {
    export type AsObject = {
        operator: string,
        attribute: string,
        numberValue: number,
        boolValue: boolean,
        stringValue: string,
        stringArrayValue?: StringArray.AsObject,
    }

    export enum ValueCase {
        VALUE_NOT_SET = 0,
        NUMBER_VALUE = 3,
        BOOL_VALUE = 4,
        STRING_VALUE = 5,
        STRING_ARRAY_VALUE = 6,
    }

}

export class StringArray extends jspb.Message { 
    clearValuesList(): void;
    getValuesList(): Array<string>;
    setValuesList(value: Array<string>): StringArray;
    addValues(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StringArray.AsObject;
    static toObject(includeInstance: boolean, msg: StringArray): StringArray.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StringArray, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StringArray;
    static deserializeBinaryFromReader(message: StringArray, reader: jspb.BinaryReader): StringArray;
}

export namespace StringArray {
    export type AsObject = {
        valuesList: Array<string>,
    }
}

export class BanditFlagVariationDto extends jspb.Message { 
    getKey(): string;
    setKey(value: string): BanditFlagVariationDto;
    getFlagKey(): string;
    setFlagKey(value: string): BanditFlagVariationDto;
    getAllocationKey(): string;
    setAllocationKey(value: string): BanditFlagVariationDto;
    getVariationKey(): string;
    setVariationKey(value: string): BanditFlagVariationDto;
    getVariationValue(): string;
    setVariationValue(value: string): BanditFlagVariationDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BanditFlagVariationDto.AsObject;
    static toObject(includeInstance: boolean, msg: BanditFlagVariationDto): BanditFlagVariationDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BanditFlagVariationDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BanditFlagVariationDto;
    static deserializeBinaryFromReader(message: BanditFlagVariationDto, reader: jspb.BinaryReader): BanditFlagVariationDto;
}

export namespace BanditFlagVariationDto {
    export type AsObject = {
        key: string,
        flagKey: string,
        allocationKey: string,
        variationKey: string,
        variationValue: string,
    }
}

export class BanditFlagVariations extends jspb.Message { 
    clearVariationsList(): void;
    getVariationsList(): Array<BanditFlagVariationDto>;
    setVariationsList(value: Array<BanditFlagVariationDto>): BanditFlagVariations;
    addVariations(value?: BanditFlagVariationDto, index?: number): BanditFlagVariationDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BanditFlagVariations.AsObject;
    static toObject(includeInstance: boolean, msg: BanditFlagVariations): BanditFlagVariations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BanditFlagVariations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BanditFlagVariations;
    static deserializeBinaryFromReader(message: BanditFlagVariations, reader: jspb.BinaryReader): BanditFlagVariations;
}

export namespace BanditFlagVariations {
    export type AsObject = {
        variationsList: Array<BanditFlagVariationDto.AsObject>,
    }
}

export class BanditReferenceDto extends jspb.Message { 

    hasModelVersion(): boolean;
    clearModelVersion(): void;
    getModelVersion(): string | undefined;
    setModelVersion(value: string): BanditReferenceDto;
    clearFlagVariationsList(): void;
    getFlagVariationsList(): Array<BanditFlagVariationDto>;
    setFlagVariationsList(value: Array<BanditFlagVariationDto>): BanditReferenceDto;
    addFlagVariations(value?: BanditFlagVariationDto, index?: number): BanditFlagVariationDto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BanditReferenceDto.AsObject;
    static toObject(includeInstance: boolean, msg: BanditReferenceDto): BanditReferenceDto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BanditReferenceDto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BanditReferenceDto;
    static deserializeBinaryFromReader(message: BanditReferenceDto, reader: jspb.BinaryReader): BanditReferenceDto;
}

export namespace BanditReferenceDto {
    export type AsObject = {
        modelVersion?: string,
        flagVariationsList: Array<BanditFlagVariationDto.AsObject>,
    }
}

export enum UFCFormat {
    UFC_FORMAT_UNSPECIFIED = 0,
    SERVER = 1,
    CLIENT = 2,
}

export enum ExperimentVariationValueType {
    VARIATION_VALUE_TYPE_UNSPECIFIED = 0,
    BOOLEAN = 1,
    INTEGER = 2,
    NUMERIC = 3,
    STRING = 4,
    JSON = 5,
}

export enum ExperimentVariationAlgorithmType {
    ALGORITHM_TYPE_UNSPECIFIED = 0,
    CONSTANT = 1,
    CONTEXTUAL_BANDIT = 2,
}
