## Unauthorized Balance Manipulation via Direct Transaction Insert

### Vulnerability Description
The application had a critical security flaw that allowed users to arbitrarily increase their account balance by directly inserting fake transaction records into the database.

**OWASP Top 10 Category**: 
- **A01:2021 - Broken Access Control**: Users were able to perform actions (inserting transactions) that they should not be allowed to perform. This category involves failures to enforce access controls, allowing attackers to access sensitive data or perform unauthorized actions.
- **A05:2021 - Security Misconfiguration**: The database trigger was configured to update balances without validating transaction status, leading to improper balance calculations. This category involves misconfigurations that can lead to security vulnerabilities, such as inadequate security settings or poorly configured security controls.

### Vulnerable Backend Setup
The database trigger updates balances on every insert without validating transaction status:

```sql
-- migrations/20240709000001_transactions.sql
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'deposit' THEN
    UPDATE profiles
    SET balance = balance + NEW.amount
    WHERE id = NEW.user_id;
  ELSIF NEW.type = 'withdrawal' THEN
    UPDATE profiles
    SET balance = balance - NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_balance_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_balance();
```

### Exploitation Steps

#### Step 1: User starts with zero balance
![Initial balance on app UI](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/on%20app%20UI%20user%20initial%20balance%200.png)
![Initial balance in database](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/db%20initial%20balance%20zero.png)

#### Step 2: Fill username field and prepare for interception
![Fill username field](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/fill%20new%20username%20field.png)

#### Step 3: Modify request to target transactions endpoint
![Modify request](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/modify%20request%20to%20point%20to%20rest%20v1%20transactions%20and%20modify%20content%20length.png)

#### Step 4: Insert fake transaction payload
![JSON payload](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/json%20payload%20with%20amout%2010K.png)

#### Step 5: Receive 201 Created response
![201 response](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/201%20response.png)

#### Step 6: Verify new balance on app UI
![App UI new balance](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/app%20UI%20new%20balance%2010K.png)

#### Step 7: Verify new balance in database
![Database new balance](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/db%20new%20user%20balance%2010K.png)

### Why This Works
1. The RLS policy only checks `auth.uid() = user_id` (which passes)
2. The database trigger updates balances on every insert
3. No validation exists for transaction status or amount
4. No payment verification occurs for 'completed' transactions

### Fix Recommendations
```sql
-- Revoke direct INSERT privileges
REVOKE INSERT ON transactions FROM authenticated;

-- Modify trigger to require valid status
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE profiles 
    SET balance = balance + 
      CASE NEW.type
        WHEN 'deposit' THEN NEW.amount
        WHEN 'withdrawal' THEN -NEW.amount
      END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Security Patch Verification
![403 Forbidden after fix](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/403%20forbinned%20response%20after%20applying%20security%20fix.png)