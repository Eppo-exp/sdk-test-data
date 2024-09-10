export type BanditActionRequest = {
    flag: string;
    subjectKey: string;
    defaultValue: object;
    /**
     * {
     *   numericAttributes: { ... },
     *   categoricalAttributes: { ... }
     * }
     */
    subjectAttributes: Record<string, object>;
    /**
     * {
     *   action1: {
     *     numericAttributes: { ... },
     *     categoricalAttributes: { ... }
     *   },
     *   action2: { ... }
     * }
     */
    actions: Record<string, object>;
  };
  