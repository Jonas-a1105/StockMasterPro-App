import { Entity } from './entity.base';

export abstract class AggregateRoot<Props> extends Entity<Props> {
  // Can be extended with domain events dispatching mechanisms if needed
}
