import _ from 'lodash';
import { createRoutine as _createRoutine } from 'redux-saga-routines';
import ApiCallSaga, { ApiCall as _ApiCall } from './ApiCallSagas';

export const createRoutine = (PREFIX) => {
  const routine = _createRoutine(PREFIX);
  routine.RESPONSE = _.replace(routine.TRIGGER, 'TRIGGER', 'RESPONSE');
  routine.ERROR = _.replace(routine.TRIGGER, 'TRIGGER', 'ERROR');

  let ROUTINE = (payload, dispatch) => dispatch(routine.trigger(payload));

  return Object.assign(ROUTINE, routine);
};

export const STATUS = {
  IDLE: 0,
  FETCHING: 1,
  FETCHED: 2,
  ERROR: -1
};

export { cancelAll } from './ApiCallActions';

export default ApiCallSaga;

export const ApiCall = _ApiCall;
