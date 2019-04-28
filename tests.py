import datetime
import requests


# TODO: Tests modify local db bad bad bad


def test_event_post():
    r = requests.post(
        'http://localhost:8000/event',
        json={
            'event_type': 'click',
            'event_target': 'div123',
            'user_id': 31,
            'path': '/foo',
            'referrer': 'facebook',
            'email': 'test@example.com',
            'handle': 'coolguy223',
            'platform': 'iOS',
            'datetime': datetime.datetime.now().isoformat()
        })
    return r.status_code == 200


def test_get_events():
    r = requests.get('http://localhost:8000/events')
    before = len(r.json())
    test_event_post()
    test_event_post()
    r = requests.get('http://localhost:8000/events')
    return len(r.json()) == before + 2


def main():
    for name, func in globals().iteritems():
        if name.startswith('test_'):
            if func():
                print '.',
            else:
                print 'x',
    print 'done'


if __name__ == '__main__':
    main()
