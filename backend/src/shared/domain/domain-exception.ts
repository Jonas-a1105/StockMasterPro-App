export abstract class DomainException extends Error {
  public abstract readonly code: string;
  public readonly status: number = 400;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
