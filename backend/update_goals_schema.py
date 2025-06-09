import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Get database URL from environment or use default SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///chanakya.db")

def update_goals_schema():
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        # Start a transaction
        with connection.begin():
            print("Checking if deadline_months column exists...")
            
            # Check if the column already exists
            if 'postgresql' in DATABASE_URL:
                # PostgreSQL specific check
                result = connection.execute(text(
                    """
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='goals' AND column_name='deadline_months';
                    """
                ))
                column_exists = result.fetchone() is not None
            else:
                # SQLite specific check
                result = connection.execute(text(
                    "PRAGMA table_info(goals);"
                ))
                columns = [row[1] for row in result.fetchall()]
                column_exists = 'deadline_months' in columns
            
            if not column_exists:
                print("Adding deadline_months column to goals table...")
                # Add the new column
                if 'postgresql' in DATABASE_URL:
                    connection.execute(text(
                        "ALTER TABLE goals ADD COLUMN deadline_months INTEGER;"
                    ))
                    # Make target_date nullable
                    connection.execute(text(
                        "ALTER TABLE goals ALTER COLUMN target_date DROP NOT NULL;"
                    ))
                    # Set default value for current_amount if not set
                    connection.execute(text(
                        "UPDATE goals SET current_amount = 0.0 WHERE current_amount IS NULL;"
                    ))
                    connection.execute(text(
                        "ALTER TABLE goals ALTER COLUMN current_amount SET DEFAULT 0.0;"
                    ))
                else:
                    # SQLite doesn't support ALTER TABLE ADD COLUMN with constraints well,
                    # so we'll need to create a new table and copy the data
                    connection.execute(text(
                        """
                        CREATE TABLE new_goals (
                            id INTEGER PRIMARY KEY,
                            user_id INTEGER,
                            name TEXT,
                            target_amount FLOAT,
                            current_amount FLOAT DEFAULT 0.0,
                            target_date TIMESTAMP,
                            deadline_months INTEGER,
                            created_at TIMESTAMP,
                            updated_at TIMESTAMP,
                            FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
                        );
                        """
                    ))
                    
                    # Copy data from old table to new table
                    connection.execute(text(
                        """
                        INSERT INTO new_goals (
                            id, user_id, name, target_amount, current_amount, 
                            target_date, created_at, updated_at, deadline_months
                        )
                        SELECT 
                            id, user_id, name, target_amount, 
                            COALESCE(current_amount, 0.0) as current_amount,
                            target_date, created_at, updated_at, 
                            12 as deadline_months  -- Default to 12 months for existing goals
                        FROM goals;
                        """
                    ))
                    
                    # Drop the old table and rename the new one
                    connection.execute(text("DROP TABLE goals;"))
                    connection.execute(text("ALTER TABLE new_goals RENAME TO goals;"))
                    
                    # Recreate indexes if any
                    if 'postgresql' not in DATABASE_URL:  # SQLite
                        connection.execute(text(
                            "CREATE INDEX IF NOT EXISTS ix_goals_user_id ON goals (user_id);"
                        ))
                
                print("Schema update completed successfully!")
            else:
                print("deadline_months column already exists. No changes needed.")

if __name__ == "__main__":
    update_goals_schema()
