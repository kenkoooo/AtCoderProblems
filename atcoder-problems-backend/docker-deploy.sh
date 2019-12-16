#!/bin/sh -x

cd $(dirname $0)
echo "$DOCKER_PASSWORD" | docker login -u kenkoooo --password-stdin
docker pull kenkoooo/atcoder-problems-backend
docker build -t kenkoooo/atcoder-problems-backend .
docker push kenkoooo/atcoder-problems-backend
