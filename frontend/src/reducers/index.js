import { combineReducers } from 'redux';

/*
 * The min/max dates from all the different data sets we've graphed.
 *
 * We don't want to have the x-axis changing every time you select a filter,
 * especially in the case that new events were added, or old events stopped
 * being used.
 *
 * So we store these min/max-dates to ensure that if a new event was added, we
 * see a bunch of 0-value dates in the graph, followed by an uptick when the
 * event is added.  And if an event was phased out, we should see some 0-value
 * dates on the right side of the x-axis.
 */
let globalMinDataDate;
let globalMaxDataDate;

function filteredEvents(state = {}, action) {
  if (action.type === 'GOT_FILTERED_EVENTS') {
    if (action.value.data && action.value.data[0]) {
      const minDataDate = action.value.data[0].date
      const maxDataDate = action.value.data[action.value.data.length - 1].date
      if (!globalMinDataDate || (minDataDate <= globalMinDataDate)) {
        globalMinDataDate = minDataDate
      } else {
        action.value.data.unshift({count: 0, date: globalMinDataDate})
      }
      if (!globalMaxDataDate || (maxDataDate >= globalMaxDataDate)) {
        globalMaxDataDate = maxDataDate
      } else {
        action.value.data.push({count: 0, date: globalMaxDataDate})
      }
    }
    return action.value;
  } else {
    return state;
  }
}

function eventNames(state = [], action) {
  if (action.type === 'GOT_EVENT_NAMES') {
    return action.value;
  } else {
    return state;
  }
}


let eventsByNameCache = {}
function eventsByName(state = {}, action) {
  if (action.type === 'GOT_EVENTS_BY_NAME') {
    if (action.value) {
      eventsByNameCache = {...eventsByNameCache, ...action.value}
    }
    return eventsByNameCache;
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

export default combineReducers({
  eventNames,
  eventsByName,
  filteredEvents,
  popularEvents,
});
