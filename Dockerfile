FROM ubuntu

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install openjdk-8-jdk wget gnupg -y && \
    echo "deb https://dl.bintray.com/sbt/debian /" | tee -a /etc/apt/sources.list.d/sbt.list && \
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2EE0EA64E40A89B84B2DF73499E82A75642AC823 && \
    apt-get update && \
    apt-get install webpack npm sbt postgresql -y && \
    service postgresql start && \
    su postgres -c "psql -c \"CREATE ROLE kenkoooo WITH LOGIN PASSWORD 'pass'\"; psql -c \"CREATE DATABASE test\"" && \
    sed -i -e "s/peer/md5/" /etc/postgresql/10/main/pg_hba.conf && \
    service postgresql restart
