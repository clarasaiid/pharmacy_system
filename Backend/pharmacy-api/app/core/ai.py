from typing import Dict
import openai
from app.core.config import settings

async def classify_medicine(medicine_name: str) -> Dict:
    """
    Use OpenAI to classify a medicine based on its name.
    Returns a dictionary with classification results.
    """
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a medical expert. Analyze the medicine name and provide classification details."},
                {"role": "user", "content": f"Analyze this medicine: {medicine_name}. Provide: 1) Category 2) Active Ingredient 3) Effects"}
            ],
            temperature=0.3,
            max_tokens=150
        )
        
        # Parse the response
        content = response.choices[0].message.content
        
        # Extract information
        lines = content.split('\n')
        classification = {
            "category": "",
            "active_ingredient": "",
            "effects": ""
        }
        
        for line in lines:
            if "Category:" in line:
                classification["category"] = line.split("Category:")[1].strip()
            elif "Active Ingredient:" in line:
                classification["active_ingredient"] = line.split("Active Ingredient:")[1].strip()
            elif "Effects:" in line:
                classification["effects"] = line.split("Effects:")[1].strip()
        
        return classification
    
    except Exception as e:
        print(f"Error in AI classification: {str(e)}")
        return {
            "category": "Unknown",
            "active_ingredient": "Unknown",
            "effects": "Unknown"
        } 