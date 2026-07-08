export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: string;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
  }

  public get value(): T {
    if (this.isFailure) {
      throw new Error('No se puede obtener el valor de un resultado fallido');
    }
    return this._value!;
  }

  public get error(): string {
    if (this.isSuccess) {
      throw new Error('No se puede obtener el error de un resultado exitoso');
    }
    return this._error!;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }
}
