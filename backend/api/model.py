
from transformers import pipeline

print("Loading model...")

pipe = pipeline(
    "text-classification",
    model="./models/phishing-scam-detector",
    tokenizer="./models/phishing-scam-detector",
    device_map="auto",
    local_files_only=True
)

print("Model loaded!")

def predict(text: str) -> list[dict]:
    return pipe(text)
