"""
Forecast API route blueprint.

POST /api/forecast — Accepts emission data and returns ARIMA forecast.
"""

from flask import Blueprint, request, jsonify
from app.services.forecast_service import generate_forecast
from app.utils.validators import validate_forecast_request
from app.utils.logger import get_logger

logger = get_logger(__name__)
forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/api/forecast", methods=["POST"])
def create_forecast():
    """
    Generate ARIMA forecast from emission data.

    Request body:
        {
            "emissions": [
                {"date": "2025-01-01", "total_carbon_emission": 1234.5, ...},
                ...
            ],
            "horizon": 7  // optional, default 7. Must be 7, 14, or 30.
        }

    Response:
        {
            "success": true,
            "forecast_data": [
                {"date": "2025-04-01", "predicted": 1200.0, "upper_bound": 1350.0, "lower_bound": 1050.0},
                ...
            ],
            "model_accuracy": {"mae": 45.2, "rmse": 62.1},
            "model_params": {"order": [1, 1, 1], "aic": 1234.56},
            "data_points_used": 90
        }
    """
    try:
        data = request.get_json(force=True)

        # Validate input
        is_valid, error_msg = validate_forecast_request(data)
        if not is_valid:
            return jsonify({"success": False, "error": error_msg}), 400

        emissions = data["emissions"]
        horizon = data.get("horizon", 7)

        logger.info(f"Forecast request: {len(emissions)} records, horizon={horizon}")

        # Generate forecast
        result = generate_forecast(emissions, horizon)

        return jsonify({
            "success": True,
            "forecast_data": result["forecast_data"],
            "model_accuracy": result["model_accuracy"],
            "model_params": result["model_params"],
            "data_points_used": result["data_points_used"],
        })

    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 400

    except Exception as e:
        logger.error(f"Forecast error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error during forecasting."}), 500
