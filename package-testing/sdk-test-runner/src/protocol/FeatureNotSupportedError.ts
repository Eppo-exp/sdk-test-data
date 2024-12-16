export class FeatureNotSupportedError extends Error {
  constructor(
    message: string,
    public readonly featureName: string,
  ) {
    super(message);
    this.name = 'FeatureNotSupportedError';
  }
}
