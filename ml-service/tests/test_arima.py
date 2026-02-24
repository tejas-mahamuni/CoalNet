"""Unit tests for the ARIMA forecaster."""

import numpy as np
import pandas as pd
import pytest

from app.models.arima_model import ARIMAForecaster


def generate_test_series(n=100, seed=42):
    """Generate a realistic synthetic emission time series."""
    np.random.seed(seed)
    dates = pd.date_range(start="2025-01-01", periods=n, freq="D")
    # Trend + seasonality + noise
    trend = np.linspace(1000, 1200, n)
    seasonal = 50 * np.sin(2 * np.pi * np.arange(n) / 30)
    noise = np.random.normal(0, 20, n)
    values = trend + seasonal + noise
    return pd.Series(values, index=dates, name="total_carbon_emission")


class TestARIMAForecaster:
    """Tests for ARIMAForecaster class."""

    def test_fit_returns_params(self):
        series = generate_test_series()
        forecaster = ARIMAForecaster()
        result = forecaster.fit(series)
        assert "order" in result
        assert "aic" in result
        assert len(result["order"]) == 3
        assert isinstance(result["aic"], float)

    def test_predict_returns_correct_horizon(self):
        series = generate_test_series()
        forecaster = ARIMAForecaster()
        forecaster.fit(series)

        for horizon in [7, 14, 30]:
            predictions = forecaster.predict(horizon)
            assert len(predictions["dates"]) == horizon
            assert len(predictions["forecast"]) == horizon
            assert len(predictions["confidence_lower"]) == horizon
            assert len(predictions["confidence_upper"]) == horizon

    def test_predict_values_non_negative(self):
        series = generate_test_series()
        forecaster = ARIMAForecaster()
        forecaster.fit(series)
        predictions = forecaster.predict(7)
        for v in predictions["forecast"]:
            assert v >= 0

    def test_predict_without_fit_raises(self):
        forecaster = ARIMAForecaster()
        with pytest.raises(ValueError, match="not been fitted"):
            forecaster.predict(7)

    def test_evaluate_returns_metrics(self):
        series = generate_test_series()
        forecaster = ARIMAForecaster()
        forecaster.fit(series)
        metrics = forecaster.evaluate()
        assert "mae" in metrics
        assert "rmse" in metrics
        assert metrics["mae"] >= 0
        assert metrics["rmse"] >= 0

    def test_get_model_params(self):
        series = generate_test_series()
        forecaster = ARIMAForecaster()
        forecaster.fit(series)
        params = forecaster.get_model_params()
        assert params["order"] is not None
        assert params["aic"] is not None

    def test_confidence_interval_ordering(self):
        series = generate_test_series()
        forecaster = ARIMAForecaster()
        forecaster.fit(series)
        predictions = forecaster.predict(7)
        for i in range(7):
            assert predictions["confidence_lower"][i] <= predictions["forecast"][i]
            assert predictions["forecast"][i] <= predictions["confidence_upper"][i]

    def test_small_dataset(self):
        """Should still work with minimal data."""
        series = generate_test_series(n=35)
        forecaster = ARIMAForecaster()
        result = forecaster.fit(series)
        assert result["order"] is not None
        predictions = forecaster.predict(7)
        assert len(predictions["forecast"]) == 7
