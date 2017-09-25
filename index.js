import { createRoutine as _createRoutine } from 'redux-saga-routines';
import ApiCallSaga from './ApiCallSagas';

export const createRoutine = (PREFIX) => {
  const routine = _createRoutine(PREFIX);
  routine.RESPONSE = `${PREFIX}_RESPONSE`;
  routine.ERROR = `${PREFIX}_ERROR`;
  return routine;
};

export const STATUS = {
  IDLE: 0,
  FETCHING: 1,
  FETCHED: 2,
  ERROR: -1
};

export { cancelAll } from './ApiCallActions';

export default ApiCallSaga;
