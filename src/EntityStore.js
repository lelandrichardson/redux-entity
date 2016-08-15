import type { SchemaValue, idType } from './types';
import type { NormalizeInput } from './normalize';

const { normalize } = require('./normalize');
// $FlowIgnore: suppressing module not found error
const { OrderedMap, Map, fromJS } = require('immutable');
// $FlowIgnore: suppressing module not found error
const forEach = require('lodash/forEach');

type Query = Object;
type EntitySchema<T> = {
  getNewInstance: () => T,
  getKey(): string,
}

export type EntityStoreOptions = {
  entities: EntitySchema<*>[],
  queries: Query[],
};

type EntityStoreState = Map;

type StateMapper = (state: EntityStoreState) => EntityStoreState;

const I: ((x: idType) => string) = id => `${id}`;

const ENTITIES = 'entities';
// const QUERIES = 'queries';
const LOADING_STATES = 'loadingStates';
const OPTIMISTIC_UPDATES = 'optimisticUpdates';

function mapByKey<T>(arrayOfSchema: EntitySchema<T>[], fn) {
  return arrayOfSchema.reduce((m, e) => {
    /* eslint-disable no-param-reassign */
    m[e.getKey()] = fn(e);
    return m;
  }, {});
}

function applyOptimisticUpdates<T>(entity: T, updates: ?OrderedMap): T {
  if (!updates || updates.size === 0) {
    return entity;
  }
  return Object.assign({}, entity, ...updates.valueSeq().toArray());
}

class EntityStore {
  static create(options): EntityStore {
    const { entities/* , queries */ } = options;
    const initialState = fromJS({
      entities: mapByKey(entities, () => ({})),
      // queries: mapByKey(queries || [], () => ({})),
      loadingStates: mapByKey(entities, () => ({})),
      optimisticUpdates: mapByKey(entities, () => ({})),
    });
    return new EntityStore(initialState);
  }

  state: EntityStoreState;

  constructor(state: EntityStoreState) {
    this.state = state;
  }

  // Data Retrieval

  getPessimistic<T>(schema: EntitySchema<T>, id: idType): T {
    return this.state.getIn([ENTITIES, schema.getKey(), I(id)]);
  }

  get<T>(schema: EntitySchema<T>, id: idType): T {
    return applyOptimisticUpdates(
      this.getPessimistic(schema, id),
      this.state.getIn([OPTIMISTIC_UPDATES, schema.getKey(), I(id)])
    );
  }

  has<T>(schema: EntitySchema<T>, id: idType): boolean {
    return this.state.hasIn([ENTITIES, schema.getKey(), I(id)]);
  }

  isLoading<T>(schema: EntitySchema<T>, id: idType): boolean {
    return this.state.getIn([LOADING_STATES, schema.getKey(), I(id)], false);
  }

  // Data Updating

  remove<T>(schema: EntitySchema<T>, id: idType): EntityStore {
    return this.fluent(state => state.deleteIn([ENTITIES, schema.getKey(), I(id)]));
  }

  // clear everything out, go back to initial state pretty much.
  clear(): EntityStore {
    // TODO
    return this.fluent(state => state);
  }

  update(schema: SchemaValue, data: NormalizeInput): EntityStore {
    const { entities } = normalize(data, schema);
    return this.updateNormalized(entities);
  }

  updateNormalized(entities: Object): EntityStore {
    // return this.fluent(
    //   state => state.update(ENTITIES, e => e.merge(entities))
    // );
    return this.fluent(state => {
      forEach(entities, (map, entityKey) => {
        forEach(map, (entity, id) => {
          // TODO: use object.assign
          state = state.setIn([ENTITIES, entityKey, I(id)], entity);
        });
      });
      return state;
    });
  }

  // loading states

  setIsLoading<T>(schema: EntitySchema<T>, id: idType, loading: boolean): EntityStore {
    return this.fluent(
      state => state.setIn([LOADING_STATES, schema.getKey(), I(id)], loading)
    );
  }

  // optimistic updates

  addOptimisticUpdate<T>(
    schema: EntitySchema<T>,
    id: idType,
    transactionId: any,
    objectToMerge: Object
  ): EntityStore {
    return this.fluent(
      state => state.updateIn(
        [OPTIMISTIC_UPDATES, schema.getKey(), I(id)],
        OrderedMap(),
        updates => updates.set(transactionId, objectToMerge)
      )
    );
  }

  removeOptimisticUpdate<T>(schema: EntitySchema<T>, id: idType, transactionId?: any): EntityStore {
    if (transactionId == null) {
      return this.fluent(
        state => state.deleteIn([OPTIMISTIC_UPDATES, schema.getKey(), I(id)])
      );
    }
    return this.fluent(
      state => state.updateIn(
        [OPTIMISTIC_UPDATES, schema.getKey(), I(id)],
        OrderedMap(),
        updates => updates.delete(transactionId)
      )
    );
  }

  fluent(stateMapper: StateMapper): EntityStore {
    return new EntityStore(stateMapper(this.state));
  }
}

module.exports = EntityStore;
