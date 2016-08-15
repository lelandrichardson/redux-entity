import type { SchemaValue, ExtractAttribute } from './types';

// $FlowIgnore: suppressing module not found error
const isObject = require('lodash/isObject');
const UnionSchema = require('./UnionSchema');

export type IterableSchemaOptions = {
  schemaAttribute?: string | ExtractAttribute;
}

class ArraySchema {
  itemSchema: SchemaValue;
  constructor(itemSchema: SchemaValue, options?: IterableSchemaOptions = {}) {
    if (!isObject(itemSchema)) {
      throw new Error('ArraySchema requires item schema to be an object.');
    }

    if (options.schemaAttribute) {
      const schemaAttribute = options.schemaAttribute;
      this.itemSchema = new UnionSchema(itemSchema, { schemaAttribute });
    } else {
      this.itemSchema = itemSchema;
    }
  }

  getItemSchema(): SchemaValue {
    return this.itemSchema;
  }
}

module.exports = ArraySchema;
