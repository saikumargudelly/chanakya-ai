from alembic.config import Config
from alembic import command
import os

def run_migrations():
    # Get the directory this script is in
    script_location = os.path.dirname(os.path.abspath(__file__))
    
    # Set the path to the alembic.ini file and the migrations directory
    config = Config(os.path.join(script_location, 'alembic.ini'))
    config.set_main_option('script_location', os.path.join(script_location, 'migrations'))
    config.set_main_option('sqlalchemy.url', 'sqlite:///instance/chanakya.db')
    
    # Run the migration
    print("Running database migrations...")
    command.upgrade(config, 'head')
    print("Migrations completed successfully!")

if __name__ == '__main__':
    run_migrations()
