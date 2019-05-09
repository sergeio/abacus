import { combineReducers } from 'redux';

function filteredEvents(state = [], action) {
  if (action.type === 'GOT_FILTERED_EVENTS') {
    return action.value;
  } else {
    return state;
  }
}

function popularEvents(state = [], action) {
  if (action.type === 'GOT_POPULAR_EVENTS') {
    return action.value;
  } else {
    return state;
  }
}

export default combineReducers({filteredEvents, popularEvents});
