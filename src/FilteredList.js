import type { Filter } from './types';
import type EntitySchema from './EntitySchema';

// $FlowIgnore: suppressing module not found errors
const { fromJS, List } = require('immutable');
const ResourceStore = require('./ResourceStore');
const Resource = require('./Resource');
const EntityStore = require('./EntityStore');
const { normalize } = require('./normalize');

const KEY = (x: Filter): Object => fromJS(x);

const RESOURCES = 'resources';
const ITEMS = 'items';
const LOADING = 'loading';

/*
 [resourceKey]: {
   [filterKey]: {
     loading: true,
     items: []
   }
 }
 */
class FilteredListStore<T> extends ResourceStore<T> {
  isLoading(filter: Filter): boolean {
    return this.state.getIn([RESOURCES, this.schema.getKey(), KEY(filter), LOADING]);
  }

  setIsLoading(filter: Filter, loading: boolean): this {
    return this.fluent(
      state => state.setIn([RESOURCES, this.schema.getKey(), KEY(filter), LOADING], loading)
    );
  }

  getItems(filter: Filter, offset: number, limit: number): List {
    const store = new EntityStore(this.state);
    const itemSchema = this.schema.getItemSchema();
    return this.state.getIn([RESOURCES, this.schema.getKey(), KEY(filter), ITEMS])
      .slice(offset, offset + limit)
      .map(id => store.get(itemSchema, id));
  }

  setItems(filter: Filter, items: any): FilteredListStore<T> {
    const { result, entities } = normalize(items, this.schema);
    let store = new EntityStore(this.state);
    store = store.updateNormalized(entities);
    return new FilteredListStore(store.state).fluent(
      state => state.setIn([RESOURCES, this.schema.getKey(), KEY(filter), ITEMS], List(result))
    );
  }
}

class FilteredList<T> extends Resource<T, FilteredListStore<T>> {
  constructor(key: string, itemSchema: EntitySchema<T>) {
    super(key, itemSchema, FilteredListStore);
  }
}

module.exports = FilteredList;
