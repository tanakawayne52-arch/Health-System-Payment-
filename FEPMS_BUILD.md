# FEPMS - MoHCC Finance & Education Payment Management System

## Overview

The FEPMS (Finance & Education Payment Management System) is a comprehensive Vite-based React application designed to streamline government healthcare worker payments and beneficiary management in Zimbabwe. The system provides role-based dashboards for Finance Officers, Provincial Officers, HR Custodians, and National Administrators.

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.3.5 with React plugin
- **Styling**: Tailwind CSS 3.4.19
- **Charts & Visualization**: Recharts 2.15.4
- **UI Components**: shadcn/ui components with Radix UI
- **Routing**: React Router 7.16.0
- **Forms**: React Hook Form with Zod validation
- **Toast Notifications**: Sonner
- **Icons**: Lucide React

## Project Structure

```
src/
├── pages/              # Feature pages and dashboards
│   ├── FinanceDashboard.tsx      # Finance officer dashboard with real-time stats
│   ├── ProvincialDashboard.tsx   # Provincial officer dashboard
│   ├── HRDashboard.tsx           # HR/Custodian dashboard
│   ├── AdminDashboard.tsx        # System administrator dashboard
│   ├── BeneficiariesPage.tsx     # Beneficiary management
│   ├── PaymentListsPage.tsx      # Payment list management
│   ├── PaymentBatchesPage.tsx    # Payment batch operations
│   ├── ReconciliationPage.tsx    # Reconciliation & verification
│   ├── AuditTrailPage.tsx        # Audit logging & tracking
│   ├── ReportsPage.tsx           # Reporting dashboard
│   ├── UsersPage.tsx             # User management
│   └── LoginPage.tsx             # Authentication
├── components/         # Reusable components
│   ├── AppLayout.tsx             # Main layout wrapper
│   ├── StatCard.tsx              # Statistics card component
│   ├── Badge.tsx                 # Status badge component
│   ├── RealTimeStatsWidget.tsx   # Live statistics widget
│   ├── TransactionAnalytics.tsx  # Analytics & charts
│   ├── NotificationCenter.tsx    # User notifications
│   ├── BatchProgressTracker.tsx  # Batch progress visualization
│   ├── ExportReports.tsx         # Report export functionality
│   └── ui/                       # shadcn/ui component library
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx               # Authentication management
│   ├── useToast.tsx              # Toast notification system
│   └── use-mobile.tsx            # Mobile detection
├── data/               # Data management & seeding
│   └── seed.ts                   # Sample data & localStorage
├── types/              # TypeScript type definitions
│   └── index.ts                  # Global type definitions
├── lib/                # Utility functions
│   └── utils.ts                  # Common utilities
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Key Features

### 1. Enhanced Finance Dashboard
- Real-time disbursement statistics with live updates
- Daily transaction trends with area charts
- Province-based payment distribution (pie charts)
- Recent payment batches with status tracking
- Validation queue for pending lists
- Batch pipeline visualization
- Reconciliation summary with variance tracking

### 2. Provincial Officer Dashboard
- Active payment lists management
- Certified lists tracking
- Beneficiary statistics by district
- District-based distribution charts
- Current payment cycle progress
- Submission deadline tracking

### 3. HR/Custodian Dashboard
- Beneficiary database management
- Status distribution (Active/Inactive/Exited)
- Data verification and integrity checking
- Duplicate detection and alerts
- Recent additions and audit tracking
- Bulk import functionality

### 4. National Administrator Dashboard
- System-wide overview
- Active user sessions monitoring
- Audit event tracking
- Exception/escalation management
- Province-by-province batch submission analysis
- System performance metrics

### 5. Feature Pages
- **Beneficiaries**: Full CRUD operations with search and filtering
- **Payment Lists**: Create, submit, and certify payment lists
- **Payment Batches**: Batch creation, validation, and execution
- **Payment Cycles**: Cycle management and scheduling
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
