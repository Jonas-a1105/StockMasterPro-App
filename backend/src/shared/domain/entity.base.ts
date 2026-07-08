export abstract class Entity<Props> {
  protected readonly _id: string;
  protected readonly props: Props;

  constructor(props: Props, id?: string) {
    this._id = id || crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  public equals(object?: Entity<Props>): boolean {
    if (object === null || object === undefined) {
      return false;
    }
    if (this === object) {
      return true;
    }
    if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(object)) {
      return false;
    }
    return this._id === object._id;
  }
}
