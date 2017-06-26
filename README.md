# Geodropin

## Step 1: create docker network - once

Create a common docker network named gdi-base with ``docker network create gdi-base``

## Step 2: create user and logo in geodropin app - for each user

- Go into geodropin app with ``docker exec -it gdi_gdi.web_1 bash`` 
- Execute ``cd /app`` and ``meteor --allow-superuser --settings settings.json``
- Start another command prompt and run ``docker exec -it gdi_gdi.web_1 bash`` again
- Start a meteor shell with ``meteor --allow-superuser shell``
- Add a user with ``Accounts.createUser({username: [username], password: [password]});``
- You can exit the containers, remember to quit the running meteor session in the first command prompt
- Finally add a logo to the container with: ``docker cp [username].png gdi_gdi.web_1:/var/lib/geodropinlogos``
- The logo file has to have the same name as the username it belongs to

## Step 3: copy jks files in service container - for each user

- Execute ``docker cp private.jks [client_prefix]_pub.service_1:/etc/geo-publisher/ssl``
- Execute ``docker cp trusted.jks [client_prefix]_pub.service_1:/etc/geo-publisher/ssl``

## Step 4: add a conf file for each client in proxy - for each user

In the GeoDropIn folder path ``/docker/nginx/conf`` add a conf file for each client, you can copy and edit the example set bij ``rijssenholten.conf``

## Step 5: create user and related tables (execute this as system) - for each user

Execute this sql in sqlplus. You can copy and paste this, sqlplus can handle newlines:

```
create user [username] identified by [password] default tablespace users temporary tablespace temp;
grant connect to [username];
grant resource to [username];
grant unlimited tablespace to [username];

alter user [username] grant connect through system;
connect system[[username]]/[system_password]

create table dummy as (select * from dual);
create table GDB_ITEMS_VW (
	UUID varchar(38) not null, 
	GEODROPINID varchar(38) not null, 
	TYPE varchar(38) not null, 
	PHYSICALNAME nvarchar2(452) not null, 
	DOCUMENTATION clob not null, 
	constraint pk_uuid primary key(UUID), 
	constraint geodropinid_unique unique(GEODROPINID));
```

## Step 6: add template to oracle-metadata app - for each user

- Under ``src/main/resources`` and package ``nl.idgis.geodropin.oracle.metadata`` add a template for each user according to name convention ``dataset_template_[user].xml``
- Go to GeoDropIn folder path ``/oracle-metadata``
- Execute ``gradlew buildImage``
- Log into docker account with ``docker login``
- Push image to docker hub with ``docker push idgis/oracle-metadata``

**You now have succesfully set up everything needed for GeoDropIn. See below for inserting a shapefile and a metadata record in Oracle.**

## Inserting a shapefile in Oracle

- Go into ogr2ogr container with ``docker exec -it gdi_ogr2ogr_1 bash``
- Execute ``cd /var/lib/shapefiles/``
- Execute ``curl -O -J [url_to_shapefile]``
- Execute ``unzip [file_zip] -d [map]`` (this is a map which will be created and which will contain the files of the zip)
- Execute ``rm [file_zip]``
- Execute ``ogr2ogr -f OCI OCI:[user_oracle]/[password_oracle]@oracle-xec:[user_oracle].dummy path/to/shape.shp -nlt [type_vector] -lco SRID=[srid] -lco PRECISION=NO -lco DIM=2`` (type_vecor is either MULTIPOINT, MULTIPOLYGON or MULTILINESTRING)
- Execute ``rm -r [map]``

## Inserting or updating a metadata record in Oracle

``docker run -e "JAVA_OPTS=-Xmx32M -Duser.timezone=Europe/Amsterdam" -e "GEODROPIN_HOST=[host_geodropin_app]" -e "DB_IP=gdi_oracle_1" -e "DB_PORT=1521" -e "DB_SID=XE" -e "DB_USER=[user_oracle_database]" -e "DB_PASSWORD=[password_oracle_database]" --rm --network gdi-base idgis/oracle-metadata /opt/bin/oracle-metadata [insert/update] [user] [geodropin_id] [physicalname]``

[user] should match the template in oracle-metadata app: ``dataset_template_[user].xml``