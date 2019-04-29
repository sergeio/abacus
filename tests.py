# -*- coding: utf-8 -*-
import datetime
import requests


# TODO: Tests modify local db bad bad bad


def make_request(method='get', resource='/', json={}):
    url = 'http://localhost:8080%s' % resource
    r = getattr(requests, method)(url, json=json)
    return r

def make_new_event(**args):
    default = {
        'event_type': 'click',
        'event_target': 'div123',
        'user_id': 31,
        'path': '/foo',
        'referrer': 'facebook',
        'email': 'test@example.com',
        'handle': 'coolguy223',
        'platform': 'iOS',
    }
    default.update(args)
    r = make_request('post', '/event', json=default)
    return r


def test_event_post():
    r = make_new_event()
    return r.status_code == 200


def test_get_events_by_day():
    r = make_request('post', '/events_by_day')
    before = len(r.json())
    today = datetime.datetime.utcnow().date()
    count_before = next(row['count']
                        for row in r.json()
                        if datetime.datetime.strptime(
                            row['date'],
                            '%a, %d %b %Y %H:%M:%S %Z'
                        ).date() == today)
    make_new_event()
    r = make_request('post', '/events_by_day')
    count_after = next(row['count']
                       for row in r.json()
                       if datetime.datetime.strptime(
                           row['date'],
                           '%a, %d %b %Y %H:%M:%S %Z'
                       ).date() == today)
    return count_before + 1 == count_after


def test_get_events_by_day_with_filters():
    make_new_event(user_id=99, referrer='google')
    r = make_request(
        'post',
        '/events_by_day',
        json={'filters': {'user_id': 99, 'referrer': 'google'}})
    before = len(r.json())
    today = datetime.datetime.utcnow().date()
    count_before = next(row['count']
                        for row in r.json()
                        if datetime.datetime.strptime(
                            row['date'],
                            '%a, %d %b %Y %H:%M:%S %Z'
                        ).date() == today)

    # Only user_id=99 should count
    make_new_event(user_id=99, referrer='google')
    make_new_event(user_id=101, referrer='google')
    make_new_event(user_id=101, referrer='google')

    r = make_request(
        'post',
        '/events_by_day',
        json={'filters': {'user_id': 99, 'referrer': 'google'}})

    count_after = next(row['count']
                       for row in r.json()
                       if datetime.datetime.strptime(
                           row['date'],
                           '%a, %d %b %Y %H:%M:%S %Z'
                       ).date() == today)
    return count_before + 1 == count_after


def test_get_events():
    r = make_request('get', '/events')
    before = len(r.json())
    make_new_event()
    make_new_event()
    r = make_request('get', '/events')

    # No key or value in table is None
    for row in r.json():
        for k, v in row.iteritems():
            assert k is not None, row
            assert v is not None, row
    return len(r.json()) == before + 2


def main():
    passed = failed = 0
    for name, func in globals().iteritems():
        if name.startswith('test_'):
            if func():
                passed += 1
                print '✓', name
            else:
                failed += 1
                print '✗', name
    if failed == 0:
        print 'all pass'
    else:
        print
        print ' FAILED %d test(s)' % failed


if __name__ == '__main__':
    main()
