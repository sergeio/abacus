#!/bin/bash
LOGS=~/abacus_start_logs.txt
export FLASK_APP=~/code/abacus/api.py
export FLASK_DEBUG=$1

echo -e "\n$(date) starting abacus" >> "$LOGS"
~/code/abacus/venv/bin/flask run --host=0.0.0.0 --port=8080 >> "$LOGS" 2>&1
