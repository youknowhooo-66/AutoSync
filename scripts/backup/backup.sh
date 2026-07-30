#!/bin/bash

# Configuration
BACKUP_DIR="/app/backups/daily"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=14
DB_NAME=${DB_NAME:-autosync}
DB_USER=${DB_USER:-postgres}
CONTAINER_NAME="autosync_db"

echo "[$TIMESTAMP] Starting automated backup for $DB_NAME..."

# Create directory if not exists
mkdir -p $BACKUP_DIR

# Perform backup using docker exec
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] Backup successfully created: backup_$TIMESTAMP.sql.gz"
else
    echo "[$TIMESTAMP] ERROR: Backup failed!"
    exit 1
fi

# Retention cleanup
echo "[$TIMESTAMP] Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$TIMESTAMP] Backup cycle complete."
