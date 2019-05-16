import datetime
import itertools
import logging

import schema
import models
import database

import git
from flask_cors import CORS
from flask import Flask
from flask import request
from flask import jsonify
from sqlalchemy import func

app = Flask(__name__)
# TODO: Lock down CORS.  Security vulnerability
CORS(app)


@app.route('/git', methods=['GET'])
def get_git_head_sha():
    r = git.Repo('~/code/abacus')
    c = r.commit(r.head)
    return "%s\n%s" % (c.hexsha, c.message)

@app.route('/events_query', methods=['post'])
def query_events():
    session = database.get_session()
    event_json = request.get_json() or {}
    filters = event_json.get('filters', {})
    named_filters = event_json.get('named_filters', [])

    e_query = session.query(func.count(models.Event.id), models.Event.date)

    if named_filters and filters:
        return jsonify(
            {'error': 'No querying by filters AND named_filters'}), 400

    if named_filters:
        f_query = session.query(models.EventName)
        f_query = f_query.filter(
            models.EventName.event_name.in_(named_filters))
        event_name_rows = f_query.all()
        event_name_rows = models.models_to_dicts(event_name_rows)
        found_filters = set(
            row['event_name'] for row in event_name_rows if row)
        missing_filters = set(named_filters) - found_filters
        if missing_filters:
            return jsonify(
                {'error': 'No such filter(s) %r' % list(missing_filters)}), 400

        event_name_rows = [{k: v for k, v in row.iteritems()
                            if v not in ('xNULL', -9999)
                            if k != 'event_name'}
                           for row in event_name_rows]

        for row in event_name_rows:
            e_query = e_query.filter_by(**row)

    elif filters:
        valid_filters = set([c.key for c in models.Event.__table__.columns])
        filters = dict((k, v) for (k, v) in filters.iteritems()
                   if k in valid_filters and k in filters)
        e_query = e_query.filter_by(**filters)

    e_query = e_query.group_by(getattr(models.Event, 'date'))
    e_query = e_query.order_by(getattr(models.Event, 'date'))
    e_query = e_query.limit(10000)
    data = e_query.all()
    data = models.values_to_dicts(data, column_names=('count', 'date'))

    data = filter(lambda row: row.get('date'), data)

    session.close()

    for row in data:
        row['date'] = str(row['date'])
    return jsonify(data)


@app.route('/events', methods=['GET'])
def get_events():
    session = database.get_session()
    query = session.query(models.Event)
    rows = query.all()
    session.close()
    return jsonify(models.models_to_dicts(rows))


@app.route('/event_names', methods=['GET'])
def get_all_events():
    session = database.get_session()
    query = session.query(models.EventName).limit(1000)
    rows = query.all()
    session.close()
    return jsonify(models.models_to_dicts(rows))


@app.route('/popular_events', methods=['GET'])
def get_popular_events():
    session = database.get_session()
    query = session.query(
        func.count(models.Event.id),
        models.Event.event_type,
        models.Event.event_target,
    ).group_by(
        models.Event.event_type,
        models.Event.event_target,
    ).order_by(
        func.count(models.Event.id).desc()
    ).limit(100)
    events = query.all()

    event_names = session.query(models.EventName).limit(1000).all()

    events_dict = models.values_to_dicts(
            events, column_names=('count', 'event_type', 'event_target'))

    # TODO: This quadratic thing is baaad
    for event in events_dict:
        for name_row in event_names:
            if name_row.event_type not in ('xNULL', event['event_type']):
                continue
            if name_row.event_target not in ('xNULL', event['event_target']):
                continue
            event['event_name'] = name_row.event_name
            break

    session.close()
    return jsonify(events_dict)


@app.route('/new_event_name', methods=['POST'])
def name_new_event():
    schema = [
        'event_name',
        'email',
        'event_target',
        'event_type',
        'handle',
        'path',
        'platform',
        'referrer',
        'user_id',
    ]
    event_json = request.get_json() or {}
    logging.warn(event_json)
    if 'event_name' not in event_json:
        return 'Missing event_name in json', 400

    session = database.get_session()

    name = event_json['event_name']
    existing = session.query(models.EventName)
    existing = existing.filter_by(event_name=name).first()
    if existing:
        session.delete(existing)
        session.commit()

    text_query = 'SELECT upsert_event_name({});'.format(
        ', '.join('f_{col} := :{col}'.format(col=col)
                  for col in schema))
    session.execute(text_query,
                    {col: event_json.get(col) for col in schema})
    session.commit()
    session.close()
    return jsonify({'ok': True}), 200


@app.route('/event', methods=['POST'])
def post_new_event():
    event_json = request.get_json() or {}
    for field in schema.events:
        if field not in event_json and field not in (
                'datetime', 'date', 'event_target'):
            return 'Missing at least one field: ' + repr(field), 400

    session = database.get_session()
    new_event = models.Event(
        date=datetime.datetime.utcnow().date().isoformat(),
        datetime=datetime.datetime.utcnow().isoformat(),

        event_type=event_json['event_type'],
        event_target=event_json.get('event_target'),
        user_id=event_json['user_id'],
        path=event_json['path'],
        referrer=event_json['referrer'],
        email=event_json['email'],
        handle=event_json['handle'],
        platform=event_json['platform'],
    )
    session.add(new_event)
    session.commit()
    session.close()
    return '', 200
