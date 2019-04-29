import datetime
import itertools
import logging

import schema
import database

import git
from flask import Flask
from flask import request
from flask import jsonify
app = Flask(__name__)


@app.route('/git', methods=['GET'])
def get_git_head_sha():
    r = git.Repo('.')
    c = r.commit(r.head)
    return "%s\n%s\n%s" % (c.hexsha, c.message, c.author)


@app.route('/events_by_day', methods=['post'])
def get_events_by_day():
    conn, cursor = database.get_connection_cursor()
    event_json = request.get_json() or {}

    filter_clause = ''
    filters = event_json.get('filters', {})
    filter_values = []
    if filters:
        filter_strings = []
        for key in schema.events:
            if key in filters:
                filter_strings.append(key + '=%s')
                filter_values.append(filters.get(key))

        filter_clause = 'WHERE ' + ' AND '.join(filter_strings)

    query = '''
        SELECT count(1), date
        FROM events
        %s
        GROUP BY date
        LIMIT 1000;
    ''' % filter_clause

    cursor.execute(query, filter_values)
    rows = cursor.fetchmany(1000)
    column_names = [desc[0] for desc in cursor.description]
    data = [dict(zip(column_names, row)) for row in rows]
    return jsonify(data)


@app.route('/events', methods=['GET'])
def get_events():
    conn, cursor = database.get_connection_cursor()
    cursor.execute('SELECT * FROM events LIMIT 1000;')
    rows = cursor.fetchmany(1000)
    column_names = [desc[0] for desc in cursor.description]
    data = [dict(zip(column_names, row)) for row in rows]
    return jsonify(data)


@app.route('/event', methods=['POST'])
def post_new_event():
    event_json = request.get_json()
    for field in schema.events:
        if field not in event_json and field not in ('datetime', 'date'):
            return 'Missing at least one field: ' + repr(field), 400

    conn, cursor = database.get_connection_cursor()
    cursor.execute(
        '''
        INSERT INTO events (
            event_type, event_target, user_id, path, referrer, email, handle,
            platform, datetime, date
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )''',
        (
            event_json['event_type'],
            event_json['event_target'],
            event_json['user_id'],
            event_json['path'],
            event_json['referrer'],
            event_json['email'],
            event_json['handle'],
            event_json['platform'],
            datetime.datetime.utcnow().isoformat(),
            datetime.datetime.utcnow().date().isoformat(),
        )
    )
    # slow. should reuse one connection
    conn.commit()
    cursor.close()
    conn.close()
    return '', 200
