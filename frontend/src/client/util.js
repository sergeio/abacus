const port = '8080';
const baseUrl =
  `${window.location.protocol}//${window.location.hostname}:${port}`;

export function calculateSelector(element) {
    var identifier = calculateIdentifier(element);

    if (identifier) {
      return element.tagName + identifier;

    } else if (element.parentNode) {
      return calculateSelector(element.parentNode) + ' > ' + element.tagName;

    } else {
      return element.tagName;
    }
}

function calculateIdentifier(element) {
  if (element.id) {
    return '#' + element.id;

  } else if (element.attributes['data-id']) {
    return '#' + element.attributes['data-id'];

  } else if (element.classList && element.classList[0]
                               && element.classList[0][0] !== '_') {
    // TODO: Look at popular inline stylye libraries to learn to detect their
    // naming conventions
    // Using classList here because className can be an object eg in SVGs
    return '.' + element.classList.toString();

  } else if (element.attributes && element.attributes.length > 0) {
    for (var attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        return '#d#' + attr.value;
      }
    }
  }
}

export function indexOf(element) {
    var parent = element.parentNode;
    if (!parent) return -1;
    var child, index = 1;
    if (!parent) return -1;
    for (child = parent.firstElementChild;
         child;
         child = child.nextElementSibling) {
        if (child === element) {
            return index;
        }
        ++index;
    }
    return -1;
}


export const getParams = () => {
    const parser = document.createElement('a');

    parser.href = window.location.href;

    if (parser.search === '') return {};

    const params = parser.search.split('&');
    const memo = {};

    params.forEach((param) => {
        let temp = param.split('?');

        temp = temp[temp.length - 1];

        const [key, value] = temp.split('=');

        memo[key] = decodeURIComponent(value);
    });

    return memo;
};

export const post = (options) => {
    let {
        resource,
        data,
        onSuccess,
        onError,
    } = options;
    const request = new XMLHttpRequest();

    if (resource[0] !== '/') resource = '/' + resource;

    request.open('POST', baseUrl+resource, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.setRequestHeader('Accept', 'application/json');

    request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
            let response;

            try {
                if (request.response) {
                    response = JSON.parse(request.response);
                } else {
                    response = 'No response';
                }
            } catch (e) {
                console.warn(e);
                onError(request.response);
            }
            onSuccess(response);
        } else {
            onError(request.responseText);
        }
    };

    request.onerror = () => {
        onError();
    };

    request.send(JSON.stringify(data));
};

export const get = (options) => {
    let {
        resource,
        onSuccess,
        onError,
    } = options;
    const request = new XMLHttpRequest();

    if (resource[0] !== '/') resource = '/' + resource;

    request.open('GET', baseUrl+resource, true);
    request.setRequestHeader('Accept', 'application/json');

    request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
            let data = {};
            try {
                if (request.response) {
                    data = JSON.parse(request.response);
                }
            } catch (e) {
                onError(request.response);
            }

            onSuccess({
                data,
                status: request.status,
            });
        } else if (onError) {
            onError(request.response);
        }
    };

    request.onerror = () => {
        if (onError) onError();
    };

    request.send();

    return request;
};

export const poll = (resource, onSuccess, onError, timeoutDuration) => {
    return get({
        resource,
        onSuccess: (response) => {
            if (response.status === 204) {
                window.setTimeout(() => {
                    poll(resource, onSuccess, onError);
                }, timeoutDuration || 2500);
            } else {
                onSuccess(response);
            }
        },
        onError,
    });
};

export const getMessageMeta = (message, attribute) => {
    if (!message || !message.data || !message.data.meta) {
        throw new Error('message is malformed');
    }

    if (attribute) return message.data.meta[attribute];

    return message.data.meta;
};

export const isDefined = (value) => {
    const defined = (value !== null && typeof value !== 'undefined');

    if (typeof value === 'string') {
        return defined && value.length > 0;
    }

    return defined;
};

export const debounce = (callback, wait, context = this) => {
    let timeout = null;
    let callbackArgs = null;

    const later = () => callback.apply(context, callbackArgs);

    return (...args) => {
        callbackArgs = args;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

function detectPlatform(userAgent) {
    // https://techblog.willshouse.com/2012/01/03/most-common-user-agents/
    let platform = 'strange';
    if (userAgent.match(/Windows/)) {
        platform = 'windows';
    } else if (userAgent.match(/Macintosh/)) {
        platform = 'mac';
    } else if (userAgent.match(/Linux/)) {
        platform = 'linux';
    } else if (userAgent.match(/iPad/)) {
        platform = 'ios';
    } else if (userAgent.match(/iPhone/)) {
        platform = 'ios';
    } else if (userAgent.match(/Android/)) {
        platform = 'android'
    }
    return platform;
}

export const makeData = (overrides) => {
    const defaults = {
        event_type: 'defaultTypeE',
        event_target: undefined,
        user_id: 31,
        path: window.location.pathname + (window.location.hash || ''),
        referrer: window.document.referrer,
        email: 'test@example.com',
        handle: 'coolguy223',
        platform: detectPlatform(navigator.userAgent),
    }

    /* TODO: Maybe we can't use spread syntax if this is going to run on
     * arbitrary sites that aren't transpiling their js.
     */
    return {...defaults, ...overrides}
}
