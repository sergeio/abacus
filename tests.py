# -*- coding: utf-8 -*-
import datetime
import requests


# TODO: Tests modify local db bad bad bad


def test_event_post():
    r = requests.post(
        'http://localhost:8080/event',
        json={
            'event_type': 'click',
            'event_target': 'div123',
            'user_id': 31,
            'path': '/foo',
            'referrer': 'facebook',
            'email': 'test@example.com',
            'handle': 'coolguy223',
            'platform': 'iOS',
        })
    return r.status_code == 200


def test_get_events_by_day():
    r = requests.get('http://localhost:8080/events_by_day')
    before = len(r.json())
    today = datetime.datetime.utcnow().date()
    count_before = next(row['count']
                        for row in r.json()
                        if datetime.datetime.strptime(
                            row['date'],
                            '%a, %d %b %Y %H:%M:%S %Z'
                        ).date() == today)
    test_event_post()
    r = requests.get('http://localhost:8080/events_by_day')
    count_after = next(row['count']
                       for row in r.json()
                       if datetime.datetime.strptime(
                           row['date'],
                           '%a, %d %b %Y %H:%M:%S %Z'
                       ).date() == today)
    return count_before + 1 == count_after


def test_get_events():
    r = requests.get('http://localhost:8080/events')
    before = len(r.json())
    test_event_post()
    test_event_post()
    r = requests.get('http://localhost:8080/events')

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
