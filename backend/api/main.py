from fastapi import FastAPI
from pydantic import BaseModel
from model import predict

app = FastAPI()

class ModelRequest(BaseModel):
    user: str
    request: str

class Prediction(BaseModel):
    label: str
    score: float

class ModelResponse(BaseModel):
    user: str
    status: str
    response: list[Prediction]

@app.get("/")
async def root():
    return {
        "message": "Use the /request endpoint to query the model"
    }

@app.post("/request", response_model=ModelResponse)
def request(query: ModelRequest):
    response = predict(query.request)

    return {
        "user": query.user,
        "status": "OK" if response else "FAILED",
        "response": response
    }

def get_response(message: str):
    return predict(message)
