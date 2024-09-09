export class Assignment {
    public readonly flag: string;
    public readonly subjectKey: string;
    public readonly variationType: string;
    public readonly defaultValue: object;
    public readonly subjectAttributes: Record<string, object>;

    public constructor(flagKey: string,
        subjectKey: string,
        variationType: string,
        defaultValue: object,
        subjectAttributes: Record<string, object>) {

        this.flag = flagKey;
        this.subjectKey = subjectKey;
        this.variationType = variationType;
        this.defaultValue = defaultValue;
        this.subjectAttributes = subjectAttributes;
    }
}