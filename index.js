import _ from 'lodash';
import { handleActions } from 'redux-actions';
import { createRoutine as _createRoutine, bindRoutineToReduxForm } from 'redux-saga-routines';
import ApiCallSaga, { ApiCall as _ApiCall } from './ApiCallSagas';

export const createRoutine = (PREFIX, actionCreator, metaCreator) => {

  const routine = _createRoutine(PREFIX, actionCreator, metaCreator);

  routine.RESPONSE = _.replace(routine.TRIGGER, 'TRIGGER', 'RESPONSE');
  routine.ERROR = _.replace(routine.TRIGGER, 'TRIGGER', 'ERROR');

  routine.response = (payload) => ({
    type: routine.RESPONSE,
    payload
  });
  routine.error = (payload) => ({
    type: routine.ERROR,
    payload
  });

  let ROUTINE = bindRoutineToReduxForm(routine);

  return Object.assign(ROUTINE, routine);
};

export const STATUS = {
  IDLE: 0,
  FETCHING: 1,
  FETCHED: 2,
  ERROR: -1
};

export const arrayToMap = (array, id = 'id') => _.reduce( array, (acc, val) => {
  acc[val[id]] = val;
  return acc;
}, {});
export const mapToArray = (map, id = 'id') => _.values(map);

export { cancelAll } from './ApiCallActions';

export default ApiCallSaga;

export const ApiCall = _ApiCall;

export const routineHandler = (Routine, add, initialState) => {
  add = add || {};
  return handleActions(Object.assign({
    [Routine.TRIGGER]: (state, {payload}) =>
      Object.assign(state, {
        status: STATUS.FETCHING,
      }),
    [Routine.SUCCESS]: (state, {payload}) =>
      Object.assign(state, {
        status: STATUS.FETCHED,
        payload
      }),
    [Routine.FAILURE]: (state, {payload}) =>
      Object.assign(state, {
        status: STATUS.ERROR,
        error: payload
      }),
    add
  }), initialState || {
    status: STATUS.IDLE,
    payload: []
  });
};

export const formSagaCreator = (Routine, {
  successAccessor = (result) => result.json,
  errorAccessor = (error) => error.json && error.json.message ? error.json.message : "Error desconocido",
  isFormValid = (action) => true,
  body = (action) => undefined,
  url,
  method,
  ...fetchOpts
}) => {
  return function* formSaga(action) {
    //TODO: formValidation
    const { response, error } = yield* ApiCall(Routine, {
      url: url(action),
      body: body(action),
      method: method(action),
      ...fetchOpts
    });
    if(response) {
      yield put(Routine.success(successAccessor(response)));
    } else {
      yield put(Routine.failure(errorAccessor(error)));
    }
    yield put(Routine.fulfill());
  }
};