# CoalNet Zero - Project Structure & Implementation Roadmap

## Version 1.0 | February 15, 2026

---

## 1. PROJECT FOLDER STRUCTURE

### 1.1 Root Directory Structure

```
coalnet-zero/
├── frontend/                    # React application
├── backend/                     # Node.js API server
├── ml-service/                  # Python ML microservice
├── docs/                        # Documentation
├── scripts/                     # Utility scripts
├── .github/                     # GitHub workflows
└── README.md                    # Project overview
```

### 1.2 Frontend Structure (React + Vite)

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   └── manifest.json
├── src/
│   ├── assets/                  # Images, icons, fonts
│   │   ├── icons/
│   │   ├── images/
│   │   └── fonts/
│   ├── components/              # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── GlassCard.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Modal.jsx
│   │   ├── charts/
│   │   │   ├── LineChart.jsx
│   │   │   ├── BarChart.jsx
│   │   │   ├── PieChart.jsx
│   │   │   ├── StackedBarChart.jsx
│   │   │   └── ChartContainer.jsx
│   │   ├── forms/
│   │   │   ├── DataEntryForm.jsx
│   │   │   ├── InputField.jsx
│   │   │   ├── DatePicker.jsx
│   │   │   ├── DateRangePicker.jsx
│   │   │   └── FileUpload.jsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.jsx
│   │   │   ├── EmissionCounter.jsx
│   │   │   ├── TrendIndicator.jsx
│   │   │   └── MineSelector.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── PageLayout.jsx
│   │   └── auth/
│   │       ├── LoginButton.jsx
│   │       ├── ProtectedRoute.jsx
│   │       └── UserProfile.jsx
│   ├── pages/                   # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DataEntry.jsx
│   │   ├── Forecasting.jsx
│   │   ├── Simulator.jsx
│   │   ├── Comparison.jsx
│   │   ├── Reports.jsx
│   │   └── NotFound.jsx
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── MineContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useEmissions.js
│   │   ├── useForecast.js
│   │   ├── useDebounce.js
│   │   └── useLocalStorage.js
│   ├── services/                # API service layer
│   │   ├── api.js               # Axios instance config
│   │   ├── authService.js
│   │   ├── emissionService.js
│   │   ├── analyticsService.js
│   │   ├── forecastService.js
│   │   └── reportService.js
│   ├── utils/                   # Utility functions
│   │   ├── calculations.js      # Emission calculations
│   │   ├── formatters.js        # Data formatting
│   │   ├── validators.js        # Input validation
│   │   ├── constants.js         # App constants
│   │   └── dateHelpers.js
│   ├── styles/                  # Global styles
│   │   ├── globals.css
│   │   ├── tailwind.css
│   │   └── animations.css
│   ├── config/                  # Configuration
│   │   ├── firebase.js
│   │   ├── charts.js
│   │   └── theme.js
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   └── routes.jsx               # Route definitions
├── .env.example                 # Environment template
├── .env.local                   # Local environment
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── README.md
```

### 1.3 Backend Structure (Node.js + Express)

```
backend/
├── src/
│   ├── config/                  # Configuration files
│   │   ├── database.js          # MongoDB connection
│   │   ├── firebase.js          # Firebase Admin setup
│   │   └── environment.js       # Env variable loader
│   ├── models/                  # Mongoose schemas
│   │   ├── Emission.js
│   │   ├── User.js
│   │   ├── Mine.js
│   │   ├── Forecast.js
│   │   ├── EmissionFactor.js
│   │   └── Scenario.js
│   ├── controllers/             # Route handlers
│   │   ├── authController.js
│   │   ├── emissionController.js
│   │   ├── analyticsController.js
│   │   ├── forecastController.js
│   │   ├── simulationController.js
│   │   └── reportController.js
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # JWT verification
│   │   ├── validation.js        # Request validation
│   │   ├── errorHandler.js
│   │   ├── rateLimit.js
│   │   └── logger.js
│   ├── routes/                  # API routes
│   │   ├── index.js             # Route aggregator
│   │   ├── auth.js
│   │   ├── emissions.js
│   │   ├── analytics.js
│   │   ├── forecast.js
│   │   ├── simulate.js
│   │   └── reports.js
│   ├── services/                # Business logic layer
│   │   ├── emissionService.js   # Emission calculations
│   │   ├── mlService.js         # ML service client
│   │   ├── aggregationService.js
│   │   ├── cacheService.js
│   │   └── pdfService.js
│   ├── utils/                   # Utility functions
│   │   ├── calculations.js
│   │   ├── validators.js
│   │   ├── dateHelpers.js
│   │   ├── emissionFactors.js   # IPCC factors
│   │   └── logger.js
│   ├── jobs/                    # Background jobs
│   │   ├── dataFiller.js        # Fill missing dates
│   │   └── cacheWarmer.js
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── tests/                       # Test files
│   ├── unit/
│   │   ├── calculations.test.js
│   │   └── validators.test.js
│   └── integration/
│       ├── emissions.test.js
│       └── analytics.test.js
├── .env.example
├── .env
├── .gitignore
├── package.json
├── nodemon.json
├── jest.config.js
└── README.md
```

### 1.4 ML Service Structure (Python + Flask)

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Flask app entry
│   ├── models/                  # ML models
│   │   ├── __init__.py
│   │   ├── arima_model.py       # ARIMA implementation
│   │   └── model_validator.py
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   ├── forecast_service.py
│   │   ├── data_processor.py
│   │   └── cache_service.py
│   ├── utils/                   # Utilities
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   └── logger.py
│   └── routes/                  # API routes
│       ├── __init__.py
│       └── forecast.py
├── tests/
│   ├── __init__.py
│   ├── test_arima.py
│   └── test_forecast_service.py
├── requirements.txt
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

### 1.5 Documentation Structure

```
docs/
├── PRD.docx                     # Product Requirements
├── DRD.docx                     # Design Requirements
├── API_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
├── USER_MANUAL.pdf
├── DEVELOPER_GUIDE.md
└── ARCHITECTURE.md
```

---

## 2. TECHNOLOGY STACK DETAILS

### 2.1 Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "firebase": "^10.7.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "framer-motion": "^10.16.0",
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.48.0",
    "zustand": "^4.4.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.55.0"
  }
}
```

### 2.2 Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^8.0.0",
    "firebase-admin": "^11.11.0",
    "dotenv": "^16.3.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "joi": "^17.11.0",
    "axios": "^1.6.0",
    "pdfkit": "^0.13.0",
    "csv-parser": "^3.0.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0"
  }
}
```

### 2.3 Python ML Service Dependencies

```
Flask==3.0.0
statsmodels==0.14.0
pandas==2.1.0
numpy==1.25.0
scikit-learn==1.3.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

---

## 3. SPRINT PLAN (4-WEEK SPRINTS)

### SPRINT 1: Foundation & Authentication (Weeks 1-4)

**Week 1: Project Setup**
- Initialize Git repository and project structure
- Set up development environments (Node, Python, MongoDB Atlas)
- Configure Firebase project and authentication
- Create basic React app with Vite
- Set up Tailwind CSS and design system
- Initialize Express backend with MongoDB connection
- Create initial database schemas

**Week 2: Authentication System**
- Implement Firebase Google Sign-In on frontend
- Create login page with glassmorphism design
- Build AuthContext and useAuth hook
- Implement protected route wrapper
- Build backend auth verification endpoint
- Create User model and controller
- Test authentication flow end-to-end

**Week 3: Database & Core Models**
- Finalize Emission schema with all fields
- Create Mine, EmissionFactor models
- Build database indexing strategy
- Implement data validation middleware
- Create seed script for emission factors (IPCC data)
- Build database utility functions
- Test CRUD operations

**Week 4: API Foundation**
- Set up API routing structure
- Implement error handling middleware
- Add request validation with Joi
- Create logging system with Winston
- Build rate limiting middleware
- Set up CORS and security headers
- Write API documentation (Swagger/OpenAPI)

**Sprint 1 Deliverables:**
- ✅ Complete project structure
- ✅ Working authentication system
- ✅ Database schema and connection
- ✅ Core API infrastructure
- ✅ Development environment setup

---

### SPRINT 2: Data Management & Basic Dashboard (Weeks 5-8)

**Week 5: Data Entry Forms**
- Build DataEntryForm component
- Create input validation logic
- Implement real-time field validation
- Build date picker component
- Create anomaly detection for inputs
- Add form submission handler
- Implement success/error toast notifications

**Week 6: Emission Calculation Engine**
- Implement emission calculation service (backend)
- Create calculation utility functions
- Build scope classification logic (1, 2, 3)
- Test calculations against IPCC standards
- Create POST /emissions endpoint
- Build emission calculator on frontend
- Add calculation preview before save

**Week 7: Basic Dashboard - Part 1**
- Create Dashboard page layout
- Build StatCard component with animation
- Implement EmissionCounter with Framer Motion
- Create MineSelector dropdown
- Build basic line chart for trends
- Implement GET /emissions endpoint
- Add date range filtering logic

**Week 8: Basic Dashboard - Part 2**
- Create pie chart for activity breakdown
- Build bar chart for scope distribution
- Add responsive grid layout
- Implement data aggregation service
- Create analytics summary endpoint
- Add loading states and error handling
- Test dashboard with real data

**Sprint 2 Deliverables:**
- ✅ Functional data entry system
- ✅ Working emission calculations
- ✅ Basic dashboard with key visualizations
- ✅ Data aggregation capabilities

---

### SPRINT 3: Time Filtering & Enhanced Visualizations (Weeks 9-12)

**Week 9: Centralized Time Filtering**
- Build DateRangePicker component
- Create global date filter context
- Implement preset ranges (daily, weekly, monthly)
- Build custom date range selector
- Refactor all API calls to use date params
- Create date helper utilities
- Test filtering across all charts

**Week 10: Missing Data Handler**
- Build automatic date filling service
- Create interpolation logic for missing dates
- Implement zero-filling for gaps
- Add data completeness indicators
- Build data validation report
- Create bulk data upload (CSV)
- Test with historical data imports

**Week 11: Enhanced Chart Components**
- Add stacked bar chart component
- Build dual-line chart for comparisons
- Implement year-over-year comparison
- Create monthly trend visualizations
- Add chart hover tooltips
- Implement chart export functionality
- Enhance chart animations

**Week 12: Dashboard Refinement**
- Add mine ranking visualization
- Implement emission intensity metrics
- Create period-over-period comparison
- Build activity hotspot indicators
- Add dashboard customization options
- Implement dashboard state persistence
- Performance optimization

**Sprint 3 Deliverables:**
- ✅ Robust time filtering system
- ✅ Missing data handling
- ✅ Complete visualization suite
- ✅ Polished dashboard experience

---

### SPRINT 4: AI Forecasting (Weeks 13-16)

**Week 13: ML Service Setup**
- Initialize Flask application
- Set up Python environment and dependencies
- Create ARIMA model implementation
- Build data preprocessing pipeline
- Implement model training function
- Create forecast generation endpoint
- Test ARIMA with sample data

**Week 14: Backend ML Integration**
- Create ML service client in Node backend
- Build forecast controller
- Implement forecast caching in MongoDB
- Create Forecast model schema
- Build POST /forecast endpoint
- Add forecast validation logic
- Test Node-Python communication

**Week 15: Frontend Forecasting UI**
- Create Forecasting page layout
- Build forecast trigger button
- Implement loading state for ML processing
- Create dual-line chart (actual vs predicted)
- Add confidence interval visualization
- Build forecast parameters controls
- Show model accuracy metrics

**Week 16: Forecast Optimization**
- Implement forecast cache checking
- Add automatic retraining triggers
- Build forecast accuracy tracking
- Create forecast history storage
- Add forecast comparison feature
- Implement forecast export
- Performance testing and tuning

**Sprint 4 Deliverables:**
- ✅ Working ARIMA forecasting model
- ✅ Integrated ML service
- ✅ Forecast visualization interface
- ✅ Forecast caching system

---

### SPRINT 5: Reduction Pathway Simulator (Weeks 17-20)

**Week 17: Simulator Logic**
- Build reduction calculation engine
- Implement EV adoption impact calculations
- Create renewable energy impact model
- Build methane capture efficiency logic
- Implement operational efficiency improvements
- Create scenario calculation service
- Test reduction calculations

**Week 18: Simulator UI Components**
- Create Simulator page layout
- Build slider components for inputs
- Implement real-time calculation updates
- Create impact visualization charts
- Add baseline vs reduced comparison
- Build scenario summary cards
- Implement percentage and absolute displays

**Week 19: Scenario Management**
- Create Scenario model
- Build scenario save functionality
- Implement scenario loading
- Create scenario comparison view
- Add scenario delete functionality
- Build scenario history list
- Implement scenario sharing

**Week 20: Simulator Enhancement**
- Add cost estimation (optional module)
- Build ROI calculator
- Create implementation timeline estimates
- Add best practice recommendations
- Implement scenario export to PDF
- Build simulator tutorial/guide
- Performance optimization

**Sprint 5 Deliverables:**
- ✅ Functional reduction simulator
- ✅ Scenario management system
- ✅ Impact visualization
- ✅ Decision support tools

---

### SPRINT 6: Multi-Mine Comparison & Reporting (Weeks 21-24)

**Week 21: Comparison Infrastructure**
- Build multi-mine data aggregation
- Create comparison analytics service
- Implement ranking algorithms
- Build emission intensity calculations
- Create comparison API endpoints
- Add permissions for cross-mine viewing
- Test with multiple mine datasets

**Week 22: Comparison UI**
- Create Comparison page layout
- Build mine ranking table
- Implement comparison charts
- Add filtering and sorting
- Create best performer highlights
- Build peer benchmarking view
- Implement comparison export

**Week 23: Report Generation - Backend**
- Set up PDF generation service (PDFKit)
- Create report templates
- Build CSV export functionality
- Implement report metadata inclusion
- Create scheduled report jobs
- Build report storage system
- Add report email delivery

**Week 24: Report Generation - Frontend**
- Create Reports page
- Build report configuration UI
- Implement report preview
- Add scheduled report setup
- Create report history view
- Build report download functionality
- Add report sharing capabilities

**Sprint 6 Deliverables:**
- ✅ Multi-mine comparison features
- ✅ Comprehensive reporting system
- ✅ PDF and CSV exports
- ✅ Scheduled report generation

---

### SPRINT 7: UI/UX Polish & Testing (Weeks 25-28)

**Week 25: Design System Refinement**
- Implement final glassmorphism design
- Refine color palette and gradients
- Polish all animations
- Ensure consistent spacing and typography
- Mobile responsive refinement
- Dark theme optimization
- Accessibility improvements

**Week 26: Performance Optimization**
- Code splitting and lazy loading
- API response optimization
- Database query optimization
- Implement caching strategies
- Image and asset optimization
- Bundle size reduction
- Lighthouse score improvement

**Week 27: Comprehensive Testing**
- Unit testing (Jest)
- Integration testing (Supertest)
- End-to-end testing (Cypress)
- Load testing (Artillery)
- Security testing
- Cross-browser testing
- Mobile device testing

**Week 28: Bug Fixes & Documentation**
- Fix all identified bugs
- Update API documentation
- Write user manual
- Create developer guide
- Update deployment documentation
- Record demo videos
- Prepare training materials

**Sprint 7 Deliverables:**
- ✅ Polished UI/UX
- ✅ Performance optimizations
- ✅ Comprehensive test coverage
- ✅ Complete documentation

---

### SPRINT 8: Deployment & Launch (Weeks 29-32)

**Week 29: Deployment Setup**
- Configure Netlify for frontend
- Set up Render/Railway for backend
- Deploy ML service
- Configure MongoDB Atlas production
- Set up environment variables
- Configure custom domains
- SSL certificate setup

**Week 30: Production Testing**
- Staging environment testing
- Load testing on production
- Security audit
- Data migration testing
- Backup and recovery testing
- Monitoring setup (Sentry, Datadog)
- Performance baseline establishment

**Week 31: User Acceptance Testing**
- Beta user onboarding
- Collect user feedback
- Fix critical issues
- Performance tuning
- Documentation updates
- Support system setup
- Training session delivery

**Week 32: Launch & Support**
- Production deployment
- Launch announcement
- User onboarding campaign
- Monitor system health
- Address launch issues
- Collect user feedback
- Plan future iterations

**Sprint 8 Deliverables:**
- ✅ Production deployment
- ✅ Monitoring and alerting
- ✅ User training complete
- ✅ Launch successful

---

## 4. IMPLEMENTATION PRIORITIES

### P0 - Must Have (MVP)
1. Authentication system
2. Data entry and storage
3. Emission calculations
4. Basic dashboard
5. Time filtering
6. Data validation

### P1 - Should Have
1. ARIMA forecasting
2. Reduction simulator
3. Enhanced visualizations
4. Report generation (PDF/CSV)
5. Multi-mine support

### P2 - Could Have
1. Multi-mine comparison
2. Scheduled reports
3. Advanced analytics
4. Mobile optimization
5. Offline mode

### P3 - Won't Have (Future)
1. Mobile apps
2. Real-time collaboration
3. Third-party integrations
4. Advanced ML models (beyond ARIMA)
5. Blockchain verification

---

## 5. RISK MITIGATION

### Technical Risks
- **MongoDB Performance**: Implement proper indexing from start
- **ML Service Latency**: Use aggressive caching, async processing
- **Frontend Performance**: Code splitting, lazy loading from Sprint 1
- **Authentication Issues**: Thorough testing, fallback mechanisms

### Resource Risks
- **Development Time**: Buffer time in each sprint
- **Skill Gaps**: Early training on ARIMA, MongoDB aggregation
- **Third-Party Dependencies**: Version locking, regular updates

### Data Risks
- **Data Quality**: Extensive validation, anomaly detection
- **Data Loss**: Automated backups, audit trails
- **Privacy**: Role-based access, data encryption

---

## 6. SUCCESS CRITERIA

### Technical
- [ ] 99.5% uptime during business hours
- [ ] <3 second dashboard load time
- [ ] Zero data loss incidents
- [ ] All tests passing (>80% coverage)
- [ ] Lighthouse score >90

### Business
- [ ] 50 mines onboarded within 6 months
- [ ] 70% weekly active usage
- [ ] 95% data completeness
- [ ] 10% emission reduction in participating mines
- [ ] 100% regulatory compliance

---

**Document Version**: 1.0  
**Last Updated**: February 15, 2026  
**Next Review**: Sprint 1 Completion
