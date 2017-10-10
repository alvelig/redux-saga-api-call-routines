import { handleActions } from 'redux-actions';
import { createRoutine as _createRoutine } from 'redux-saga-routines';
import ApiCallSaga, { ApiCall as _ApiCall } from './ApiCallSagas';

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

export const ApiCall = _ApiCall;

export const routineHandler = (Routine, add, initialState) => {
  add = add || {};
  return handleActions({
    [Routine.TRIGGER]: (state, {payload}) => ({
      ...state,
      status: STATUS.FETCHING,
    }),
    [Routine.SUCCESS]: (state, {payload}) => ({
      ...state,
      status: STATUS.FETCHED,
      payload
    }),
    [Routine.FAILURE]: (state, {payload}) => ({
      ...state,
      status: STATUS.ERROR,
      error: payload
    }),
    ...add
  }, initialState || {
    status: STATUS.IDLE,
    payload: []
  });
};