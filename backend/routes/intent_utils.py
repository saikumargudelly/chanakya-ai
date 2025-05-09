import re

# --- Centralized, extensible intent registry for context detection and response policy ---
INTENT_REGISTRY = [
    {
        "name": "greeting",
        "keywords": ["hi", "hello", "hey", "hola", "namaste", "good morning", "good evening", "good afternoon", "yo", "sup"],
        "phrases": ["how are you", "what's up", "how's it going"],
        "max_sentences": 1,
        "tone": "warm"
    },
    {
        "name": "wellness",
        "keywords": [
            "stress", "motivation", "mood", "sad", "depressed", "anxious", "anxiety", "tired", "feeling low", "burnout", "mental", "happy", "unhappy", "overwhelmed", "panic", "worry", "worried", "emotion", "energy", "exhausted", "lonely", "alone", "down", "blue", "hopeless", "frustrated", "angry", "irritable", "calm", "relaxed", "peaceful", "joy", "excited", "bored", "restless"
        ],
        "max_sentences": 2,
        "tone": "empathetic"
    },
    {
        "name": "finance",
        "keywords": [
            "money", "budget", "expense", "income", "savings", "investment", "finance", "financial", "spending", "debt", "loan", "bank", "salary", "cost", "save", "spend", "emi", "credit card", "mutual fund", "stock", "portfolio", "goal", "wealth", "asset", "liability", "insurance", "tax", "interest", "bill", "payment", "pocket money", "allowance", "fees", "rent", "cash flow", "profit", "loss"
        ],
        "max_sentences": 3,
        "tone": "practical"
    },
    {
        "name": "general_advice",
        "keywords": ["help", "advice", "suggest", "recommend", "tip", "guide"],
        "max_sentences": 3,
        "tone": "informative"
    },
    {
        "name": "other",
        "keywords": [],
        "max_sentences": 4,
        "tone": "neutral"
    }
]

def detect_intent(text):
    text = text.lower().strip()
    for intent in INTENT_REGISTRY:
        for phrase in intent.get("phrases", []):
            if phrase in text:
                return intent["name"]
        for word in intent.get("keywords", []):
            if word in text:
                return intent["name"]
    return "other"

def trim_response_by_intent(response, intent):
    max_sentences = next((i["max_sentences"] for i in INTENT_REGISTRY if i["name"] == intent), 4)
    sentences = re.split(r'(?<=[.!?])\s+|\n+', response.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    trimmed = " ".join(sentences[:max_sentences]) if sentences else response.strip()
    words = trimmed.split()
    if len(words) > 30:
        trimmed = " ".join(words[:30]) + ("..." if not trimmed.endswith('.') else "")
    if len(trimmed) > 200:
        trimmed = trimmed[:200].rsplit(' ', 1)[0] + "..."
    return trimmed
