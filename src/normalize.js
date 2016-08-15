/* eslint no-restricted-syntax: 0 */
import type { SchemaValue, AssignEntity, MergeIntoEntity } from './types';
import type { UnionSchemaOptions } from './UnionSchema';
import type { IterableSchemaOptions } from './IterableSchema';

export type NormalizeOptions = {
  assignEntity?: AssignEntity;
  mergeIntoEntity?: MergeIntoEntity;
}

export type NormalizeInput = Object | Array<Object>;

export type NormalizeOutput = {
  result: any;
  entities: Object;
}

const EntitySchema = require('./EntitySchema');
const IterableSchema = require('./IterableSchema');
const UnionSchema = require('./UnionSchema');
// $FlowIgnore: suppressing module not found error
const isEqual = require('lodash/isEqual');
// $FlowIgnore: suppressing module not found error
const isObject = require('lodash/isObject');

const hasOwnProperty = Object.prototype.hasOwnProperty;

function defaultAssignEntity(normalized, key, entity) {
  /* eslint-disable no-param-reassign */
  normalized[key] = entity;
}

function visitObject(obj, objSchema, bag, options, schema) {
  /* eslint-disable no-use-before-define */
  const { assignEntity = defaultAssignEntity } = options;
  let schemaAssignEntity = null;
  let normalized = {};
  if (schema instanceof EntitySchema) {
    schemaAssignEntity = schema.getAssignEntity();
    normalized = { ...schema.getDefaults() };
  }

  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      const entity = visit(obj[key], objSchema[key], bag, options);
      assignEntity.call(null, normalized, key, entity, obj, schema);
      if (schemaAssignEntity) {
        schemaAssignEntity.call(null, normalized, key, entity, obj, schema);
      }
    }
  }
  return normalized;
}

function defaultMapper(iterableSchema, itemSchema, bag, options) {
  return (obj: any) => visit(obj, itemSchema, bag, options);
}

function polymorphicMapper(iterableSchema, itemSchema, bag, options) {
  return (obj) => {
    const schemaKey = iterableSchema.getSchemaKey(obj);
    const result = visit(obj, itemSchema[schemaKey], bag, options);
    return { id: result, schema: schemaKey };
  };
}

function visitIterable(obj, iterableSchema, bag, options) {
  const itemSchema = iterableSchema.getItemSchema();
  const curriedItemMapper = defaultMapper(iterableSchema, itemSchema, bag, options);

  if (Array.isArray(obj)) {
    return obj.map(curriedItemMapper);
  }
  return Object.keys(obj).reduce((objMap: Object, key: string) => {
    objMap[key] = curriedItemMapper(obj[key]);
    return objMap;
  }, {});
}

function visitUnion(obj, unionSchema, bag, options) {
  const itemSchema = unionSchema.getItemSchema();
  return polymorphicMapper(unionSchema, itemSchema, bag, options)(obj);
}

function defaultMergeIntoEntity(entityA, entityB, entityKey) {
  /* eslint-disable no-param-reassign, no-continue */
  for (const key in entityB) {
    if (!hasOwnProperty.call(entityB, key)) {
      continue;
    }

    if (!hasOwnProperty.call(entityA, key) || isEqual(entityA[key], entityB[key])) {
      entityA[key] = entityB[key];
      continue;
    }

    console.warn(
      `When merging two ${entityKey}, found unequal data in their "${key}" values. ` +
      'Using the earlier value.',
      entityA[key], entityB[key]
    );
  }
}

function visitEntity<T: any>(
  entity: any,
  entitySchema: EntitySchema<T>,
  bag: Object,
  options: NormalizeOptions
) {
  const { mergeIntoEntity = defaultMergeIntoEntity } = options;

  const entityKey = entitySchema.getKey();
  const id = entitySchema.getId(entity);

  if (!hasOwnProperty.call(bag, entityKey)) {
    bag[entityKey] = {};
  }

  if (!hasOwnProperty.call(bag[entityKey], id)) {
    bag[entityKey][id] = {};
  }

  const stored = bag[entityKey][id];
  const normalized = visitObject(entity, entitySchema.nestedSchema, bag, options, entitySchema);
  mergeIntoEntity(stored, normalized, entityKey);

  return id;
}

function visit(obj: any, schema: SchemaValue, bag: Object, options: NormalizeOptions) {
  if (!isObject(obj) || !isObject(schema)) {
    return obj;
  }

  if (schema instanceof EntitySchema) {
    return visitEntity(obj, schema, bag, options);
  } else if (schema instanceof IterableSchema) {
    return visitIterable(obj, schema, bag, options);
  } else if (schema instanceof UnionSchema) {
    return visitUnion(obj, schema, bag, options);
  }
  return visitObject(obj, schema, bag, options, schema);
}

function arrayOf(schema: SchemaValue, options?: IterableSchemaOptions): IterableSchema {
  return new IterableSchema(schema, options);
}

function unionOf(schema: SchemaValue, options?: UnionSchemaOptions): UnionSchema {
  return new UnionSchema(schema, options);
}

function normalize(
  obj: NormalizeInput,
  schema: SchemaValue,
  options: NormalizeOptions = {}
): NormalizeOutput {
  if (!isObject(obj)) {
    throw new Error('Normalize accepts an object or an array as its input.');
  }

  if (!isObject(schema) || Array.isArray(schema)) {
    throw new Error('Normalize accepts an object for schema.');
  }

  const bag = {};
  const result = visit(obj, schema, bag, options);

  return {
    entities: bag,
    result,
  };
}

module.exports = {
  normalize,
  Schema: EntitySchema,
  unionOf,
  arrayOf,
  valuesOf: arrayOf,
};
