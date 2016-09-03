import type { GraphQLQuery } from './types';

// $FlowIgnore: suppressing module not found error
const ReactRedux = require('react-redux');
const resolve = require('./resolve');

type PropsMapper = (state: any, props: any) => any;
type DispatchMapper = (dispatch: void) => any;

const defaultMapDispatchToProps = dispatch => ({ dispatch });
const defaultMapPropsToVariables = props => props;

const connect = (
  query: GraphQLQuery,
  mapPropsToVariables: PropsMapper = defaultMapPropsToVariables,
  mapDispatchToProps: DispatchMapper = defaultMapDispatchToProps
) => ReactRedux.connect(
  (state, props) => resolve(state.entities, query, mapPropsToVariables(props, state)),
  mapDispatchToProps
);

module.exports = connect;
