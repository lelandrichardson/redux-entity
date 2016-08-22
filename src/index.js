/* eslint global-require: 0 */
const {
  Schema,
  arrayOf,
  valuesOf,
} = require('./normalize');

module.exports = {
  EntityStore: require('./EntityStore'),
  PagedFilteredList: require('./PagedFilteredList'),
  FilteredList: require('./FilteredList'),
  Resource: require('./Resource'),
  ResourceStore: require('./ResourceStore'),
  Schema,
  arrayOf,
  valuesOf,
};
