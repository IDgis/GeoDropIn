#!/bin/bash

for tab in $(find /var/www/tabs -name '*.png'); do
	for stylesheet in $(find /var/www/stylesheets -name '*.xsl'); do
		sed -i -- "s|@${tab##*/}@|data:image/png;base64,$(base64 -w0 < "$tab")|g" $stylesheet
	done
done

exec nginx -g "daemon off;"