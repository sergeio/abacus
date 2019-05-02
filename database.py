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
            event_type varchar(80),
            event_target varchar(1000),
            user_id INTEGER,
            path varchar(300),
            referrer varchar(80),
            email varchar(80),
            handle varchar(80),
            platform varchar(80),
            datetime timestamp without time zone,
            date date
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_names (
            event_type_and_target varchar(1000) PRIMARY KEY,
            event_name VARCHAR(80)
        );
    """)

    conn.commit()

# TODO: This is an infinite loop sometimes.  Is that bad?
def create_event_name_upsert_function(conn, cursor):
    # https://www.postgresql.org/docs/current/plpgsql-control-structures.html#PLPGSQL-UPSERT-EXAMPLE
    cursor.execute("""
        CREATE OR REPLACE FUNCTION upsert_event_name(type_target VARCHAR(1000),
                                                     name VARCHAR(80))
        RETURNS VOID AS
        $$
        BEGIN
            LOOP
                -- first try to update the type_target
                UPDATE event_names
                    SET event_name = name
                    WHERE event_type_and_target = type_target;
                IF found THEN
                    RETURN;
                END IF;
                -- not there, so try to insert the type_target
                -- if someone else inserts the same type_target concurrently,
                -- we could get event_type_and_target unique-type_target failure
                BEGIN
                    INSERT INTO event_names(event_type_and_target,event_name)
                        VALUES (type_target, name);
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


def main():
    conn, cursor = get_connection_cursor()
    create_tables(conn, cursor)
    create_event_name_upsert_function(conn, cursor)
    cursor.close()
    conn.close()


if __name__ == '__main__':
    main()
