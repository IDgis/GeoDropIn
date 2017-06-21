FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install -y unzip curl build-essential libaio1

COPY instantclient-basic-linux.x64-12.1.0.2.0.zip /root
COPY instantclient-sdk-linux.x64-12.1.0.2.0.zip /root
COPY instantclient-sqlplus-linux.x64-12.1.0.2.0.zip /root

RUN cd /opt && \
	unzip ~/instantclient-basic-linux.x64-12.1.0.2.0.zip && \
	unzip ~/instantclient-sdk-linux.x64-12.1.0.2.0.zip && \
	unzip ~/instantclient-sqlplus-linux.x64-12.1.0.2.0.zip && \
	export LD_LIBRARY_PATH=/opt/instantclient_12_1 && \
	cd ~/ && \
	curl -O -J http://download.osgeo.org/gdal/2.1.2/gdal-2.1.2.tar.gz && \
	gunzip -c gdal-2.1.2.tar.gz | tar -xv && \
	cd /opt/instantclient_12_1 && \
	ln -s libclntsh.so.12.1 libclntsh.so && \
	cd ~/gdal-2.1.2 && \
	./configure --with-oci-include=/opt/instantclient_12_1/sdk/include --with-oci-lib=/opt/instantclient_12_1 && \
	make && \
	make install && \
	ldconfig && \
	rm -fr ~/gdal-2.1.2* && \
	rm -fr ~/instantclient*
	
COPY tnsnames.ora /opt/instantclient_12_1
RUN chmod a=rwx /opt/instantclient_12_1/tnsnames.ora