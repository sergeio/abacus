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


@app.route('/events_by_day', methods=['post'])
def get_events_by_day():
    session = database.session
    event_json = request.get_json() or {}

    filters = event_json.get('filters', {})

    query = session.query(func.count(models.Event.id), models.Event.date)
    if filters:
        valid_filters = set([c.key for c in models.Event.__table__.columns])
        filters = dict((k, v) for (k, v) in filters.iteritems()
                   if k in valid_filters)
        query = query.filter_by(**filters)

    query = query.group_by(models.Event.date)
    query = query.order_by(models.Event.date)
    query = query.limit(1000)
    data = query.all()
    data = models.values_to_dicts(data, column_names=('count', 'date'))

    data = filter(lambda row: row.get('date'), data)

    for row in data:
        row['date'] = str(row['date'])
    return jsonify(data)


@app.route('/events', methods=['GET'])
def get_events():
    session = database.session
    query = session.query(models.Event).limit(1000)
    rows = query.all()
    return jsonify(models.models_to_dicts(rows))


@app.route('/event_names', methods=['GET'])
def get_all_events():
    session = database.session
    query = session.query(models.EventName).limit(1000)
    rows = query.all()
    return jsonify(models.models_to_dicts(rows))


@app.route('/popular_events', methods=['GET'])
def get_popular_events():
    query = database.session.query(
        func.count(models.Event.id),
        models.Event.event_type,
        models.Event.event_target,
    ).group_by(
        models.Event.event_type,
        models.Event.event_target,
    ).order_by(
        func.count(models.Event.id).desc()
    ).limit(100)
    data = query.all()
    return jsonify(models.values_to_dicts(
        data, column_names=('count', 'event_type', 'event_target')))


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

    session = database.session
    text_query = 'SELECT upsert_event_name({});'.format(
        ', '.join('f_{col} := :{col}'.format(col=col)
                  for col in schema))
    cursor = session.execute(text_query,
                             {col: event_json.get(col) for col in schema})
    return 'ok', 200


@app.route('/event', methods=['POST'])
def post_new_event():
    event_json = request.get_json() or {}
    for field in schema.events:
        if field not in event_json and field not in ('datetime', 'date'):
            return 'Missing at least one field: ' + repr(field), 400

    session = database.session
    new_event = models.Event(
        date=datetime.datetime.utcnow().isoformat(),
        datetime=datetime.datetime.utcnow().date().isoformat(),

        event_type=event_json['event_type'],
        event_target=event_json['event_target'],
        user_id=event_json['user_id'],
        path=event_json['path'],
        referrer=event_json['referrer'],
        email=event_json['email'],
        handle=event_json['handle'],
        platform=event_json['platform'],
    )
    session.add(new_event)
    # slow. should reuse one connection
    return '', 200
