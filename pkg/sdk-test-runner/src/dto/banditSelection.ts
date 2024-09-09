export class BanditActionRequest {
  public readonly flag: string;
  public readonly subjectKey: string;
  public readonly defaultValue: object;
  public readonly subjectAttributes: Record<string, object>;
  public readonly actions: Record<string, object>;


  public constructor(
    flagKey: string,
    subjectKey: string,
    defaultValue: object,
    subjectAttributes: Record<string, object>,
    actions: Record<string, object>
  ) {
    this.flag = flagKey;
    this.subjectKey = subjectKey;
    this.defaultValue = defaultValue;
    this.subjectAttributes = subjectAttributes;
    this.actions = actions;
  }
}
