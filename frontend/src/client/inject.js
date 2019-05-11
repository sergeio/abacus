import {
    calculateSelector,
    makeData,
    post,
} from './util';

// Monkey-patch pushState to create an onpushstate event
(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state, type: 'pushstate'});
        }
        return pushState.apply(history, arguments);
    };
})(window.history);

window.addEventListener('click', (event) => {
  const options = {
        resource: '/event',
        data: makeData({
          event_type: 'click',
          event_target: calculateSelector(event),
        }),
        onSuccess: (response) => {},
        onError: (error) => {
            console.warn(error);
        }
    };
    post(options);
});

function urlChange(state) {
  const type = {
    popstate: 'fwBackButton',
    pushstate: 'navigation',
  }[state.type] || state.type || 'urlChange'
  const options = {
        resource: '/event',
        data: makeData({event_type: type}),
        onSuccess: (response) => {},
        onError: (error) => {
            console.warn(error);
        }
    };
    post(options);
}

window.addEventListener('hashchange', urlChange)
window.addEventListener('popstate', urlChange)
window.history.onpushstate = urlChange

window.onload = function() {
  const options = {
        resource: '/event',
        data: makeData({event_type: 'truePageLoad'}),
        onSuccess: (response) => {},
        onError: (error) => {
            console.warn(error);
        }
    };
    post(options);
};
