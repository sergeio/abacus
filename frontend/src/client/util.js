export function calculateSelector(event) {
    var element = event.target;
    var selector = element.tagName + ":nth-child(" + indexOf(element) + ")";
    while ((element = element.parentElement) != null) {
        if (element.tagName === "BODY") {
            selector = "BODY > " + selector;
            break;
        }
        selector = element.tagName + ":nth-child(" + indexOf(element) + ") > " + selector;
    }

    return selector;
}

export function indexOf(element) {
    var parent = element.parentNode;
    var child, index = 1;
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
    const {
        url,
        data,
        onSuccess,
        onError,
    } = options;
    const request = new XMLHttpRequest();

    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.setRequestHeader('Accept', 'application/json');

    request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
            let response;

            try {
                if (request.response) {
                    response = JSON.parse(request.response);
                } else {
                    response = "No response"
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
    const {
        url,
        onSuccess,
        onError,
    } = options;
    const request = new XMLHttpRequest();

    request.open('GET', url, true);
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

export const poll = (url, onSuccess, onError, timeoutDuration) => {
    return get({
        url,
        onSuccess: (response) => {
            if (response.status === 204) {
                window.setTimeout(() => {
                    poll(url, onSuccess, onError);
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
