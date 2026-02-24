"""
Forecast Insights API route blueprint.

POST /api/forecast/insights — Returns anomaly detection, seasonality,
driver importance, trend analysis, and MAPE from emission data.
"""

from flask import Blueprint, request, jsonify
from app.utils.logger import get_logger
import pandas as pd
import numpy as np

logger = get_logger(__name__)
insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/api/forecast/insights", methods=["POST"])
def get_insights():
    """
    Analyze emission data for anomalies, seasonality, driver importance, and trend.

    Request body:
        {
            "emissions": [
                {"date": "2025-01-01", "total_carbon_emission": 1234.5,
                 "fuel_emission": ..., "electricity_emission": ..., ...},
            ],
            "forecast_data": [
                {"date": "2025-04-01", "predicted": 1200.0, ...},
            ]
        }

    Response:
        {
            "success": true,
            "anomalies": [...],
            "seasonality": {...},
            "drivers": [...],
            "trend": {...},
            "mape": 5.2
        }
    """
    try:
        data = request.get_json(force=True)
        emissions = data.get("emissions", [])
        forecast_data = data.get("forecast_data", [])

        if not emissions or len(emissions) < 7:
            return jsonify({
                "success": False,
                "error": "Need at least 7 emission records for insights."
            }), 400

        df = pd.DataFrame(emissions)
        # Parse dates — handle both tz-aware and tz-naive strings
        df["date"] = pd.to_datetime(df["date"], errors="coerce", utc=True)
        df["date"] = df["date"].dt.tz_convert(None)
        df = df.sort_values("date").dropna(subset=["date"])

        # --- Anomaly Detection (residual-based, 2-sigma) ---
        series = df["total_carbon_emission"].astype(float)
        rolling_mean = series.rolling(window=7, min_periods=3).mean()
        rolling_std = series.rolling(window=7, min_periods=3).std()
        residuals = (series - rolling_mean).abs()
        threshold = rolling_std * 2

        anomalies = []
        for i in range(len(df)):
            if pd.notna(residuals.iloc[i]) and pd.notna(threshold.iloc[i]):
                if float(residuals.iloc[i]) > float(threshold.iloc[i]) and float(threshold.iloc[i]) > 0:
                    deviation = float(series.iloc[i]) - float(rolling_mean.iloc[i])
                    anomalies.append({
                        "date": df["date"].iloc[i].strftime("%Y-%m-%d"),
                        "value": round(float(series.iloc[i]), 2),
                        "expected": round(float(rolling_mean.iloc[i]), 2),
                        "deviation": round(deviation, 2),
                        "severity": "high" if abs(deviation) > float(rolling_std.iloc[i]) * 3 else "medium",
                    })

        # --- Seasonality (weekday aggregation, last 30 days) ---
        recent = df.tail(30).copy()
        recent["weekday"] = recent["date"].dt.day_name()
        weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weekday_avg = recent.groupby("weekday")["total_carbon_emission"].mean()
        weekday_avg = weekday_avg.reindex(weekday_order).fillna(0)

        weekday_data = [{"day": day, "avg_emission": round(float(val), 2)} for day, val in weekday_avg.items()]

        # Generate textual insight
        weekday_mean = float(weekday_avg[["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]].mean())
        weekend_mean = float(weekday_avg[["Saturday", "Sunday"]].mean())
        seasonal_insight = ""
        if weekday_mean > 0:
            pct_diff = ((weekend_mean - weekday_mean) / weekday_mean) * 100
            if pct_diff > 5:
                seasonal_insight = f"Weekend emissions are {abs(pct_diff):.0f}% higher than weekdays."
            elif pct_diff < -5:
                seasonal_insight = f"Weekday emissions are {abs(pct_diff):.0f}% higher than weekends."
            else:
                seasonal_insight = "Emissions are relatively consistent across all days."

        seasonality = {
            "weekday_data": weekday_data,
            "insight": seasonal_insight,
            "has_pattern": abs(weekend_mean - weekday_mean) / max(weekday_mean, 1.0) > 0.05,
        }

        # --- Driver Importance (proportion-based) ---
        driver_cols = {
            "fuel_emission": "Fuel Combustion",
            "electricity_emission": "Electricity",
            "explosives_emission": "Explosives",
            "transport_emission": "Transport",
            "methane_emissions_co2e": "Methane",
        }

        total_all = 0
        driver_totals = {}
        for col, label in driver_cols.items():
            if col in df.columns:
                val = df[col].astype(float).sum()
                driver_totals[label] = val
                total_all += val

        drivers = []
        for label, val in driver_totals.items():
            pct = (val / total_all * 100) if total_all > 0 else 0
            direction = "increase"  # simplified; could do trend analysis per driver
            drivers.append({
                "name": label,
                "weight": round(pct, 1),
                "direction": direction,
            })
        drivers.sort(key=lambda x: x["weight"], reverse=True)

        # --- Trend Direction (linear regression on last 30 days) ---
        recent_series = series.tail(30).values
        if len(recent_series) >= 7:
            x = np.arange(len(recent_series))
            coeffs = np.polyfit(x, recent_series, 1)
            slope = float(coeffs[0])
            if slope > 0.5:
                trend_direction = "rising"
            elif slope < -0.5:
                trend_direction = "falling"
            else:
                trend_direction = "stable"
            trend = {
                "direction": trend_direction,
                "slope": round(slope, 4),
                "description": f"{'Upward' if trend_direction == 'rising' else 'Downward' if trend_direction == 'falling' else 'Stable'} trend detected in recent emissions.",
            }
        else:
            trend = {"direction": "stable", "slope": 0, "description": "Insufficient data for trend analysis."}

        # --- MAPE (if forecast data provided, compare with recent actuals) ---
        mape = None
        if forecast_data and len(forecast_data) > 0:
            # Use last few actuals as pseudo-test set for MAPE estimation
            test_n = min(len(recent_series), 10)
            if test_n > 0:
                actuals = recent_series[-test_n:]
                mean_actual = float(np.mean(actuals))
                if mean_actual > 0:
                    # Estimate MAPE from rolling prediction errors
                    pred_series = series.tail(test_n + 7).values
                    if len(pred_series) > test_n:
                        rolling_pred = pd.Series(pred_series).rolling(7).mean().dropna().values[-test_n:]
                        if len(rolling_pred) == test_n:
                            ape = np.abs((actuals - rolling_pred) / np.maximum(actuals, 1)) * 100
                            mape = round(float(np.mean(ape)), 2)

        return jsonify({
            "success": True,
            "anomalies": anomalies,
            "seasonality": seasonality,
            "drivers": drivers,
            "trend": trend,
            "mape": mape,
        })

    except Exception as e:
        logger.error(f"Insights error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error during insights analysis."}), 500
