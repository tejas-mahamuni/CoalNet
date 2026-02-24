"""Integration tests for the forecast service pipeline."""

import numpy as np
import pandas as pd
import pytest

from app.services.forecast_service import generate_forecast
from app.services.data_processor import process_emission_data, validate_minimum_data


def make_emission_records(n=90, start_date="2025-01-01"):
    """Create realistic emission records mimicking MongoDB output."""
    np.random.seed(42)
    dates = pd.date_range(start=start_date, periods=n, freq="D")
    records = []
    for i, d in enumerate(dates):
        fuel_used = np.random.uniform(3000, 7000)
        electricity_used = np.random.uniform(8000, 15000)
        explosives_used = np.random.uniform(100, 400)
        transport_fuel_used = np.random.uniform(1000, 4000)

        fuel_emission = fuel_used * 2.68
        electricity_emission = electricity_used * 0.82
        explosives_emission = explosives_used * 1.5
        transport_emission = transport_fuel_used * 2.68
        methane_co2e = 0.02 * fuel_used * 28

        scope1 = fuel_emission + explosives_emission + methane_co2e
        scope2 = electricity_emission
        scope3 = transport_emission
        total = scope1 + scope2 + scope3

        records.append({
            "date": d.strftime("%Y-%m-%dT00:00:00.000Z"),
            "fuel_used": round(fuel_used, 2),
            "electricity_used": round(electricity_used, 2),
            "explosives_used": round(explosives_used, 2),
            "transport_fuel_used": round(transport_fuel_used, 2),
            "fuel_emission": round(fuel_emission, 2),
            "electricity_emission": round(electricity_emission, 2),
            "explosives_emission": round(explosives_emission, 2),
            "methane_emissions_co2e": round(methane_co2e, 2),
            "transport_emission": round(transport_emission, 2),
            "scope1": round(scope1, 2),
            "scope2": round(scope2, 2),
            "scope3": round(scope3, 2),
            "total_carbon_emission": round(total, 2),
        })
    return records


class TestDataProcessor:
    """Tests for data processing pipeline."""

    def test_process_valid_data(self):
        records = make_emission_records(60)
        series = process_emission_data(records)
        assert len(series) == 60
        assert series.name == "total_carbon_emission"

    def test_process_empty_data(self):
        with pytest.raises(ValueError, match="No emission data"):
            process_emission_data([])

    def test_process_missing_fields(self):
        records = [{"date": "2025-01-01", "other_field": 123}]
        with pytest.raises(ValueError, match="total_carbon_emission"):
            process_emission_data(records)

    def test_gap_filling(self):
        """Missing dates should be filled."""
        records = make_emission_records(10)
        # Remove days 3-5 to create a gap
        gapped = [r for i, r in enumerate(records) if i not in (3, 4, 5)]
        series = process_emission_data(gapped)
        assert len(series) == 10  # Full range should be filled

    def test_validate_minimum_data(self):
        records = make_emission_records(60)
        series = process_emission_data(records)
        assert validate_minimum_data(series, 60) is True
        assert validate_minimum_data(series, 100) is False


class TestForecastService:
    """Tests for the full forecasting pipeline."""

    def test_generate_forecast_7days(self):
        records = make_emission_records(90)
        result = generate_forecast(records, horizon=7)
        assert len(result["forecast_data"]) == 7
        assert "model_accuracy" in result
        assert "model_params" in result
        assert result["data_points_used"] == 90

    def test_generate_forecast_30days(self):
        records = make_emission_records(90)
        result = generate_forecast(records, horizon=30)
        assert len(result["forecast_data"]) == 30

    def test_forecast_structure(self):
        records = make_emission_records(90)
        result = generate_forecast(records, horizon=7)
        entry = result["forecast_data"][0]
        assert "date" in entry
        assert "predicted" in entry
        assert "upper_bound" in entry
        assert "lower_bound" in entry

    def test_invalid_horizon(self):
        records = make_emission_records(90)
        with pytest.raises(ValueError, match="Horizon must be"):
            generate_forecast(records, horizon=5)

    def test_insufficient_data(self):
        records = make_emission_records(10)
        with pytest.raises(ValueError, match="Insufficient data"):
            generate_forecast(records, horizon=7)
