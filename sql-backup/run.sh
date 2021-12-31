#!/bin/sh

psql ${DATABASE_URL} -c "\copy submissions TO './submissions.csv' WITH (FORMAT CSV, HEADER)"
gzip submissions.csv
aws s3 cp submissions.csv.gz s3://kenkoooo/submissions.csv.gz --acl public-read
