import sys
import os

print("Python Path:")
for path in sys.path:
    print(f"- {path}")

print("\nCurrent working directory:", os.getcwd())
print("Backend directory exists:", os.path.exists(os.path.join(os.getcwd(), 'backend')))
print("Routes directory exists:", os.path.exists(os.path.join(os.getcwd(), 'routes')))
