Backend Refactoring Implementation Plan
Goal
Refactor the current monolithic 
backend/index.js
 (800+ lines) into a modular architecture consistent with 
PROJECT_STRUCTURE_AND_ROADMAP.md
. This is a prerequisite for clean integration with the future Python ML service.

Recommendation
We should "fix existing problems" first. The current single-file structure makes it difficult to maintain, test, and integrate new services. Modularizing now prevents technical debt from accumulating.

Proposed Changes
1. Structure Creation
We will create the standard Express directory structure in backend/:

models/ - Database schemas
controllers/ - Request logic
routes/ - API endpoints
config/ - Database and environment config
utils/ - Helper functions
2. Code Migration Strategy
Phase 1: Configuration & Models
Extract MongoDB connection to config/db.js.
Move mineSchema to models/Mine.js.
Move dailyEmissionSchema and 
getMineEmissionModel
 to models/Emission.js.
Phase 2: Logic Extraction (Controllers)
Dashboard Controller: Extract /api/dashboard logic to controllers/dashboardController.js.
Emission Controller: Extract /api/emissions (POST/GET) logic to controllers/emissionController.js.
Mine Controller: Extract /api/mines logic to controllers/mineController.js.
Visualization Controller: Extract /api/visualization logic to controllers/visualizationController.js.
Note: This contains the linear regression logic we will eventually replace.
Phase 3: Route Definition
Create routes/dashboardRoutes.js, routes/emissionRoutes.js, etc.
Update 
index.js
 to use app.use('/api', routes).
3. Verification
Ensure all current endpoints (/dashboard, /mines, /emissions) function exactly as before.
Run frontend validation to ensure no API contracts were broken.
Next Steps
Once refactored, we will proceed to Sprint 4 tasks: setting up the Python ML microservice and connecting it to the clean visualizationController.