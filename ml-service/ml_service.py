import os
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Import training utility to train baseline model if missing
from train_model import train_model

app = FastAPI(title="Sentinel AI - Anomaly Detection Engine")

class TrafficFeatures(BaseModel):
    trafficVolume: float
    requestRate: float
    tcp_syn_ratio: float
    udp_ratio: float
    http_ratio: float
    ip_entropy: float

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
model = None

def load_or_train_model():
    global model
    if not os.path.exists(MODEL_PATH):
        print("Model file not found. Running training script to generate baseline...")
        try:
            train_model()
        except Exception as e:
            print(f"Error training baseline model: {e}")
            return False
            
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            print("ML Model loaded successfully.")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    return False

# Initial model load
load_or_train_model()

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict")
def predict(features: TrafficFeatures):
    global model
    if model is None:
        # Try loading model again
        success = load_or_train_model()
        if not success or model is None:
            raise HTTPException(status_code=503, detail="Anomaly detection model is not loaded.")
            
    try:
        # Convert input Pydantic model to Pandas DataFrame
        data = pd.DataFrame([features.model_dump()])
        
        # IsolationForest predict returns 1 (normal) or -1 (anomaly)
        prediction = model.predict(data)[0]
        
        # decision_function returns raw anomaly score
        # Negative values are anomalies, positive are normal.
        decision_val = model.decision_function(data)[0]
        
        # Map decision value to anomaly score between 0.0 and 1.0
        # If decision value <= 0 (outlier), score is >= 0.5.
        # Simple logistic mapping or linear mapping:
        anomaly_score = float(1.0 / (1.0 + np.exp(decision_val * 10)))
        
        is_anomaly = bool(prediction == -1)
        
        return {
            "anomaly": is_anomaly,
            "score": round(anomaly_score, 4),
            "details": {
                "classification": "anomaly" if is_anomaly else "normal",
                "decision_value": round(float(decision_val), 4)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/train")
def train():
    try:
        print("Retraining model...")
        train_model()
        success = load_or_train_model()
        if not success:
            raise Exception("Failed to reload model after training.")
        return {"status": "success", "message": "Model retrained and loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
