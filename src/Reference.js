import type EntitySchema from './EntitySchema';
import type { idType } from './types';

class Reference {
  schema: EntitySchema<*>;
  id: idType;
  constructor(schema: EntitySchema<*>, id: idType) {
    this.schema = schema;
    this.id = id;
  }

  toJSON() {
    return `${this.schema.getKey()}(${this.id})`;
  }
}

module.exports = Reference;
