#!/bin/bash

if [ -f /var/run/backup.pid ]; then
	if [ -d /proc/$(cat /var/run/backup.pid) ]; then
		echo backup is already running... $(date)
		exit 0
	else
		echo obsolete pid file found: /var/run/backup.pid
	fi
fi

echo $$ > /var/run/backup.pid

echo Performing remote backup: $(date)

# loading settings
. /etc/backup

# perform an incremental backup using duplicity:
echo "Performing incremental backup..."
duplicity incremental \
	--allow-source-mismatch \
	--no-encryption \
	--full-if-older-than=7D \
	/backup \
	"$BACKUP_URL"

echo "Removing old backups..."
duplicity remove-older-than \
	--allow-source-mismatch \
	14D \
	--force \
	"$BACKUP_URL"

# show backup files
echo Backup files:
du -ah /backup/*

# cleanup
rm /var/run/backup.pid 

echo Backup finished: $(date)