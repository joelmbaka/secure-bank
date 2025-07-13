# Benchmark for Secure Mobile Banking App Demo

A comprehensive demonstration of secure and vulnerable mobile banking implementations, designed to educate developers on common security pitfalls in financial applications.

## Overview

This project showcases two parallel implementations of a mobile banking backend:
- **Secure Implementation**: (this project) Follows security best practices
- **Vulnerable Implementation**: ( project on https://github.com/joelmbaka/vulnerable-bank) Intentionally contains common security flaws for educational purposes. Use it alongs with this project to test your skills.

The application is built with:
- **Frontend**: React Native (Expo)
- **Backend**: Node.js with Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Integration
- **Security Testing**: Burp Suite

## Key Security Features

### 1. Authentication & Authorization
- JWT-based authentication with Supabase Auth
- Row-Level Security (RLS) policies for data access control
- Role-based access control (RBAC) for admin functions
- Secure session management with token refresh

### 2. Security Measures
- **Admin Escalation Prevention**:
  - `prevent_admin_escalation()` trigger prevents privilege escalation
  - Admin actions require existing admin privileges
  - Secure RLS policies for admin operations

- **Financial Transaction Security**:
  - Server-side balance validation
  - Transaction history with immutable records
  - Double-entry bookkeeping pattern for transfers

- **Data Protection**:
  - Row-level security for all sensitive tables
  - Sensitive operations require explicit authorization
  - Secure storage of credentials using environment variables

## Vulnerabilities Demonstrated (and Their Fixes)

### 1. Privilege Escalation via Insecure Profile Update
- **Vulnerability**: Attackers could escalate privileges by modifying `is_admin` flag
- **Fix**: Implemented `prevent_admin_escalation()` trigger and proper RLS policies

### 2. IDOR in Money Transfers
- **Vulnerability**: Unauthorized fund movement by forging `from_user_id`
- **Fix**: Server-side user ID derivation and ownership validation

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
