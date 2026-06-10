import anthropic
import json
from config import settings

if settings.ANTHROPIC_API_KEY:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
else:
    client = anthropic.Anthropic()

def get_insights(prompt: str) -> dict:
    try:
        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text
        result = json.loads(text)
        print(f"LLM Response: {result}")
        return result
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}, Response: {text}")
        return {"error": f"Failed to parse JSON response: {str(e)}"}
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}