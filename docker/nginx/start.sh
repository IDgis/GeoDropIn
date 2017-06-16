#!/bin/bash

for tab in $(find /var/www/tabs -name '*.png'); do
	for stylesheet in $(find /var/www/stylesheets -name '*.xsl'); do
		sed -i -- "s|@${tab##*/}@|data:image/png;base64,$(base64 -w0 < "$tab")|g" $stylesheet
	done
done

for stylesheet in $(find /var/www/stylesheets -name '*.xsl'); do
	sed -i -- "s|@logo.png@|data:image/png;base64,$(base64 -w0 < "/var/www/logos/$CLIENT.png")|g" $stylesheet
	sed -i -- "s|@confidential_check@|$STST_CONFIDENTIAL_CHECK|g" $stylesheet
done

if [ "$STST_PROCLAIMER_DISPLAY" = "false" ]; then
	for stylesheet in $(find /var/www/stylesheets -name '*.xsl'); do
		sed -i "/proclaimer-optional/d" $stylesheet
	done
else
	for stylesheet in $(find /var/www/stylesheets -name '*.xsl'); do
		sed -i -- "s|@client@|$CLIENT|g" $stylesheet
		sed -i -- "s|@portal_url@|$STST_URL|g" $stylesheet
		sed -i -- "s|@open_data_prefix@|$STST_OPEN_DATA_PREFIX|g" $stylesheet
		sed -i -- "s|@client_email@|$STST_EMAIL|g" $stylesheet
		sed -i -- "s|@client_proclaimer@|$STST_PROCLAIMER|g" $stylesheet
	done
fi

exec nginx -g "daemon off;"