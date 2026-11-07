#!/bin/bash
BASE_URL="$1"

if [ "$#" -eq 0 ]; then
    echo "Usage: ./scripts/healthcheck.sh <base_url>"
    exit 1
fi

for i in {1..5}
do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] Pokusaj $i/5 - HTTP $HTTP_CODE"
    if [ "$HTTP_CODE" == "200" ]; then
        exit 0
    fi
    if [ "$i" -eq 5 ]; then
        exit 1
    fi 
    sleep 3
done

