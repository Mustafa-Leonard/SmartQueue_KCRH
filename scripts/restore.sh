#!/bin/bash
# ==============================================
# SmartQueue Database Restore Script
# ==============================================
# Usage: ./scripts/restore.sh <backup_file.sql.gz>
# Example: ./scripts/restore.sh ./database/backups/smartqueue_backup_20240101_120000.sql.gz

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <backup_file.sql.gz>"
  echo "   Available backups:"
  ls -lh ./database/backups/smartqueue_backup_*.sql.gz 2>/dev/null || echo "   No backups found"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the current database!"
read -p "Are you sure you want to continue? (y/N): " confirmation

if [ "$confirmation" != "y" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# Load environment
if [ -f .env ]; then
  source .env
fi

DB_URL="${DATABASE_URL:-postgresql://smartqueue_user:SmartQueue@2024!@localhost:5432/smartqueue_db}"

echo "🔄 Starting database restore from: $BACKUP_FILE"

if [[ "$DB_URL" == *"sqlite"* ]]; then
  # For SQLite, decompress and copy
  DB_PATH=$(echo "$DB_URL" | sed 's/^.*\///')
  gunzip -k -f "$BACKUP_FILE" 2>/dev/null
  SQL_FILE="${BACKUP_FILE%.gz}"
  
  if [ -f "$SQL_FILE" ]; then
    sqlite3 "$DB_PATH" < "$SQL_FILE"
    echo "✅ SQLite database restored from $SQL_FILE"
  else
    # It might be a .db file backup
    cp "$BACKUP_FILE" "$DB_PATH"
    echo "✅ SQLite database restored from $BACKUP_FILE"
  fi
else
  # PostgreSQL restore
  gunzip -k -f "$BACKUP_FILE" 2>/dev/null || true
  SQL_FILE="${BACKUP_FILE%.gz}"

  if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Decompressed SQL file not found"
    exit 1
  fi

  # Terminate existing connections and restore
  psql "$DB_URL" -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'smartqueue_db' AND pid <> pg_backend_pid();" 2>/dev/null || true

  psql "$DB_URL" < "$SQL_FILE"

  echo "✅ PostgreSQL database restored from $SQL_FILE"
fi

echo "✅ Restore completed successfully"

