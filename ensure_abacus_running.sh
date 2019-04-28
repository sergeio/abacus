#!/bin/bash
# ensures abacus is running

# Make symlink in /usr/bin
# make executable

process='/root/code/abacus/venv/bin/python venv/bin/flask run'
makerun="/root/code/abacus/start.sh"

if ps ax | grep -v grep | grep "$process" > /dev/null
then
    exit
else
    "$makerun" &
fi

exit
