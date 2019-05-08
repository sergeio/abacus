import {
    post,
    calculateSelector,
} from './util';

window.addEventListener('click', (event) => {
  const options = {
        resource: '/event',
        data: {
            event_type: 'click',
            event_target: calculateSelector(event),
            user_id: 31,
            path: window.location.href,
            referrer: 'facebook',
            email: 'test@example.com',
            handle: 'coolguy223',
            platform: 'iOS',
        },
        onSuccess: (response) => {},
        onError: (error) => {
            console.warn(error);
        }
    };
    post(options);
});
