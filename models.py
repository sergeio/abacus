from sqlalchemy import Column
from sqlalchemy import Date
from sqlalchemy import DateTime
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import event
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


def values_to_dicts(rows, column_names):
    return [dict(zip(column_names, row)) for row in rows]


def models_to_dicts(rows, column_names=None):
    if not rows:
        return [{}]
    if not column_names:
        column_names = [c.key for c in rows[0].__table__.columns]
    return [{name: getattr(row, name) for name in column_names}
             for row in rows]


class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True)
    date = Column(Date)
    datetime = Column(DateTime(timezone=False))
    email = Column(String)
    event_target = Column(String)
    event_type = Column(String)
    handle = Column(String)
    path = Column(String)
    platform = Column(String)
    referrer = Column(String)
    user_id = Column(Integer)

    def __repr__(self):
        return ('<Event('
                'id={id!r} '
                'date={date!r} '
                'datetime={datetime!r} '
                'email={email!r} '
                'event_target={event_target!r} '
                'event_type={event_type!r} '
                'handle={handle!r} '
                'path={path!r} '
                'platform={platform!r} '
                'referrer={referrer!r} '
                'user_id={user_id!r})>'
                ).format(**self.__dict__)


class EventName(Base):
    __tablename__ = 'event_names'

    event_name = Column(String, primary_key=True)
    email = Column(String)
    event_target = Column(String)
    event_type = Column(String)
    handle = Column(String)
    path = Column(String)
    platform = Column(String)
    referrer = Column(String)
    user_id = Column(Integer)

    def __repr__(self):
        return ('<Event('
                'event_name={event_name!r} '
                'email={email!r} '
                'event_target={event_target!r} '
                'event_type={event_type!r} '
                'handle={handle!r} '
                'path={path!r} '
                'platform={platform!r} '
                'referrer={referrer!r} '
                'user_id={user_id!r})>'
                ).format(**self.__dict__)



def create_event_name_upsert_function(target, connection, **kwargs):
    # https://www.postgresql.org/docs/current/plpgsql-control-structures.html#PLPGSQL-UPSERT-EXAMPLE
    # TODO: xNULL is a hack.  SQL requires you to say IS NULL if a field is
    #       null, rather than using `=`.  There's probably a less-bad way to do
    #       this.
    connection.execute("""
        CREATE OR REPLACE FUNCTION upsert_event_name(
            f_event_name TEXT,
            f_email TEXT,
            f_event_target TEXT,
            f_event_type TEXT,
            f_handle TEXT,
            f_path TEXT,
            f_platform TEXT,
            f_referrer TEXT,
            f_user_id INTEGER
        )
        RETURNS VOID AS
        $$
        BEGIN
            f_event_name := COALESCE(f_event_name, 'xNULL');
            f_email := COALESCE(f_email, 'xNULL');
            f_event_target := COALESCE(f_event_target, 'xNULL');
            f_event_type := COALESCE(f_event_type, 'xNULL');
            f_handle := COALESCE(f_handle, 'xNULL');
            f_path := COALESCE(f_path, 'xNULL');
            f_platform := COALESCE(f_platform, 'xNULL');
            f_referrer := COALESCE(f_referrer, 'xNULL');
            f_user_id := COALESCE(f_user_id, -9999);
            LOOP
                -- first try to update the event_name
                UPDATE %s
                    SET event_name = f_event_name
                    WHERE email = email
                        AND event_target = f_event_target
                        AND event_type = f_event_type
                        AND handle = f_handle
                        AND path = f_path
                        AND platform = f_platform
                        AND referrer = f_referrer
                        AND user_id = f_user_id;
                IF found THEN
                    RETURN;
                END IF;
                -- not there, so try to insert
                -- if someone else inserts the same event_name concurrently,
                -- we could get uniqueness failure
                BEGIN
                    INSERT INTO %s(
                        event_name,
                        email,
                        event_target,
                        event_type,
                        handle,
                        path,
                        platform,
                        referrer,
                        user_id
                    )
                    VALUES (
                        f_event_name,
                        f_email,
                        f_event_target,
                        f_event_type,
                        f_handle,
                        f_path,
                        f_platform,
                        f_referrer,
                        f_user_id
                    );
                    RETURN;
                EXCEPTION WHEN unique_violation THEN
                    -- Do nothing, and loop to try the UPDATE again.
                END;
            END LOOP;
        END;
        $$
        LANGUAGE plpgsql;
    """ % (target.name, target.name))

event.listen(EventName.__table__, 'after_create', create_event_name_upsert_function)
