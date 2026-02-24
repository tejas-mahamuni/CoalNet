# CoalNet Zero — ML Service

Python Flask microservice providing ARIMA-based emission forecasting for CoalNet Zero.

## Setup

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

## Run

```bash
python -m app.main
```

Service starts on **http://localhost:5001**.

## Endpoints

| Method | Path           | Description                     |
|--------|----------------|---------------------------------|
| GET    | `/health`      | Health check                    |
| POST   | `/api/forecast`| Generate ARIMA forecast         |

### POST /api/forecast

**Request:**
```json
{
  "emissions": [
    {"date": "2025-01-01", "total_carbon_emission": 1234.5},
    ...
  ],
  "horizon": 7
}
```

**Response:**
```json
{
  "success": true,
  "forecast_data": [
    {"date": "2025-04-01", "predicted": 1200.0, "upper_bound": 1350.0, "lower_bound": 1050.0}
  ],
  "model_accuracy": {"mae": 45.2, "rmse": 62.1},
  "model_params": {"order": [1, 1, 1], "aic": 1234.56},
  "data_points_used": 90
}
```

## Tests

```bash
python -m pytest tests/ -v
```
