export class FeatureNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureNotSupportedError';
  }
}
