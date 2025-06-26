#!/usr/bin/env python3
"""
Cleanup script to remove legacy files and directories
"""

import os
import shutil
from pathlib import Path

def cleanup_legacy_files():
    """Remove legacy files and directories"""
    print("🧹 Cleaning up legacy files...")
    
    # Files to remove
    legacy_files = [
        "app.py.backup",
        "chanakya.db.backup",
        "test_google_auth.log",
        "sqlalchemy.log",
        "check_alembic_version.py",
        "check_db_state.py",
        "check_db.py",
        "check_indexes.py",
        "check_schema.py",
        "create_tables.py",
        "create_test_user.py",
        "init_db.py",
        "recreate_db.py",
        "run_migration.py",
        "run_migration.sh",
        "setup.py",
        "test_imports.py",
        "update_goals_schema.py",
        "update_tables.py",
        "test_goals_endpoint.py",
        "test_goals.html",
        "test_goals.py",
        "test_google_auth.py",
        "server.js",
        "config.py",  # Old config file
    ]
    
    # Directories to remove
    legacy_dirs = [
        "db",  # Old db directory
        "migrations",  # Old migrations
        "routes",  # Old routes
        "schemas",  # Old schemas
        "services",  # Old services
        "utils",  # Old utils
        "src",  # Old src
        "chanakya_chain",  # Old chain
    ]
    
    # Remove legacy files
    for file_path in legacy_files:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"✅ Removed: {file_path}")
            except Exception as e:
                print(f"❌ Failed to remove {file_path}: {e}")
    
    # Remove legacy directories
    for dir_path in legacy_dirs:
        if os.path.exists(dir_path):
            try:
                shutil.rmtree(dir_path)
                print(f"✅ Removed directory: {dir_path}")
            except Exception as e:
                print(f"❌ Failed to remove directory {dir_path}: {e}")
    
    print("🎉 Legacy cleanup completed!")

if __name__ == "__main__":
    cleanup_legacy_files() 