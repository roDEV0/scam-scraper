from transformers import pipeline
from huggingface_hub import snapshot_download
import os

MODEL_NAME = "Horizon-Labs/phishing-scam-detector-base"
MODEL_PATH = "./models/phishing-scam-detector"

# Download the model if it doesn't exist locally
if not os.path.exists(MODEL_PATH):
    print("Model not found locally. Downloading...")
    snapshot_download(
        repo_id=MODEL_NAME,
        local_dir=MODEL_PATH
    )

print("Loading phishing detection model...")

pipe = pipeline(
    "text-classification",
    model=MODEL_PATH,
    tokenizer=MODEL_PATH,
    device_map="auto",
    local_files_only=True
)

print("Model loaded!")

def predict(text: str):
    return pipe(text)