function getFilteredEventsWithDispatch(dispatch, filterKey, filterValue) {
  fetch(
    (window.location.protocol + '//' + window.location.hostname +
      ':8080/events_query'),
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({filters: {[filterKey]: filterValue}}),
    }
  ).then((result) => result.json()
  ).then((data) => {
    dispatch({
      type: 'GOT_FILTERED_EVENTS',
      value: {data, filterKey, filterValue},
    });
  }).catch((error) => console.log(error))
}

export { getFilteredEventsWithDispatch };
