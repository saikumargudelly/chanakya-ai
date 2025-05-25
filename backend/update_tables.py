from sqlalchemy import text
from db.session import engine

def update_tables():
    with engine.connect() as connection:
        # Add is_active column if it doesn't exist
        connection.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
        """))
        
        # Add created_at column if it doesn't exist
        connection.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
        """))
        
        # Add updated_at column if it doesn't exist
        connection.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
        """))
        
        # Create a trigger to update updated_at on row update
        connection.execute(text("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        connection.execute(text("""
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """))
        
        connection.commit()
        print("Database tables updated successfully!")

if __name__ == "__main__":
    print("Updating database tables...")
    update_tables()
