#!/bin/bash

echo deploying...

COMPOSE_ARGS="\
        -f base.yml \
        -p nginx"

docker pull ubuntu:xenial

docker-compose \
        $COMPOSE_ARGS \
        build

docker-compose \
        $COMPOSE_ARGS \
        up -d