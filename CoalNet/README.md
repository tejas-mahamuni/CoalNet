# CoalNet Zero - Complete Project Documentation

## Document Package Contents

This package contains comprehensive documentation for the CoalNet Zero platform - an AI-driven carbon emission intelligence system for Indian coal mines.

### 📄 Included Documents

1. **CoalNet_Zero_PRD.docx** (Product Requirements Document)
   - Executive summary and vision
   - Problem statement and objectives
   - User personas and stories
   - Functional and non-functional requirements
   - Success metrics and KPIs
   
2. **CoalNet_Zero_DRD.docx** (Design Requirements Document)
   - System architecture overview
   - Database schema design
   - API specifications
   - UI/UX design system
   - Security architecture
   
3. **PROJECT_STRUCTURE_AND_ROADMAP.md**
   - Complete folder structure for all components
   - Technology stack details
   - 8-sprint implementation plan (32 weeks)
   - Risk mitigation strategies
   - Success criteria

---

## Project Overview

**CoalNet Zero** is a full-stack web application designed to help Indian coal mines:
- 📊 Track carbon emissions in real-time
- 🤖 Forecast future emissions using AI (ARIMA)
- 🎯 Simulate reduction pathways
- 📈 Compare performance across multiple mines
- 📑 Generate compliance-ready reports

### Technology Stack

**Frontend**
- React 18+ with Vite
- Tailwind CSS (Glassmorphism design)
- Recharts for visualizations
- Framer Motion for animations
- Firebase Authentication

**Backend**
- Node.js with Express
- MongoDB Atlas
- Mongoose ODM
- JWT authentication

**ML Service**
- Python 3.10+ with Flask
- Statsmodels (ARIMA)
- Pandas & NumPy

**Deployment**
- Frontend: Netlify
- Backend/ML: Render or Railway
- Database: MongoDB Atlas

---

## Implementation Timeline

### Sprint Breakdown (32 weeks total)

**Sprint 1 (Weeks 1-4)**: Foundation & Authentication  
**Sprint 2 (Weeks 5-8)**: Data Management & Basic Dashboard  
**Sprint 3 (Weeks 9-12)**: Time Filtering & Enhanced Visualizations  
**Sprint 4 (Weeks 13-16)**: AI Forecasting  
**Sprint 5 (Weeks 17-20)**: Reduction Pathway Simulator  
**Sprint 6 (Weeks 21-24)**: Multi-Mine Comparison & Reporting  
**Sprint 7 (Weeks 25-28)**: UI/UX Polish & Testing  
**Sprint 8 (Weeks 29-32)**: Deployment & Launch

---

## Key Features

### Core Functionality
- ✅ Google Sign-In authentication
- ✅ Daily operational data entry
- ✅ Automatic emission calculations (IPCC-compliant)
- ✅ Scope 1, 2, 3 classification
- ✅ Real-time dashboards with multiple chart types
- ✅ Flexible date range filtering

### AI & Analytics
- 🤖 ARIMA-based emission forecasting (7-30 day predictions)
- 📊 Activity-wise emission breakdown
- 📈 Trend analysis and anomaly detection
- 🔄 Year-over-year comparisons

### Decision Support
- 🎛️ Reduction pathway simulator
- ⚡ EV adoption impact modeling
- 🌱 Renewable energy scenario planning
- 💨 Methane capture optimization

### Reporting
- 📄 PDF report generation
- 📊 CSV data exports
- 📅 Scheduled reports
- 🏆 Mine performance rankings

---

## Database Schema

### Core Collections

**emissions**
- Stores daily operational data and calculated emissions
- Fields: mine_id, date, fuel_used, electricity_used, explosives_used, transport_fuel_used, methane_emission, calculated emission values, scopes, totals
- Index: Compound index on {mine_id, date}

**users**
- User authentication and authorization
- Fields: uid, email, name, role, assigned_mines

**mines**
- Mine metadata and configuration
- Fields: mine_id, name, location, capacity, contact_info

**forecasts**
- Cached ML predictions
- Fields: mine_id, forecast_data, model_params, expires_at
- TTL: 24 hours

**emission_factors**
- IPCC emission factors
- Fields: factor_type, value, unit, source

---

## API Endpoints Summary

### Authentication
- `POST /api/v1/auth/verify` - Verify Firebase token
- `GET /api/v1/auth/profile` - Get user profile

### Emissions
- `POST /api/v1/emissions` - Create emission record
- `GET /api/v1/emissions/:mine_id` - Get emissions with date filters
- `PUT /api/v1/emissions/:id` - Update record
- `POST /api/v1/emissions/bulk` - CSV bulk upload

### Analytics
- `GET /api/v1/analytics/summary/:mine_id` - Aggregated stats
- `GET /api/v1/analytics/trends/:mine_id` - Time-series data
- `GET /api/v1/analytics/breakdown/:mine_id` - Activity breakdown
- `GET /api/v1/analytics/comparison` - Multi-mine comparison

### Forecasting
- `POST /api/v1/forecast/:mine_id` - Generate forecast
- `GET /api/v1/forecast/:mine_id` - Get cached forecast

### Simulation
- `POST /api/v1/simulate/reduction` - Calculate scenario
- `POST /api/v1/simulate/scenarios` - Save scenario

### Reports
- `POST /api/v1/reports/generate` - Generate PDF/CSV
- `GET /api/v1/reports/:report_id` - Download report

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Viewer** | Read-only dashboard and reports access |
| **Operator** | Create and edit emission data |
| **Manager** | Full access including forecasting, simulation, reports |
| **Admin** | System-wide access, user management, all mines |

---

## Success Metrics

### User Adoption
- Target: 50 mines onboarded within 6 months
- Target: 70% weekly active usage
- Target: >5 minute average session duration

### Data Quality
- Target: 95% data completeness
- Target: <5% validation errors

### Technical Performance
- Target: 99.5% uptime
- Target: <3 second dashboard load
- Target: Zero data loss

### Business Impact
- Target: 10% emission reduction within 12 months
- Target: 100% regulatory compliance
- Target: 50% reduction in manual calculation time

---

## Strategic Alignment

This project directly supports:
- 🇮🇳 **India's Net Zero 2070 Commitment**
- 🌍 **SDG 13: Climate Action**
- 💻 **Digital India Initiative**

---

## Next Steps

1. Review all three documents thoroughly
2. Set up development environment (Sprint 1, Week 1)
3. Initialize Git repository and project structure
4. Begin Sprint 1: Foundation & Authentication
5. Schedule weekly sprint reviews and retrospectives

---

## Document Control

- **PRD Version**: 1.0
- **DRD Version**: 1.0
- **Roadmap Version**: 1.0
- **Created**: February 15, 2026
- **Status**: Ready for Implementation

---

## Contact & Support

For questions about this documentation or the CoalNet Zero project:
- Review the detailed specifications in each document
- Refer to the sprint plan for implementation guidance
- Consult the folder structure for development organization

**Ready to build a sustainable future for Indian coal mining! 🌱⛏️**
