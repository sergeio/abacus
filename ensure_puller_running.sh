#!/bin/bash
# ensures puller is running

# put in /root/bin/
# make executable

process='/root/code/puller/venv/bin/python venv/bin/flask run'
makerun="/root/code/puller/start.sh"

if ps ax | grep -v grep | grep "$process" > /dev/null
then
    exit
else
    "$makerun" &
fi

exit
