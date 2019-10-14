#!/bin/sh

export SQL_PORT=5432
echo ${SQL_HOST}:${SQL_PORT}:${SQL_DB}:${SQL_USER}:${SQL_PASS} > ~/.pgpass
chmod 0600 ~/.pgpass
pg_dump -h ${SQL_HOST} -w -U ${SQL_USER} ${SQL_DB} > backup.sql
psql -h ${SQL_HOST} -w -U ${SQL_USER} -d ${SQL_DB} -c "\copy submissions TO './submissions.csv' WITH (FORMAT CSV, HEADER)"
gzip submissions.csv
aws s3 cp submissions.csv.gz s3://kenkoooo/submissions.csv.gz --acl public-read
