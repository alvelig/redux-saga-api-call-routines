import _ from 'lodash';
import { put } from 'redux-saga/effects';
import { handleActions } from 'redux-actions';
import { ROUTINE_PROMISE_ACTION } from 'redux-saga-routines/src/constants';
import { createRoutine as _createRoutine, bindRoutineToReduxForm } from 'redux-saga-routines';
import ApiCallSaga, { ApiCall as _ApiCall } from './ApiCallSagas';

function bindRoutineToReduxFormPromise(routine) {
  return (values, dispatch, props) => new Promise((resolve, reject) => dispatch({
    type: ROUTINE_PROMISE_ACTION,
    payload: {
      values,
      props
    },
    meta: {
      defer: { resolve, reject },
      //reduxFormCompatible: true,
      routine
    }
  }));
}

export const createRoutine = (PREFIX, actionCreator, metaCreator) => {

  const routine = _createRoutine(PREFIX, actionCreator, metaCreator);

  routine.RESPONSE = _.replace(routine.TRIGGER, 'TRIGGER', 'RESPONSE');
  routine.ERROR = _.replace(routine.TRIGGER, 'TRIGGER', 'ERROR');

  routine.response = payload => ({
    type: routine.RESPONSE,
    payload
  });
  routine.error = payload => ({
    type: routine.ERROR,
    payload
  });

  let ROUTINE = bindRoutineToReduxForm(routine);

  routine.promise = bindRoutineToReduxFormPromise(routine);

  return Object.assign(ROUTINE, routine);
};

export const STATUS = {
  IDLE: 0,
  FETCHING: 1,
  FETCHED: 2,
  ERROR: -1
};

export const arrayToMap = (array, id = 'id') => {
  return _.reduce(array, (acc, val) => {
    acc[val[id]] = val;
    return acc;
  }, {});
};
export const mapToArray = (map, id = 'id') => _.values(map);

export { cancelAll } from './ApiCallActions';

export default ApiCallSaga;

export const ApiCall = _ApiCall;

export const routineHandler = (Routine, add, initialState) => {
  add = add || {};
  return handleActions(Object.assign({
    [Routine.TRIGGER]: (state, { payload }) => Object.assign(state, {
      status: STATUS.FETCHING
    }),
    [Routine.SUCCESS]: (state, { payload }) => Object.assign(state, {
      status: STATUS.FETCHED,
      payload
    }),
    [Routine.FAILURE]: (state, { payload }) => Object.assign(state, {
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
  successAccessor = result => result.json,
  errorAccessor = error => error.json && error.json.message ? error.json.message : "Error desconocido",
  isFormValid = action => true,
  body = action => undefined,
  url,
  auth,
  method,
  headers
}) => {
  return function* formSaga(action) {
    const { response, error } = yield* ApiCall(Routine, {
      auth,
      headers,
      url: _.isFunction(url) ? url(action) : url,
      body: _.isFunction(body) ? body(action) : body,
      method: _.isFunction(method) ? method(action) : method
    });
    if (response) {
      yield put(Routine.success(successAccessor(response)));
    } else {
      yield put(Routine.failure(errorAccessor(error)));
    }
    yield put(Routine.fulfill());
  };
};