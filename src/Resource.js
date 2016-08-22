/* eslint no-undef: 0, no-unused-vars: 0 */
import type ResourceStore from './ResourceStore';
import type EntitySchema from './EntitySchema';
import type { EntityStoreState } from './EntityStore';

class Resource<T, S: ResourceStore<T>> {
  key: string;
  itemSchema: EntitySchema<T>;
  StoreClass: Class<S>;
  constructor(key: string, itemSchema: EntitySchema<T>, StoreClass: Class<S>) {
    this.key = key;
    this.itemSchema = itemSchema;
    this.StoreClass = StoreClass;
  }

  getKey(): string {
    return this.key;
  }

  getItemSchema(): EntitySchema<T> {
    return this.itemSchema;
  }

  createStoreFromState(state: EntityStoreState): S {
    const { StoreClass } = this;
    return new StoreClass(this, state);
  }

  createInitialState(): any {
    return {

    };
  }
}

module.exports = Resource;
