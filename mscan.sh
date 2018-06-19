#!/bin/bash

find .build/bundle/programs/server/npm/node_modules/*/package.json |
while read file; do
	DIR="$(dirname $file)"
	OUTPUT="$(nsp check --output summary --color)"
	if [ $? != 0 ]; then
		echo -e "${OUTPUT}"
	fi
done
