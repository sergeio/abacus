import os

import psycopg2


def get_connection_cursor():
    conn = psycopg2.connect(database='test', user=os.environ['USER'])
    cursor = conn.cursor()
    return conn, cursor


def create_tables(conn, cursor):
    cursor.execute("""
        CREATE TABLE events (
            id serial PRIMARY KEY,
            event_type varchar(80),
            event_target varchar(80),
            user_id INTEGER,
            path varchar(300),
            referrer varchar(80),
            email varchar(80),
            handle varchar(80),
            platform varchar(80),
            datetime timestamp without time zone
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
