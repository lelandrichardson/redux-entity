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
  Reference: require('./Reference'),
  Schema,
  arrayOf,
  valuesOf,
  // $FlowIgnore: suppressing module not found error
  ql: require('graphql-tag'),
  connect: require('./connect'),
  resolve: require('./resolve'),
};
