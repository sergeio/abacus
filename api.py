import git

import schema
import database

from flask import Flask
from flask import request
from flask import jsonify
app = Flask(__name__)


@app.route('/events', methods=['GET'])
def get_events():
    event_json = request.get_json()
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
        if field not in event_json:
            return 'Missing at least one field: ' + repr(field), 400

    conn, cursor = database.get_connection_cursor()
    cursor.execute(
        '''
        INSERT INTO events (
            event_type, event_target, user_id, path, referrer, email, handle,
            platform, datetime
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s
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
            event_json['datetime'],
        )
    )
    # slow. should reuse one connection
    conn.commit()
    cursor.close()
    conn.close()
    return '', 200
