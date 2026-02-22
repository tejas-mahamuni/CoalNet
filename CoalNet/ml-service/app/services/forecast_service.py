"""
Forecast service orchestrating data processing, model training, and prediction.
"""

from app.models.arima_model import ARIMAForecaster
from app.services.data_processor import process_emission_data, validate_minimum_data
from app.utils.logger import get_logger

logger = get_logger(__name__)


def generate_forecast(emissions: list, horizon: int = 7) -> dict:
    """
    Full forecasting pipeline: preprocess → fit → predict → evaluate.

    Args:
        emissions: List of emission record dicts from MongoDB.
        horizon: Number of days to forecast (7, 14, or 30).

    Returns:
        dict with:
            - forecast_data: list of {date, predicted, upper_bound, lower_bound}
            - model_accuracy: {mae, rmse}
            - model_params: {order, aic}
            - data_points_used: int

    Raises:
        ValueError: If data validation fails.
    """
    # Validate horizon
    if horizon not in (7, 14, 30):
        raise ValueError("Horizon must be 7, 14, or 30 days.")

    logger.info(f"Starting forecast: {len(emissions)} records, horizon={horizon} days")

    # Step 1: Process raw emission data
    series = process_emission_data(emissions)
    logger.info(f"Processed data: {len(series)} data points ({series.index.min()} to {series.index.max()})")

    # Step 2: Validate minimum data
    if not validate_minimum_data(series, min_points=30):
        raise ValueError(
            f"Insufficient data for forecasting. Need at least 30 data points, "
            f"got {len(series)}. Recommended: 60+ days of data."
        )

    # Step 3: Fit ARIMA model
    forecaster = ARIMAForecaster()
    model_params = forecaster.fit(series)
    logger.info(f"Model fitted: order={model_params['order']}, AIC={model_params['aic']}")

    # Step 4: Generate predictions
    predictions = forecaster.predict(horizon)
    logger.info(f"Forecast generated: {len(predictions['dates'])} days ahead")

    # Step 5: Evaluate model accuracy
    accuracy = forecaster.evaluate(test_ratio=0.2)
    logger.info(f"Model accuracy: MAE={accuracy['mae']}, RMSE={accuracy['rmse']}")

    # Step 6: Format output
    forecast_data = []
    for i in range(len(predictions["dates"])):
        forecast_data.append({
            "date": predictions["dates"][i],
            "predicted": predictions["forecast"][i],
            "upper_bound": predictions["confidence_upper"][i],
            "lower_bound": predictions["confidence_lower"][i],
        })

    return {
        "forecast_data": forecast_data,
        "model_accuracy": accuracy,
        "model_params": model_params,
        "data_points_used": len(series),
    }
