"""
ARIMA Forecaster for CoalNet Zero emission predictions.

Uses statsmodels ARIMA implementation with automatic order selection
based on AIC (Akaike Information Criterion).
"""

import warnings
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)


class ARIMAForecaster:
    """ARIMA time-series forecaster with automatic order selection."""

    # Common ARIMA orders to evaluate — includes d=0 (trend), d=1, d=2
    CANDIDATE_ORDERS = [
        # d=0: No differencing — captures level + trend via drift
        (1, 0, 0), (2, 0, 0), (1, 0, 1), (2, 0, 1),
        # d=1: Single differencing — standard stationarity
        (1, 1, 0), (0, 1, 1), (1, 1, 1), (2, 1, 1),
        # d=2: Double differencing — strong trends
        (1, 2, 1), (0, 2, 1),
    ]

    def __init__(self):
        self.model = None
        self.fitted_model = None
        self.order = None
        self.aic = None
        self.data = None
        self.trend_param = None

    def fit(self, data: pd.Series) -> dict:
        """
        Fit the ARIMA model with automatic order selection.

        Args:
            data: pd.Series of emission values indexed by date.

        Returns:
            dict with 'order' and 'aic' of the best model.
        """
        self.data = data.copy()

        best_aic = float("inf")
        best_order = (1, 1, 1)  # fallback
        best_model = None
        best_trend = None

        for order in self.CANDIDATE_ORDERS:
            try:
                # trend parameter is CRITICAL for producing sloped forecasts:
                # d=0: 'ct' = constant + linear time trend (captures level & slope)
                # d=1: 'c'  = constant/drift (produces sloped forecast line)
                # d=2: 'c'  = constant/drift
                # Without drift ('c'), d>=1 forecasts converge to FLAT lines!
                if order[1] == 0:
                    trend = 'ct'
                else:
                    trend = 'c'
                model = ARIMA(data, order=order, trend=trend)
                fitted = model.fit()
                if fitted.aic < best_aic:
                    best_aic = fitted.aic
                    best_order = order
                    best_model = fitted
                    best_trend = trend
            except Exception:
                continue

        if best_model is None:
            # Final fallback: simple (1,1,1) WITH drift
            model = ARIMA(data, order=(1, 1, 1), trend='c')
            best_model = model.fit()
            best_aic = best_model.aic
            best_order = (1, 1, 1)
            best_trend = 'c'

        self.fitted_model = best_model
        self.order = best_order
        self.aic = best_aic
        self.trend_param = best_trend

        return {"order": list(best_order), "aic": round(best_aic, 2)}

    def predict(self, horizon: int) -> dict:
        """
        Generate forecast for the given horizon.

        Args:
            horizon: Number of days to forecast (7, 14, or 30).

        Returns:
            dict with 'forecast', 'confidence_lower', 'confidence_upper'
            as lists of floats, and 'dates' as list of date strings.
        """
        if self.fitted_model is None:
            raise ValueError("Model has not been fitted. Call fit() first.")

        forecast_result = self.fitted_model.get_forecast(steps=horizon)
        predicted_mean = forecast_result.predicted_mean
        confidence_int = forecast_result.conf_int(alpha=0.05)

        # Generate forecast dates
        last_date = self.data.index[-1]
        forecast_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1), periods=horizon, freq="D"
        )

        return {
            "dates": [d.strftime("%Y-%m-%d") for d in forecast_dates],
            "forecast": [max(0, round(float(v), 2)) for v in predicted_mean],
            "confidence_lower": [
                max(0, round(float(v), 2)) for v in confidence_int.iloc[:, 0]
            ],
            "confidence_upper": [
                max(0, round(float(v), 2)) for v in confidence_int.iloc[:, 1]
            ],
        }

    def evaluate(self, test_ratio: float = 0.2) -> dict:
        """
        Evaluate model accuracy using train/test split.

        Args:
            test_ratio: Fraction of data to use as test set.

        Returns:
            dict with 'mae' and 'rmse'.
        """
        if self.data is None or len(self.data) < 10:
            return {"mae": 0.0, "rmse": 0.0}

        split_idx = int(len(self.data) * (1 - test_ratio))
        train = self.data.iloc[:split_idx]
        test = self.data.iloc[split_idx:]

        if len(test) == 0:
            return {"mae": 0.0, "rmse": 0.0}

        try:
            model = ARIMA(train, order=self.order, trend=self.trend_param)
            fitted = model.fit()
            predictions = fitted.forecast(steps=len(test))

            mae = mean_absolute_error(test, predictions)
            rmse = float(np.sqrt(mean_squared_error(test, predictions)))

            return {"mae": round(mae, 2), "rmse": round(rmse, 2)}
        except Exception:
            return {"mae": 0.0, "rmse": 0.0}

    def get_model_params(self) -> dict:
        """Return the fitted model parameters."""
        return {
            "order": list(self.order) if self.order else None,
            "aic": round(self.aic, 2) if self.aic else None,
        }
