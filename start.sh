#!/bin/bash
LOGS=~/abacus_start_logs.txt
export FLASK_APP=~/code/abacus/abacus.py

echo "\n\$(date) starting abacus" >> "$LOGS"
~/code/abacus/venv/bin/flask run --host=0.0.0.0 --port=3003 2>&1 >> "$LOGS"
