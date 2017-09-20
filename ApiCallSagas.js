import _ from 'lodash';
import invariant from 'fbjs/lib/invariant';
import { call, put, race, select, take, takeEvery } from 'redux-saga/effects';
import { cancelAll } from './ApiCallActions';

const opts = {
  predicate: (action) => {
    return action && _.endsWith(action.type, '_REQUEST') && action.payload && action.payload.url && action.payload.auth;
  },
  response: (action, payload) => ({
    type: _.replace(action.type, '_REQUEST', '_RESPONSE'),
    payload
  }),
  error: (action, payload) => ({
    type: _.replace(action.type, '_REQUEST', '_ERROR'),
    payload
  })
};

function *apiCall({ fetchApi, refreshAccessToken },
                  { logout, tokenRefreshing, tokenRefreshed },
                  { isTokenRefreshing, selectAccessToken, selectRefreshToken },
                  { payload }) {

  /*** any error means error ***/
  try {

    let exit = false;

    /*** this loop is to be able to retry the request in case ***/
    while (true) {
      const isTokenRefreshing = yield select(isTokenRefreshing);
      if (isTokenRefreshing) {

        const { cancelled } = yield race({
          refreshed: take(`${tokenRefreshed}`),
          cancelled: take(`${cancelAll}`)
        });

        if (cancelled) {
          return;
        }
      }

      const token = yield select(selectAccessToken);

      const { response, cancelled } = yield race({
        response: call(fetchApi, payload, token),
        cancelled: take(`${cancelAll}`)
      });

      if (cancelled) {
        return;
      }

      if (response.ok) {
        yield put(opts.response(action, response.body));
        return;
      }

      if(!exit && response.status === 403) {

        const refreshToken = yield select(selectRefreshToken);
        if(!refreshToken) {
          yield put(logout());
          return;
        }

        yield put(tokenRefreshing());

        const {refreshedTokenResponse, cancelled} = yield race({
          refreshedTokenResponse: call(refreshAccessToken, refreshToken),
          cancelled: take(`${cancelAll}`)
        });

        if(cancelled) {
          return;
        }

        const { token, error } = refreshedTokenResponse;

        if(error.status === 403) {
          /*** TOKEN INVALID - LOGOUT (LOGOUT WILL CANCEL ALL OTHER PENDING REQUESTS) ***/
          yield put(logout());
          return;
        }

        if(error) {
          yield put(opts.error(error));
          return;
        }

        if(token) {
          yield put(tokenRefreshed(token));
          continue;
        }

      } else {

        yield put(opts.error(action, { ...response.json, response }));
        return;

      }
    }
  } catch (e) {
    console.error(e.message);
    yield put(opts.error(e));
  }
}

export default function *ApiCallSagas({
                                        fetchApi,
                                        refreshAccessToken,
                                        logout,
                                        tokenRefreshing,
                                        tokenRefreshed,
                                        isTokenRefreshing,
                                        selectAccessToken,
                                        selectRefreshToken
                                      } = {},
                                      pattern = opts.predicate) {

  invariant(fetchApi, "fetchApi method must be defined within the argument passed to ApiCallSagas");
  invariant(refreshAccessToken, "refreshAccessToken method must be defined within the argument passed to ApiCallSagas");
  invariant(logout, "logout action must be defined within the argument passed to ApiCallSagas");
  invariant(tokenRefreshing, "tokenRefreshing action must be defined within the argument passed to ApiCallSagas");
  invariant(tokenRefreshed, "tokenRefreshed action must be defined within the argument passed to ApiCallSagas");
  invariant(isTokenRefreshing, "isTokenRefreshing selector must be defined within the argument passed to ApiCallSagas");
  invariant(selectAccessToken, "selectAccessToken selector must be defined within the argument passed to ApiCallSagas");
  invariant(selectRefreshToken, "selectRefreshToken selector must be defined within the argument passed to ApiCallSagas");

  yield takeEvery(pattern, apiCall,
    { fetchApi, refreshAccessToken },
    { logout, tokenRefreshing, tokenRefreshed },
    { isTokenRefreshing, selectAccessToken, selectRefreshToken });
}