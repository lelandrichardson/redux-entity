/* eslint no-use-before-define: 0 */
import type EntitySchema from './EntitySchema';
import type IterableSchema from './IterableSchema';
import type UnionSchema from './UnionSchema';
import type Resource from './Resource';

export type Identity<T> = (x: T) => T;

export type ExtractAttribute =
  (entity: any) => string;

export type AssignEntity =
  (output: any, key: string, value: any, input: any, schema: SchemaValue) => void;

export type MergeIntoEntity =
  (entityA: any, entityB: any, entityKey: string) => void;

export type idType = string | number;

export type Filter = Object;

export type SchemaMap = {
  [key: string]: SchemaValue;
}

export type SchemaValue = EntitySchema<*> | IterableSchema | UnionSchema | SchemaMap;

export type Keyable = EntitySchema<*> | Resource<*>;

export type GraphQLQuery = Object;
