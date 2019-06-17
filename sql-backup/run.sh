#!/bin/sh

export SQL_PORT=5432
echo ${SQL_HOST}:${SQL_PORT}:${SQL_DB}:${SQL_USER}:${SQL_PASS} > ~/.pgpass
chmod 0600 ~/.pgpass
pg_dump -h ${SQL_HOST} -w -U ${SQL_USER} ${SQL_DB} > backup.sql
aws s3 cp backup.sql s3://kenkoooo/atcoder.sql
