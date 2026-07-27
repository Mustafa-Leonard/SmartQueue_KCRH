#!/bin/bash
# ==============================================
# SmartQueue Database Backup Script
# ==============================================
# Usage: ./scripts/backup.sh [output_dir]
# Default output dir: ./database/backups

set -e

BACKUP_DIR="${1:-./database/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/smartqueue_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

# Load environment
if [ -f .env ]; then
  source .env
fi

DB_URL="${DATABASE_URL:-postgresql://smartqueue_user:SmartQueue@2024!@localhost:5432/smartqueue_db}"

echo "🔄 Starting SmartQueue database backup..."
echo "   Output: $BACKUP_FILE"

if [[ "$DB_URL" == *"sqlite"* ]]; then
  # SQLite backup (copy file)
  DB_PATH=$(echo "$DB_URL" | sed 's/^.*\///')
  if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "${BACKUP_FILE}.db"
    echo "✅ SQLite database copied to ${BACKUP_FILE}.db"
  else
    echo "❌ SQLite database file not found: $DB_PATH"
    exit 1
  fi
else
  # PostgreSQL backup using pg_dump
  pg_dump "$DB_URL" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --format=p \
    --file="$BACKUP_FILE"

  echo "✅ PostgreSQL backup completed: $BACKUP_FILE"
fi

# Compress
gzip -f "$BACKUP_FILE" 2>/dev/null || true
echo "   Compressed: ${BACKUP_FILE}.gz"

# Keep only last 30 backups
ls -t "${BACKUP_DIR}"/smartqueue_backup_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm

echo "✅ Backup completed successfully"
echo "   Size: $(du -h "${BACKUP_FILE}.gz" 2>/dev/null | cut -f1)"

