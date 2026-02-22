"""
CoalNet Zero — ML Service Entry Point

Flask application serving ARIMA-based emission forecasting.
Run: python -m app.main
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from app.routes.forecast import forecast_bp
from app.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)

    # Register blueprints
    app.register_blueprint(forecast_bp)

    # Health check endpoint
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "coalnet-ml-service",
            "version": "1.0.0",
        })

    logger.info("CoalNet ML Service initialized")
    return app


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    app = create_app()
    logger.info(f"Starting ML service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") == "development")
