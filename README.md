# Secure Mobile Banking Application

A secure, production-ready mobile banking application built with React Native and Supabase, implementing industry-standard security practices for financial applications.

## 🚀 Features

- **User Authentication**
  - Secure sign-up and sign-in with email/password
  - Session management with JWT
  - Password reset functionality

- **Banking Operations**
  - View account balance
  - Deposit funds (with Stripe integration)
  - Send money to other users
  - Track transaction history
  - Savings account management

- **Admin Dashboard**
  - User management
  - Transaction monitoring
  - System analytics

- **Security Features**
  - Row-Level Security (RLS) policies
  - Role-based access control (RBAC)
  - Secure token handling
  - Protected API routes
  - Input validation
  - Secure storage of sensitive data

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Integration
- **State Management**: React Context API
- **UI Components**: React Native Elements UI
- **Environment Management**: react-native-dotenv

## 📱 Screens

1. **Authentication**
   - Sign In
   - Sign Up
   - Password Recovery

2. **User Dashboard**
   - Account Overview
   - Quick Actions (Deposit, Send, Save)
   - Recent Transactions

3. **Banking**
   - Deposit Funds (Stripe)
   - Send Money
   - Transaction History
   - Savings Account

4. **Profile**
   - Account Settings
   - Personal Information
   - Security Settings

5. **Admin Panel**
   - User Management
   - Transaction Monitoring
   - System Analytics

## 🔒 Security Implementation

### Authentication & Authorization
- JWT-based authentication with Supabase Auth
- Secure session management with token refresh
- Role-based access control (RBAC)
- Row-Level Security (RLS) policies

### Data Protection
- Encrypted data at rest and in transit
- Secure storage of sensitive information
- Input validation and sanitization
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)

### Financial Security
- Server-side balance validation
- Audit logging for all transactions
- Rate limiting on sensitive endpoints
- Transaction verification mechanisms

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Stripe account (for payment processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joelmbaka/secure-bank.git
   cd secure-bank
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. Start the development server:
   ```bash
   expo start
   ```

5. Run on your preferred platform:
   ```bash
   # For Android
   expo run:android
   
   # For iOS
   expo run:ios
   
   # For web
   expo start --web
   ```

## 🧪 Testing the Application

### Unit Tests
```bash
npm test
```

### Security Testing
1. Run static code analysis
2. Perform penetration testing
3. Check for dependency vulnerabilities:
   ```bash
   npm audit
   ```

## 📚 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Native Security](https://reactnative.dev/docs/security)
- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Vulnerable Bank Implementation](https://github.com/joelmbaka/vulnerable-bank) - An intentionally vulnerable version of this application for educational purposes

### 3. Balance Inflation via Direct Transaction Insert
- **Vulnerability**: Users could inject fake deposits bypassing business logic
- **Fix**: Revoked direct INSERT rights and added transaction validation triggers

## Project Structure

```
bank/
├── components/           # React Native components
├── lib/
│   └── supabase.ts      # Supabase client configuration
├── supabase/
│   └── migrations/      # Database schema and RLS policies
├── App.tsx              # Main application component
└── package.json         # Dependencies and scripts
```

## Setup Instructions

1. **Prerequisites**:
   - Node.js 16+
   - Expo CLI
   - Supabase account
   - Stripe account

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_key
   ```

4. **Database Setup**:
   - Apply the SQL migrations in `supabase/migrations/`
   - Enable Row Level Security on all tables
   - Set up the required triggers and functions

## Security Best Practices Demonstrated

1. **Input Validation**:
   - All user inputs are validated both client and server-side
   - Parameterized queries to prevent SQL injection

2. **Authentication**:
   - Secure token handling
   - Session timeout and refresh mechanisms
   - Secure password policies

3. **Data Protection**:
   - Principle of least privilege for database access
   - Sensitive data encryption at rest and in transit
   - Secure audit logging

## Educational Value

This project serves as an educational resource to:
- Understand common security vulnerabilities in financial applications
- Learn secure coding practices
- Demonstrate real-world attack scenarios and their mitigations
- Provide hands-on experience with security testing tools

## License

This project is for educational purposes only. Use responsibly and always follow security best practices in production environments.
