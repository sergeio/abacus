#!/bin/bash
# ensures frontend is running

# Make symlink in /usr/bin
# make executable

process='npm'
makerun='/root/code/abacus/frontend/start.sh'

if ps ax | grep -v grep | grep "$process" > /dev/null
then
    exit
else
    "$makerun" &
fi

exit
