import type { SchemaValue, ExtractAttribute } from './types';

// $FlowIgnore: suppressing module not found error
const isObject = require('lodash/isObject');

export type UnionSchemaOptions = {
  schemaAttribute?: string | ExtractAttribute;
}

class UnionSchema {
  itemSchema: SchemaValue;
  getSchema: ExtractAttribute;
  constructor(itemSchema: SchemaValue, options?: UnionSchemaOptions = {}) {
    if (!isObject(itemSchema)) {
      throw new Error('UnionSchema requires item schema to be an object.');
    }

    if (!options || !options.schemaAttribute) {
      throw new Error('UnionSchema requires schemaAttribute option.');
    }

    this.itemSchema = itemSchema;

    const schemaAttribute = options.schemaAttribute;
    this.getSchema = typeof schemaAttribute === 'function'
      ? schemaAttribute
      : x => x[schemaAttribute];
  }

  getItemSchema() {
    return this.itemSchema;
  }

  getSchemaKey(item: any): string {
    return this.getSchema(item);
  }
}

module.exports = UnionSchema;
