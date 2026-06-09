# FEPMS - MoHCC Front-End Payment Management System

## Overview

The FEPMS (Front-End Payment Management System) is a comprehensive Vite-based React application with a PHP API backend, designed to streamline government healthcare worker payments and beneficiary management in Zimbabwe. The system provides role-based dashboards for Finance Officers, Provincial Officers, HR Custodians, and National Administrators, all backed by a real-time MySQL database.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite 7.3.5
- **Backend API**: PHP 8.2 (RESTful architecture)
- **Database**: MySQL 8.0 (PDO-based communication)
- **Styling**: Tailwind CSS 3.4.19 + MoHCC Brand Theme
- **Data Viz**: Recharts 2.15.4
- **Auth**: JWT (JSON Web Tokens) with Secure Hashing

## Project Structure

```
├── frontend/           # React application
│   ├── src/
│   │   ├── pages/      # Dashboards and feature modules
│   │   ├── components/ # Branded UI components
│   │   ├── hooks/      # Auth and data-fetching hooks
│   │   └── lib/        # API client and core utilities
├── backend/
│   ├── php-api/        # PHP API implementation
│   │   ├── auth/       # Login and session endpoints
│   │   ├── config.php  # DB and CORS configuration
│   │   └── index.php   # API router
│   └── database/       # SQL schema and seed data
```

## Key Features

### 1. PHP-Powered Data Transmission
- Efficient data flow between the React frontend and MySQL database.
- Paginated results for large beneficiary datasets.
- Secure session management using JWT.

### 2. Enhanced Finance Dashboard
- Real-time disbursement tracking from MySQL batches.
- Daily transaction trends with area charts.
- Province-based payment distribution (pie charts).
- Recent payment batches with live status tracking.

### 3. Provincial Officer Dashboard
- Real-time submission and certification rates.
- District-based distribution charts.
- Current payment cycle progress tracking.

### 4. HR/Custodian Dashboard
- Comprehensive VHW database management.
- Data verification and integrity checking.
- Status distribution (Active/Inactive/Exited) for all health workers.

### 5. National Administrator Dashboard
- System-wide performance metrics.
- Exception/escalation management queue.
- National-level payment flow analysis.
- **Reconciliation**: Certified vs. paid reconciliation with variance analysis
- **Audit Trail**: Complete activity logging and user action tracking
- **Reports**: Exportable analytics and summary reports
- **Users**: User account management and role assignment

## Dashboard Enhancements

Each dashboard now includes:

### Real-Time Statistics Widget
- Live metrics with percentage changes
- Color-coded status indicators
- Last updated timestamp
- Trend indicators (trending up/down/flat)

### Interactive Charts
- Area charts for transaction volumes
- Bar charts for province comparisons
- Line charts for variance trends
- Pie charts for distribution analysis
- Responsive design for mobile devices

## Authentication & Authorization

The system implements localStorage-based authentication with role-based access control:

- **Finance Officer**: Payment batch management, reconciliation, reports
- **Provincial Officer**: Payment list creation and submission
- **HR Custodian**: Beneficiary management and data verification
- **National Admin**: System administration and auditing

## Development

### Installation
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```
Runs on http://localhost:3000

### Build
```bash
pnpm build
```

### Type Checking
```bash
pnpm tsc --noEmit
```

### Linting
```bash
pnpm lint
```

## Data Management

The application uses localStorage for data persistence with the following data structures:

- **Users**: Authentication and role management
- **Beneficiaries**: Individual beneficiary records
- **Payment Lists**: Grouped beneficiary lists by district/cycle
- **Payment Batches**: Aggregated batches for execution
- **Audit Logs**: Complete activity tracking
- **Exceptions**: System exceptions requiring attention

## Styling & Design

The application uses a cohesive design system:

- **Primary Color**: Teal (#0d9488)
- **Secondary Colors**: Navy (#1a365d), Gray palette
- **Typography**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Animations**: Fade-in effects, smooth transitions

## Component Library

All UI components use shadcn/ui with Radix UI primitives:
- Buttons, cards, tables
- Dialogs, dropdowns, sheets
- Forms, inputs, selects
- Badges, alerts, progress indicators

## Testing & Quality

- TypeScript strict mode enabled
- No unused imports or variables
- Comprehensive type definitions
- ESLint configuration for code quality

## Deployment

The application is ready for deployment to Vercel or any static hosting provider:

1. Build the application: `pnpm build`
2. Deploy the `dist` folder
3. Configure environment variables as needed
4. Set up HTTPS for production

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Responsive design for mobile devices

## Performance Optimizations

- Code splitting with React.lazy
- Component memoization
- Efficient re-rendering with hooks
- Optimized chart rendering with Recharts

## Future Enhancements

- Backend API integration
- Real database connectivity
- Email notifications
- SMS alerts
- Advanced reporting
- Batch processing automation
- Machine learning for anomaly detection

## Support & Documentation

For questions or issues, refer to:
- Component storybook (if available)
- Type definitions for API contracts
- Inline code comments for complex logic
- README files in feature directories

---

**Built with React, TypeScript, and Vite**  
**Last Updated**: June 2, 2026
