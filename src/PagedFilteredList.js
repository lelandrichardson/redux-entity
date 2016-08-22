import type { Filter } from './types';
import type EntitySchema from './EntitySchema';

// $FlowIgnore: suppressing module not found error
const { fromJS, List } = require('immutable');
const ResourceStore = require('./ResourceStore');
const Resource = require('./Resource');
const EntityStore = require('./EntityStore');
const { normalize } = require('./normalize');

const KEY = (x: Filter): Object => fromJS(x);

const RESOURCES = 'resources';
const LOADING = 'loading';
const PAGES = 'pages';

/*
 [resourceKey]: {
   [filterKey]: {
     loading: {
       [n]: [],
     },
     pages: {
       [n]: [],
     }
   }
 }
 */
class PagedFilteredListStore<T> extends ResourceStore<T> {

  hasPage(filter: Filter, page: number): boolean {
    return this.state.hasIn([RESOURCES, this.schema.getKey(), KEY(filter), PAGES, page]);
  }

  isPageLoading(filter: Filter, page: number): boolean {
    return this.state.getIn([RESOURCES, this.schema.getKey(), KEY(filter), LOADING, page]);
  }

  setPageIsLoading(filter: Filter, page: number, loading: boolean): this {
    return this.fluent(
      state => state.setIn([RESOURCES, this.schema.getKey(), KEY(filter), LOADING, page], loading)
    );
  }

  getPage(filter: Filter, page: number): List {
    const store = new EntityStore(this.state);
    const itemSchema = this.schema.getItemSchema();
    return this.state.getIn([RESOURCES, this.schema.getKey(), KEY(filter), PAGES, page], List())
      .map(id => store.get(itemSchema, id));
  }

  setPage(filter: Filter, page: number, items: any): PagedFilteredListStore<T> {
    const { result, entities } = normalize(items, this.schema);
    let store = new EntityStore(this.state);
    store = store.updateNormalized(entities);
    return new PagedFilteredListStore(store.state).fluent(
      state => state.setIn([
        RESOURCES,
        this.schema.getKey(),
        KEY(filter),
        PAGES,
        page,
      ], List(result))
    );
  }
}

class PagedFilteredList<T> extends Resource<T, PagedFilteredListStore<T>> {
  constructor(key: string, itemSchema: EntitySchema<T>) {
    super(key, itemSchema, PagedFilteredListStore);
  }
}

module.exports = PagedFilteredList;
