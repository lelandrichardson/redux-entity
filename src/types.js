/* eslint no-use-before-define: 0 */
import type EntitySchema from './EntitySchema';
import type IterableSchema from './IterableSchema';
import type UnionSchema from './UnionSchema';

export type ExtractAttribute =
  (entity: any) => string;

export type AssignEntity =
  (output: any, key: string, value: any, input: any, schema: SchemaValue) => void;

export type MergeIntoEntity =
  (entityA: any, entityB: any, entityKey: string) => void;

export type idType = string | number;

export type SchemaMap = {
  [key: string]: SchemaValue;
}

export type SchemaValue = EntitySchema<*> | IterableSchema | UnionSchema | SchemaMap;
