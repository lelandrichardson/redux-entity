/* eslint no-restricted-syntax: 0 */
import type { SchemaMap, idType, AssignEntity, ExtractAttribute } from './types';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export type SchemaOptions = {
  idAttribute?: string | ExtractAttribute;
  meta?: any;
  assignEntity?: AssignEntity;
  defaults?: any;
}

class EntitySchema<T: any> {
  key: string;
  assignEntity: ?AssignEntity;
  getIdFunction: (x: T) => any;
  idAttribute: string | ExtractAttribute;
  meta: ?Object;
  defaults: ?Object;
  nestedSchema: SchemaMap;
  constructor(key: string, options?: SchemaOptions = {}) {
    if (!key || typeof key !== 'string') {
      throw new Error('A string non-empty key is required');
    }

    this.key = key;
    this.assignEntity = options.assignEntity;
    this.meta = options.meta;
    this.defaults = options.defaults;
    this.nestedSchema = {};

    const idAttribute = options.idAttribute || 'id';
    if (typeof idAttribute === 'function') {
      this.getIdFunction = idAttribute;
      this.idAttribute = idAttribute;
    } else {
      this.getIdFunction = x => x[idAttribute];
      this.idAttribute = idAttribute;
    }
  }

  getAssignEntity(): ?AssignEntity {
    return this.assignEntity;
  }

  getKey(): string {
    return this.key;
  }

  getId(entity: any): idType {
    return this.getIdFunction(entity);
  }

  getMeta(prop: string): any {
    if (!prop || typeof prop !== 'string') {
      throw new Error('A string non-empty property name is required');
    }
    return this.meta && this.meta[prop];
  }

  getDefaults() {
    return this.defaults || {};
  }

  define(nestedSchema: SchemaMap): void {
    for (const key in nestedSchema) {
      if (hasOwnProperty.call(nestedSchema, key)) {
        this.nestedSchema[key] = nestedSchema[key];
      }
    }
  }
}

module.exports = EntitySchema;
