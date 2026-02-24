"""Input validation helpers for the ML service."""


def validate_forecast_request(data: dict) -> tuple:
    """
    Validate the incoming forecast request body.

    Args:
        data: Request JSON body.

    Returns:
        (is_valid: bool, error_message: str or None)
    """
    if not data:
        return False, "Request body is empty."

    if "emissions" not in data:
        return False, "Missing required field: 'emissions'."

    if not isinstance(data["emissions"], list):
        return False, "'emissions' must be a list of emission records."

    if len(data["emissions"]) == 0:
        return False, "'emissions' list is empty."

    # Validate horizon if provided
    horizon = data.get("horizon", 7)
    if horizon not in (7, 14, 30):
        return False, "Horizon must be 7, 14, or 30 days."

    # Validate that emission records have required fields
    sample = data["emissions"][0]
    if "date" not in sample:
        return False, "Emission records must contain 'date' field."
    if "total_carbon_emission" not in sample:
        return False, "Emission records must contain 'total_carbon_emission' field."

    return True, None
