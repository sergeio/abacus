#!/bin/bash
LOGS=~/frontend_start_logs.txt

echo -e "\n$(date) starting frontend" >> "$LOGS"
npm start --prefix /root/code/abacus/frontend >> "$LOGS" 2>&1
