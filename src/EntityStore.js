/* eslint no-unused-vars: 0 */
import type { SchemaValue, idType, Identity, Keyable } from './types';
import type { NormalizeInput } from './normalize';
import type Resource from './Resource';
import type ResourceStore from './ResourceStore';
import type EntitySchema from './EntitySchema';

const { normalize } = require('./normalize');
// $FlowIgnore: suppressing module not found error
const { OrderedMap, Map, fromJS } = require('immutable');
// $FlowIgnore: suppressing module not found error
const forEach = require('lodash/forEach');

export type EntityStoreOptions = {
  entities: EntitySchema<*>[],
  resources: Resource<*, *>[],
};

export type EntityStoreState = Map;

const Id: ((x: idType) => string) = id => `${id}`;

const ENTITIES = 'entities';
const RESOURCES = 'resources';
const LOADING_STATES = 'loadingStates';
const OPTIMISTIC_UPDATES = 'optimisticUpdates';

function mapByKey(arrayOfSchema: Keyable[], fn) {
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
    const { entities, resources } = options;
    const initialState = fromJS({
      [ENTITIES]: mapByKey(entities, () => ({})),
      [RESOURCES]: mapByKey(resources || [], (e) => e.createInitialState()),
      [LOADING_STATES]: mapByKey(entities, () => ({})),
      [OPTIMISTIC_UPDATES]: mapByKey(entities, () => ({})),
    });
    return new EntityStore(initialState);
  }

  state: EntityStoreState;

  constructor(state: EntityStoreState) {
    this.state = state;
  }

  // Data Retrieval

  getPessimistic<T>(schema: EntitySchema<T>, id: idType): T {
    return this.state.getIn([ENTITIES, schema.getKey(), Id(id)]);
  }

  get<T>(schema: EntitySchema<T>, id: idType): T {
    return applyOptimisticUpdates(
      this.getPessimistic(schema, id),
      this.state.getIn([OPTIMISTIC_UPDATES, schema.getKey(), Id(id)])
    );
  }

  has<T>(schema: EntitySchema<T>, id: idType): boolean {
    return this.state.hasIn([ENTITIES, schema.getKey(), Id(id)]);
  }

  isLoading<T>(schema: EntitySchema<T>, id: idType): boolean {
    return this.state.getIn([LOADING_STATES, schema.getKey(), Id(id)], false);
  }

  // Data Updating

  remove<T>(schema: EntitySchema<T>, id: idType): this {
    return this.fluent(state => state.deleteIn([ENTITIES, schema.getKey(), Id(id)]));
  }

  // clear everything out, go back to initial state pretty much.
  clear(): EntityStore {
    // TODO
    return this.fluent(state => state);
  }

  update(schema: SchemaValue, data: NormalizeInput): this {
    const { entities } = normalize(data, schema);
    return this.updateNormalized(entities);
  }

  updateNormalized(entities: Object): this {
    // return this.fluent(
    //   state => state.update(ENTITIES, e => e.merge(entities))
    // );
    return this.fluent(state => {
      forEach(entities, (map, entityKey) => {
        forEach(map, (entity, id) => {
          // TODO: use object.assign
          state = state.setIn([ENTITIES, entityKey, Id(id)], entity);
        });
      });
      return state;
    });
  }

  // loading states

  setIsLoading<T>(schema: EntitySchema<T>, id: idType, loading: boolean): this {
    return this.fluent(
      state => state.setIn([LOADING_STATES, schema.getKey(), Id(id)], loading)
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
        [OPTIMISTIC_UPDATES, schema.getKey(), Id(id)],
        OrderedMap(),
        updates => updates.set(transactionId, objectToMerge)
      )
    );
  }

  removeOptimisticUpdate<T>(schema: EntitySchema<T>, id: idType, transactionId?: any): EntityStore {
    if (transactionId == null) {
      return this.fluent(
        state => state.deleteIn([OPTIMISTIC_UPDATES, schema.getKey(), Id(id)])
      );
    }
    return this.fluent(
      state => state.updateIn(
        [OPTIMISTIC_UPDATES, schema.getKey(), Id(id)],
        OrderedMap(),
        updates => updates.delete(transactionId)
      )
    );
  }

  fluent(stateMapper: Identity<EntityStoreState>): EntityStore {
    return new EntityStore(stateMapper(this.state));
  }

  for<T, X: ResourceStore<T>>(resource: Resource<T, X>, useResourceFn: Identity<X>): this {
    const store = resource.createStoreFromState(this.state);
    return this.fluent(() => useResourceFn(store).state);
  }

}

module.exports = EntityStore;
