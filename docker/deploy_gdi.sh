#!/bin/bash

echo deploying...

COMPOSE_ARGS="\
        -f geodropin.yml \
        -p gdi"

docker pull ubuntu:xenial

docker-compose \
        $COMPOSE_ARGS \
        build

docker-compose \
        $COMPOSE_ARGS \
        up -d