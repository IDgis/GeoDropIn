#!/bin/bash

# store database credentials (used by psql)
echo $PG_HOST:$PG_PORT:$PG_DBNAME:$PG_USER:$PG_PASSWORD > ~/.pgpass
chmod 0600 ~/.pgpass

# execute an sql query
exec_sql() {
	psql -q -h $PG_HOST -p $PG_PORT -U $PG_USER -c "$*" $PG_DBNAME 
}

# ensure that a specific environment exists
ensure_environment() {
	echo ensuring environment: $*
	exec_sql insert into publisher.environment\(identification, name, confidential, url, wms_only\) \
		values \(\'$1\', \'$2\', $3, \'$4\', $5\) \
		on conflict\(identification\) do update \
		set name = excluded.name, \
			confidential = excluded.confidential, \
			url = excluded.url, \
			wms_only = excluded.wms_only
}

# ensure that a specific datasource exists
ensure_datasource() {
	echo ensuring datasource: $*
	exec_sql insert into publisher.data_source\(identification, name\) \
		values\(\'$1\', \'$2\'\) \
		on conflict\(identification\) do update \
		set name = excluded.name
}

# produce all values of environment
# variables with a name starting with $1
all_environment_values() {
	( set -o posix ; set ) \
		| grep $1 \
		| cut -d = -f 1 \
		| xargs -i echo echo \${} \
		| source /dev/stdin
}

echo initializing database...

# try to query tables publisher.data_source and publisher.environment
while ! exec_sql \
	select count\(id\) from publisher.data_source \
	union all \
	select count\(id\) from publisher.environment > /dev/null 2>&1; do	
	echo database not yet available
	sleep 1
done

echo database available

IFS=$'\n'

for environment in $(all_environment_values ENVIRONMENT); do
	IFS=, read -ra environment_array <<<"$environment"
	ensure_environment "${environment_array[0]}" "${environment_array[1]}" "${environment_array[2]}" "${environment_array[3]}" "${environment_array[4]}"
done

for datasource in $(all_environment_values DATASOURCE); do
	IFS=, read -ra datasource_array <<<"$datasource"
	ensure_datasource "${datasource_array[0]}" "${datasource_array[1]}"
done

unset IFS