`redux-saga-api-call-routines` is used to add authentication header to any "*_REQUEST" action. 
It is handy to use with redux-saga-routines.

It also refreshes the token if 403 error is returned.

All pending requests are cancelled if `cancelAll` is dispatched.

Installation:

TODO: provide an npm version

Configuration:

```javascript
import ApiCallSaga from 'redux-saga-api-call';

const predicate = (action) => {
  return action && _.endsWith(action.type, '_REQUEST') && action.payload && action.payload.url && action.payload.auth;
};

const api = { 
  /***
  * Promise
   * accepts payload from redux-saga-routine (expected url and fetch options)
   * returns fetch response with body resolved (ok and status must be present)
   * as they are conditions to detect success and rejected token responses
   * Maybe someday could make this conditions configurable...
  */
  fetchApi, //Promise - accepts payload from 
   /***
     * Promise
      * accepts refreshToken 
      * on success returns token, 
      * on token rejected returns null - in that case logout will be dispatched
      * other error throws error
     */
  refreshAccessToken 
};
const actions = { 
  logout, // logout action - if dispatched from somewhere else should trigger cancelAll 
  tokenRefreshing,  // set token is refreshing action 
  tokenRefreshed  // set token is refreshed action
};
const selectors = { 
  isTokenRefreshing, // is token refreshing now?
  selectAccessToken, // access token selector
  selectRefreshToken // refresh token selector
};

//
//your store and sagas configuration here
//
Saga.run([
  ... // <- other sagas here
  ApiCallSaga({
    predicate,
    ...api,
    ...actions,
    ...selectors,
  })
]);

```

fetchApi and refreshAccessToken could look like:
  
```javascript
//TODO: set url from .env
const baseUrl = 'http://localhost/api/v1';

const opts = {
  defaultOptions: {
    method: 'GET',
  },
  defaultHeaders: {
    "Content-Type": "application/json"
  },
};

//TODO: catch anyway
export const fetchApi = ({ url, headers = {}, ...options }, token) => {
  return fetch(baseUrl + url, {
    ...opts.defaultOptions,
    ...options,
    headers: new Headers({
      ...opts.defaultHeaders,
      ...headers,
      'Authorization': `Bearer ${token}`
    })
  })
  //TODO: agree on response format
    .then(response => response.json().then(json => ({ ...response, json })))
    .catch(error => error);
};
//TODO: call refresh token, return token or error
export const refreshAccessToken = (refreshToken) => {
  return fetch(baseUrl + '/refresh', {
    method: 'GET',
    headers: new Headers({
      ...opts.defaultHeaders,
      'Authorization': `Bearer ${refreshToken}`
    })
  })
    .then(response => ({ token }))
    .catch(error => ({ error }));
};

```


