import type EntityStore from './EntityStore';
import type { GraphQLQuery } from './types';

// $FlowIgnore: suppressing module not found error
const { Map, List } = require('immutable');
const Resource = require('./Resource');
const EntitySchema = require('./EntitySchema');
const Reference = require('./Reference');
// $FlowIgnore: suppressing module not found error
const graphql = require('graphql-anywhere').default;

const resolver = (
  fieldName: string,
  rootValue: any,
  variables: { [key: string]: any },
  store: EntityStore
) => {
  if (rootValue === null) {
    const schema = store.getSchema(fieldName);
    if (schema) {
      if (schema instanceof EntitySchema) {
        // TODO(lmr): check for presence of variables.id and throw otherwise?
        return store.get(schema, variables.id);
      }
      if (schema instanceof Resource) {
        return store.getResource(schema).resolve(variables);
      }
      // TODO(lmr): Throw error? This shouldn't happen.
    }
    // TODO(lmr): Throw error? This shouldn't happen.
  }

  let obj = rootValue;

  if (obj instanceof Reference) {
    obj = store.get(obj.schema, obj.id);
  }

  const value = obj instanceof Map
    ? obj.get(fieldName)
    : obj[fieldName];

  if (value instanceof Reference) {
    return store.get(value.schema, value.id);
  }

  if (value instanceof List) {
    return value.toArray();
  }

  return value;
};

const resolve = (
  store: EntityStore,
  query: GraphQLQuery,
  variables: { [key: string]: any }
) => graphql(resolver, query, null, store, variables);

module.exports = resolve;
