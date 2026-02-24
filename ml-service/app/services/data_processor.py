"""
Data processor for emission time-series data.

Handles conversion from raw JSON emission records to clean pandas Series
suitable for ARIMA model training.
"""

import pandas as pd
import numpy as np


def process_emission_data(raw_emissions: list) -> pd.Series:
    """
    Process raw emission JSON records into a clean time-series.

    Args:
        raw_emissions: List of emission dicts, each with at least
            'date' (ISO string) and 'total_carbon_emission' (number).

    Returns:
        pd.Series of total_carbon_emission indexed by DatetimeIndex,
        sorted chronologically, with missing dates filled.

    Raises:
        ValueError: If data is empty or missing required fields.
    """
    if not raw_emissions:
        raise ValueError("No emission data provided.")

    df = pd.DataFrame(raw_emissions)

    # Validate required columns
    if "date" not in df.columns or "total_carbon_emission" not in df.columns:
        raise ValueError(
            "Emission data must contain 'date' and 'total_carbon_emission' fields."
        )

    # Parse dates and set as index
    df["date"] = pd.to_datetime(df["date"], utc=True)
    df["date"] = df["date"].dt.tz_localize(None)  # strip timezone for ARIMA
    df = df.set_index("date")
    df = df.sort_index()

    # Remove duplicate dates (keep last entry)
    df = df[~df.index.duplicated(keep="last")]

    # Extract the target series
    series = df["total_carbon_emission"].astype(float)

    # Fill missing dates in the range
    full_range = pd.date_range(start=series.index.min(), end=series.index.max(), freq="D")
    series = series.reindex(full_range)

    # Fill gaps: forward fill first, then backward fill remaining NaNs
    series = series.ffill().bfill()

    # If any NaN still remains (edge case), fill with 0
    series = series.fillna(0)

    # Ensure series name
    series.name = "total_carbon_emission"

    return series


def validate_minimum_data(series: pd.Series, min_points: int = 60) -> bool:
    """Check if there are enough data points for forecasting."""
    return len(series) >= min_points
