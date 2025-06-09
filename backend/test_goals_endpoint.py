import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the base URL from environment or use default
BASE_URL = os.getenv("BASE_URL", "http://localhost:5001")
TOKEN = "your_jwt_token_here"  # Replace with a valid token from your frontend

def test_goals_endpoints():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Test creating a new goal
    print("Testing goal creation...")
    goal_data = {
        "goalName": "New Car Fund",
        "targetAmount": 10000.0,
        "deadlineMonths": 12,
        "savedAmount": 1000.0
    }
    
    try:
        # Create a new goal
        response = requests.post(
            f"{BASE_URL}/api/goals/",
            json=goal_data,
            headers=headers
        )
        print(f"Create Goal Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2) if response.text else 'No response body'}")
        
        if response.status_code == 200:
            goal_id = response.json().get('id')
            print(f"\nCreated goal with ID: {goal_id}")
            
            # Test getting all goals
            print("\nTesting getting all goals...")
            response = requests.get(
                f"{BASE_URL}/api/goals/",
                headers=headers
            )
            print(f"Get Goals Status Code: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2) if response.text else 'No response body'}")
            
            if goal_id:
                # Test updating the goal
                print(f"\nTesting updating goal {goal_id}...")
                update_data = {
                    "goalName": "Updated Car Fund",
                    "targetAmount": 15000.0,
                    "deadlineMonths": 18,
                    "savedAmount": 2000.0
                }
                response = requests.put(
                    f"{BASE_URL}/api/goals/{goal_id}",
                    json=update_data,
                    headers=headers
                )
                print(f"Update Goal Status Code: {response.status_code}")
                print(f"Response: {json.dumps(response.json(), indent=2) if response.text else 'No response body'}")
                
                # Test getting the updated goal
                print(f"\nTesting getting updated goal {goal_id}...")
                response = requests.get(
                    f"{BASE_URL}/api/goals/",
                    headers=headers
                )
                print(f"Get Updated Goal Status Code: {response.status_code}")
                print(f"Response: {json.dumps(response.json(), indent=2) if response.text else 'No response body'}")
                
                # Test deleting the goal
                print(f"\nTesting deleting goal {goal_id}...")
                response = requests.delete(
                    f"{BASE_URL}/api/goals/{goal_id}",
                    headers=headers
                )
                print(f"Delete Goal Status Code: {response.status_code}")
                print(f"Response: {json.dumps(response.json(), indent=2) if response.text else 'No response body'}")
                
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_goals_endpoints()
