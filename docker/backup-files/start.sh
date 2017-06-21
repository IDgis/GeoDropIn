#!/bin/bash

echo Generating config...

# store ssh key
mkdir -p /root/.ssh
ssh-keyscan -p $SFTP_PORT $SFTP_HOST > ~/.ssh/known_hosts

# store backup url
echo BACKUP_URL=sftp://$SFTP_USER:$SFTP_PASSWORD@$SFTP_HOST:$SFTP_PORT/$BACKUP_NAME > /etc/backup

mkfifo /opt/fifo
# tigger 'tail -f' to open fifo
echo Logging started... > /opt/fifo &

echo "00 0 * * * root /opt/backup.sh > /opt/fifo 2>&1" > /etc/crontab

echo Starting cron...

cron
tail -f /opt/fifo
