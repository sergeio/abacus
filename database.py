import os
import pwd
import json

import models

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker



# sudo -u postgres psql
# create user abacus with password somepass;
# grant ALL on database test to abacus;
config_path = os.path.expanduser('~/code/abacus/config.json')
config = json.load(open(config_path, 'r'))
engine = create_engine(
    'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db}'.format(
        **config),
    echo=False)
engine.connect()


Session = sessionmaker()
Session.configure(bind=engine)


def get_session():
    return Session()


def show_warnings(session):
    cursor = session.execute("""
        SELECT 'DROP FUNCTION ' || oid::regprocedure
        FROM   pg_proc
        WHERE  proname = 'upsert_event_name'
        AND    pg_function_is_visible(oid);
    """)
    all_upsert_functions = zip(*cursor.fetchall())[0]
    if len(all_upsert_functions) > 1:
        print ("Multiple 'upsert_event_name' functions found."
               " Delete all manually and try again.")
        print '\n'.join(all_upsert_functions)


def main():
    models.Base.metadata.create_all(engine)
    class DummyTarget(object):
        name = models.EventName.__tablename__
    models.create_event_name_upsert_function(DummyTarget, session)
    show_warnings(session)


if __name__ == '__main__':
    main()
