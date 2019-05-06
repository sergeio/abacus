import os
import pwd

import psycopg2


def get_connection_cursor(db='test'):
    username = pwd.getpwuid(os.getuid()).pw_name
    conn = psycopg2.connect(database=db, user=username)
    cursor = conn.cursor()
    return conn, cursor

# TODO: Maybe we should use TEXT instead of VARCHAR?
# https://www.postgresql.org/docs/9.1/datatype-character.html

def create_tables(conn, cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id serial PRIMARY KEY,
            date date,
            datetime timestamp without time zone,
            email TEXT,
            event_target TEXT,
            event_type TEXT,
            handle TEXT,
            path TEXT,
            platform TEXT,
            referrer TEXT,
            user_id INTEGER
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_names (
            event_name TEXT PRIMARY KEY,
            email TEXT,
            event_target TEXT,
            event_type TEXT,
            handle TEXT,
            path TEXT,
            platform TEXT,
            referrer TEXT,
            user_id INTEGER
        );
    """)

    conn.commit()

# TODO: This is an infinite loop sometimes.  Is that bad?
def create_event_name_upsert_function(conn, cursor):
    # https://www.postgresql.org/docs/current/plpgsql-control-structures.html#PLPGSQL-UPSERT-EXAMPLE
    # TODO: xNULL is a hack.  SQL requires you to say IS NULL if a field is
    #       null, rather than using `=`.  There's probably a less-bad way to do
    #       this.
    cursor.execute("""
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
                UPDATE event_names
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
                    INSERT INTO event_names(
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
    """)
    conn.commit()


def show_warnings(conn, cursor):
    cursor.execute("""
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
    conn.commit()


def main():
    conn, cursor = get_connection_cursor()
    create_tables(conn, cursor)
    create_event_name_upsert_function(conn, cursor)
    show_warnings(conn, cursor)
    cursor.close()
    conn.close()


if __name__ == '__main__':
    main()
