import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

def generate_normal_data(n_samples=1000):
    # Generates standard normal network traffic metrics
    # trafficVolume (Gbps): 1.0 to 8.0
    traffic_volume = np.random.uniform(1.0, 8.0, n_samples)
    # requestRate (req/sec): 50 to 300
    request_rate = np.random.uniform(50, 300, n_samples)
    # tcp_syn_ratio: 0.01 to 0.1
    tcp_syn_ratio = np.random.uniform(0.01, 0.1, n_samples)
    # udp_ratio: 0.01 to 0.1
    udp_ratio = np.random.uniform(0.01, 0.1, n_samples)
    # http_ratio: 0.3 to 0.7
    http_ratio = np.random.uniform(0.3, 0.7, n_samples)
    # ip_entropy: 3.5 to 4.5
    ip_entropy = np.random.uniform(3.5, 4.5, n_samples)
    
    df = pd.DataFrame({
        'trafficVolume': traffic_volume,
        'requestRate': request_rate,
        'tcp_syn_ratio': tcp_syn_ratio,
        'udp_ratio': udp_ratio,
        'http_ratio': http_ratio,
        'ip_entropy': ip_entropy
    })
    return df

def generate_anomalous_data(n_samples=100):
    # Generates volumetric, protocol, or application DDoS metrics
    anomalies = []
    
    # 1. Volumetric attack (high volume, high request rate)
    for _ in range(n_samples // 3):
        anomalies.append({
            'trafficVolume': np.random.uniform(80.0, 250.0),
            'requestRate': np.random.uniform(4000.0, 15000.0),
            'tcp_syn_ratio': np.random.uniform(0.01, 0.2),
            'udp_ratio': np.random.uniform(0.01, 0.2),
            'http_ratio': np.random.uniform(0.3, 0.7),
            'ip_entropy': np.random.uniform(1.0, 2.5) # lower entropy
        })
    # 2. Protocol attack (high TCP SYN ratio or UDP ratio)
    for _ in range(n_samples // 3):
        is_syn = np.random.choice([True, False])
        anomalies.append({
            'trafficVolume': np.random.uniform(15.0, 60.0),
            'requestRate': np.random.uniform(1000.0, 4000.0),
            'tcp_syn_ratio': np.random.uniform(0.75, 0.99) if is_syn else np.random.uniform(0.01, 0.1),
            'udp_ratio': np.random.uniform(0.01, 0.1) if is_syn else np.random.uniform(0.75, 0.99),
            'http_ratio': np.random.uniform(0.01, 0.2),
            'ip_entropy': np.random.uniform(2.0, 3.5)
        })
    # 3. Application layer attack (targeted HTTP volume spikes)
    for _ in range(n_samples - (2 * (n_samples // 3))):
        anomalies.append({
            'trafficVolume': np.random.uniform(5.0, 25.0),
            'requestRate': np.random.uniform(800.0, 2500.0),
            'tcp_syn_ratio': np.random.uniform(0.01, 0.1),
            'udp_ratio': np.random.uniform(0.01, 0.1),
            'http_ratio': np.random.uniform(0.85, 0.99),
            'ip_entropy': np.random.uniform(1.5, 3.0)
        })
        
    return pd.DataFrame(anomalies)

def train_model():
    print("Generating training data...")
    df_normal = generate_normal_data(1200)
    df_anomalous = generate_anomalous_data(150)
    
    # Train IsolationForest on normal data (semi-supervised)
    print("Training Isolation Forest model...")
    model = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
    model.fit(df_normal)
    
    # Verify predictions: 1 is normal, -1 is anomalous
    preds_normal = model.predict(df_normal)
    preds_anomalous = model.predict(df_anomalous)
    
    normal_accuracy = np.sum(preds_normal == 1) / len(df_normal)
    anomaly_detection_rate = np.sum(preds_anomalous == -1) / len(df_anomalous)
    
    print(f"Normal accuracy (should be high, ~98%): {normal_accuracy * 100:.2f}%")
    print(f"Anomaly detection rate (should be high, ~100%): {anomaly_detection_rate * 100:.2f}%")
    
    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    joblib.dump(model, model_path)
    print(f"Model saved successfully to {model_path}")

if __name__ == "__main__":
    train_model()
