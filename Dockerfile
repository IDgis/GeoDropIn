FROM idgis/meteor:1.7
MAINTAINER IDgis bv

RUN mkdir -p /home/meteorapp/app

ADD . /home/meteorapp/app

RUN cd /home/meteorapp/app \
	&& meteor npm install --production \
	&& meteor build ../build --directory --allow-superuser \
	# ----------------------------------------------
	&& cd /home/meteorapp/build/bundle/programs/server \
	&& npm install \
	# ----------------------------------------------
	# Clean up installed dependencies. We're done with it.
	&& rm -rf /home/meteorapp/app \
	&& /cleanup.sh
	
#RUN mkdir /var/lib/geodropinfiles && \
#	chown meteor:users /var/lib/geodropinfiles
	
RUN npm install -g forever

#USER meteor
CMD ["forever", "--minUptime", "1000", "--spinSleepTime", "1000", "/home/meteorapp/build/bundle/main.js"]
