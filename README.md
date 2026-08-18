# SentinelFlow

SentinelFlow is a premium, state-of-the-art DDoS Detection and Mitigation Platform. Built with a technical blueprint/drafting-board aesthetic, it features real-time network traffic telemetry, custom alert rules creation, automated incident playbooks, multi-tenant organization workspaces, and a machine learning anomaly detection engine powered by scikit-learn's Isolation Forest algorithm.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Lakshyagupta23/Sentinelflow-DDOS)

---

## Key Features

- **Real-Time Traffic Telemetry:** Visual dashboard displaying network volume, request rates, protocol distributions (TCP, UDP, HTTP), and IP entropy with live charts.
- **AI Anomaly Detection Daemon:** An integrated machine learning engine running an Isolation Forest algorithm to classify normal traffic vs volumetric, protocol, or application layer anomalies.
- **Custom Rules Builder:** A control board to define specific threat criteria (e.g. rate thresholds, severity) and raise alerts.
- **Incident Response Playbooks:** Interactive mitigation tools allowing operators to construct and deploy automated response chains (block IPs, throttle traffic, rate limit).
- **Workspace Organizations:** Fully integrated multi-tenant management allowing users to delegate teams, inspect webhooks, and manage system roles.
- **Technical Drafting Board UI**: A bespoke, monochromatic blueprint UI styled in Charcoal Slate and Antique Brass/Gold with fully resizable sidebars and dark/light theme switching.

---

## Repository Structure

```
.
├── client/              # React 19 + Tailwind CSS + Vite Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI & Layouts (DashboardLayout, ThreeDExplodedNodes)
│   │   ├── hooks/       # Custom React hooks (useRealtimeUpdates)
│   │   └── pages/       # Interactive platform subpages
├── server/              # Express + tRPC 11 Backend API
│   ├── _core/           # System core configuration (Auth, LLM, Maps proxies)
│   ├── routers.ts       # tRPC endpoint routing declarations
│   └── db.ts            # Database query layers
├── ml-service/          # Python 3.11+ Machine Learning Anomaly Detection Service
│   ├── train_model.py   # Baseline model generation scripts
│   ├── ml_service.py    # FastAPI service endpoint exposing predictions
│   └── requirements.txt # Python package requirements
├── drizzle/             # Database schema migrations & config
└── README.md
```

---

## Local Development

### Prerequisites

- **Node.js** v20+
- **Python** v3.11+
- **MySQL / TiDB** Database
- **pnpm** (or npm/yarn)

---

### Local Setup & Startup

#### 1. Configuration Envs
Copy the environment template and configure your connection secrets:
```bash
cp .env.example .env
```

#### 2. Install Dependencies
Run package installation at the root directory:
```bash
pnpm install
```

#### 3. Database Sync
Generate schema structures and migrate your database:
```bash
pnpm db:push
```

#### 4. Run Services

You can run the full Express + Vite developer server and the Python ML Service concurrently:

##### Run Frontend & Backend (Root)
```bash
# Starts Express server (port 3000) & Vite frontend proxy concurrently
pnpm dev
```
Runs at [http://localhost:3000](http://localhost:3000).

##### Run ML Anomaly Detection Service
```bash
cd ml-service
python -m venv .venv

# Windows
.venv\Scripts\activate

# Unix/macOS
source .venv/bin/activate

pip install -r requirements.txt
python ml_service.py
```
Runs at [http://localhost:5000](http://localhost:5000).

---

## Deployment & Production Build

To compile high-performance production bundles:

```bash
pnpm build
```

This compiles client-side assets under `dist/public` and bundles the Express application into `dist/index.js`.

To launch the production server:

```bash
pnpm start
```
