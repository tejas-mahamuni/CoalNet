# CoalNet Zero — Carbon Decision Intelligence Platform

<div align="center">

![CoalNet Zero](https://img.shields.io/badge/CoalNet-Zero-22c55e?style=for-the-badge&logo=leaf&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-Flask-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**An AI-driven carbon emission intelligence platform for Indian coal mines.**  
Track emissions · Forecast with ARIMA · Simulate reduction pathways · Generate compliance reports.

[Live Demo](#) · [Report Bug](https://github.com/tejas-mahamuni/CoalNet/issues) · [GitHub](https://github.com/tejas-mahamuni/CoalNet)

</div>

---

## 📸 Platform Overview

CoalNet Zero transforms raw operational data from coal mines into actionable carbon intelligence — guiding users from **Data → Analysis → Prediction → Optimization → Decision**.

| Page | Description |
|------|-------------|
| 🏠 **Home** | Landing page with animated India map, live emission ticker, and feature showcase |
| 📊 **Dashboard** | Real-time analytics with waterfall, heatmap, AQI, and multi-chart views |
| 📥 **Input** | Unified data entry (Manual + CSV Upload) with analytics and insight panel |
| 🔮 **Forecast** | ARIMA-based 7/14/30-day emission forecasting with multi-mine comparison |
| 🛤️ **Pathways** | Reduction pathway simulator with lifecycle charts and recommendations |
| 👤 **Profile** | Personal control center — stats, mine management, alerts, AI insights |

---

## ✨ Features

### 📥 Data Intelligence (Input Page)
- Manual entry form with live emission preview and scope breakdown
- CSV bulk upload with validation and error reporting
- Historical records table with sort, filter, and export
- Analytics dashboard — emission timeline, source contribution chart
- Auto-generated insight panel (spike detection, stability trends, pathway hints)

### 📊 Dashboard
- Animated summary cards with counter animations
- Waterfall chart, regional heatmap, AQI report, mine comparison
- Time-range filtering with Daily / Weekly / Monthly toggle
- Top emitter rankings and Scope 1/2/3 breakdowns

### 🔮 Forecast Intelligence
- ARIMA model (via Python ML service) with configurable horizon (7–30 days)
- Confidence band visualization (upper/lower bounds)
- Multi-mine forecast comparison with trend differentials
- Carbon Budget Gauge — estimated breach date + risk level
- AI-generated insights (peak week, acceleration trend, stable periods)
- **PDF Report Download** — full forecast report with charts

### 🛤️ Optimization Pathways
- Mine Digital Profile — current emission/day, trend, reduction potential
- Simulation modes: **Historical**, **Future**, **Combined** lifecycle view
- 4 interactive sliders: EV Fleet, Renewable Energy, Methane Capture, Efficiency
- 4 pathway presets: Conservative → Balanced → Aggressive → Net Zero 2030
- Real-time dual-line chart (baseline vs. simulated)
- Recommendation engine ranked by priority (high / medium / low)
- Decarbonization narrative timeline — auto-updates with slider values
- Scenario playback animation

### 👤 Profile Control Center
- User overview card with avatar glow, role badge, last login
- Activity summary — records entered, mines monitored, total emission analyzed
- My Mines panel — pin favorites ⭐, quick-navigate to Forecast & Pathways
- AI Insights — rule-based analysis of top emission sources and trends
- Alert Center — spike warnings, high-emission mine flags, budget alerts
- Preferences — default mine, forecast horizon, unit, dark mode (localStorage persisted)
- Activity timeline (scrollable)
- Impact section — total analyzed, reduction identified, carbon saved
- Security — Google sign-in status, last device, logout

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite, TypeScript, Tailwind CSS (Glassmorphism) |
| **UI Components** | Shadcn/UI, Lucide React, Framer Motion |
| **Charts** | Recharts (ComposedChart, AreaChart, BarChart, custom SVG) |
| **Auth** | Firebase Authentication (Email + Google Sign-In) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas via Mongoose ODM |
| **ML Service** | Python 3.10+, Flask, Statsmodels (ARIMA), Pandas, NumPy |
| **PDF Reports** | jsPDF + html2canvas |

---

## 📁 Project Structure

```
CoalNet/
├── frontend/               # React + Vite app
│   └── src/
│       ├── pages/          # InputPage, DashboardPage, VisualizationPage, PathwaysPage, UserPage
│       ├── components/
│       │   ├── forecast/   # SimulatorRow, CarbonBudgetRiskRow, MineSummaryRow, etc.
│       │   ├── ui/         # Shadcn components
│       │   └── Navbar, Footer, AuthForm, etc.
│       ├── contexts/       # AuthContext (Firebase)
│       ├── hooks/          # useAuth, useToast, useCountUp
│       └── lib/            # api.ts (Axios service layer)
│
├── backend/                # Express REST API
│   ├── models/             # Emission, Mine, Forecast, User (Mongoose)
│   └── routes/             # emissions, forecast, dashboard, insights, aqi, report, comparison, mines
│
└── ml-service/             # Python Flask ARIMA service
    ├── app/
    │   ├── models/         # arima_model.py
    │   └── routes/         # forecast, insights
    └── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- Firebase project (for auth)

### 1. Clone the repo

```bash
git clone https://github.com/tejas-mahamuni/CoalNet.git
cd CoalNet
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```env
MONGODB_URI=your_mongodb_atlas_uri
PORT=3001
```

```bash
npm start
# Server runs on http://localhost:3001
```

### 3. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
python -m app.main
# ML service runs on http://localhost:5001
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` in `frontend/`:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mines` | List all mines |
| `POST` | `/api/emissions` | Add emission record |
| `GET` | `/api/emissions/:mineId` | Get mine emissions |
| `GET` | `/api/export/:mineId` | Export emissions as CSV |
| `POST` | `/api/upload` | Bulk CSV upload |
| `POST` | `/api/forecast/:mineId` | Generate ARIMA forecast |
| `GET` | `/api/forecast/:mineId` | Get cached forecast |
| `GET` | `/api/forecast/insights/:mineId` | AI forecast insights |
| `POST` | `/api/forecast/compare` | Multi-mine comparison |
| `GET` | `/api/forecast/report/:mineId` | Report data for PDF |
| `GET` | `/api/dashboard` | Dashboard aggregations |
| `GET` | `/api/aqi/:mineId` | AQI data |
| `GET` | `/api/home-stats` | Home page statistics |

---

## 🌱 Emission Calculation

Emissions are calculated using **IPCC-aligned emission factors**:

| Source | Factor |
|--------|--------|
| Diesel / Fuel | 2.68 kg CO₂e / litre |
| Grid Electricity | 0.82 kg CO₂e / kWh |
| Explosives | 0.316 kg CO₂e / kg |
| Transport Fuel | 2.68 kg CO₂e / litre |
| Methane (CH₄) | 28× GWP → kg CO₂e |

Emissions are classified into **Scope 1** (direct), **Scope 2** (electricity), and **Scope 3** (transport/explosives).

---

## 🤖 ML Forecasting

The Python service implements an **ARIMA** (AutoRegressive Integrated Moving Average) model:

- Minimum 30 data points required
- Auto-selects optimal `(p, d, q)` parameters
- Returns `predicted`, `upper_bound`, `lower_bound` per day
- Forecasts cached in MongoDB for 24 hours
- Falls back to cached data if ML service is unavailable

---

## 🇮🇳 Strategic Alignment

CoalNet Zero supports:
- 🌍 **India's Net Zero 2070 Commitment**
- 📋 **SDG 13: Climate Action**
- 💻 **Digital India Initiative**
- 🏭 **MoEFCC Emission Compliance Frameworks**

---

## 👤 Author

**Tejas Mahamuni**

[![GitHub](https://img.shields.io/badge/GitHub-tejas--mahamuni-181717?style=flat&logo=github)](https://github.com/tejas-mahamuni)
[![Instagram](https://img.shields.io/badge/Instagram-smudge__7__-E4405F?style=flat&logo=instagram&logoColor=white)](https://www.instagram.com/smudge_7_)
[![Twitter](https://img.shields.io/badge/X-iTejas__07-000000?style=flat&logo=x)](https://x.com/iTejas_07)
[![Email](https://img.shields.io/badge/Email-tejasmahamuni16@gmail.com-D14836?style=flat&logo=gmail&logoColor=white)](mailto:tejasmahamuni16@gmail.com)

---

## 📄 License

This project is for educational and research purposes.  
Built with ❤️ for a sustainable future in Indian coal mining. 🌱⛏️
