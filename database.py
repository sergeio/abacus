import os
import pwd

import psycopg2


def get_connection_cursor():
    username = pwd.getpwuid(os.getuid()).pw_name
    conn = psycopg2.connect(database='test', user=username)
    cursor = conn.cursor()
    return conn, cursor


def create_tables(conn, cursor):
    cursor.execute("""
        CREATE TABLE events (
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
    conn.commit()


def main():
    conn, cursor = get_connection_cursor()
    create_tables(conn, cursor)
    cursor.close()
    conn.close()


if __name__ == '__main__':
    main()
