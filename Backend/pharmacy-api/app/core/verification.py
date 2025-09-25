import random
import string
import json
import os
from datetime import datetime, timedelta, date
from typing import Dict, Tuple

# File to store verification data
VERIFICATION_FILE = "verification_data.json"

def load_verification_data() -> Tuple[Dict[str, Tuple[str, datetime]], Dict[str, Tuple[dict, datetime]]]:
    """Load verification data from file."""
    if not os.path.exists(VERIFICATION_FILE):
        return {}, {}
    
    try:
        with open(VERIFICATION_FILE, 'r') as f:
            data = json.load(f)
            # Convert string timestamps back to datetime objects
            verification_codes = {
                email: (code, datetime.fromisoformat(exp))
                for email, (code, exp) in data.get('verification_codes', {}).items()
            }
            pending_registrations = {
                email: (user_data, datetime.fromisoformat(exp))
                for email, (user_data, exp) in data.get('pending_registrations', {}).items()
            }
            return verification_codes, pending_registrations
    except Exception as e:
        print(f"Error loading verification data: {e}")
        return {}, {}

def save_verification_data(verification_codes: Dict[str, Tuple[str, datetime]], 
                         pending_registrations: Dict[str, Tuple[dict, datetime]]) -> None:
    """Save verification data to file."""
    try:
        # Convert datetime objects to ISO format strings and handle date objects
        data = {
            'verification_codes': {
                email: (code, exp.isoformat())
                for email, (code, exp) in verification_codes.items()
            },
            'pending_registrations': {
                email: (convert_dates_to_strings(user_data), exp.isoformat())
                for email, (user_data, exp) in pending_registrations.items()
            }
        }
        with open(VERIFICATION_FILE, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Error saving verification data: {e}")

def convert_dates_to_strings(obj):
    """Convert date objects to ISO format strings in a dictionary."""
    if isinstance(obj, dict):
        return {k: convert_dates_to_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_dates_to_strings(item) for item in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj

def generate_verification_code(length: int = 6) -> str:
    """Generate a random verification code."""
    return ''.join(random.choices(string.digits, k=length))

def store_verification_code(email: str, code: str, user_data: dict = None) -> None:
    """Store a verification code and optional user data."""
    from app.api.v1.endpoints.auth import verification_codes, pending_registrations
    
    expiration = datetime.utcnow() + timedelta(hours=24)
    verification_codes[email] = (code, expiration)
    
    if user_data:
        pending_registrations[email] = (user_data, expiration)
    
    save_verification_data(verification_codes, pending_registrations)

def verify_code(email: str, code: str) -> bool:
    """Verify a code for a given email."""
    from app.api.v1.endpoints.auth import verification_codes, pending_registrations
    
    if email not in verification_codes:
        return False
    
    stored_code, expiration = verification_codes[email]
    
    # Check if code has expired
    if datetime.utcnow() > expiration:
        del verification_codes[email]
        if email in pending_registrations:
            del pending_registrations[email]
        save_verification_data(verification_codes, pending_registrations)
        return False
    
    # Check if code matches
    if code != stored_code:
        return False
    
    return True 