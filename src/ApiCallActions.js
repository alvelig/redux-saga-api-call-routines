import { createAction } from 'redux-actions';

const ENTITY = "API_CALL";

export const cancelAll = createAction(`${ENTITY}/CANCEL_ALL`);