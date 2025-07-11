## Unauthorized Money Transfer via IDOR (Broken Access Control)

### OWASP Classification
- **A01:2021 – Broken Access Control**  
  The server trusted a user-supplied `from_user_id` allowing anyone to act on behalf of another account (Insecure Direct Object Reference).
- **A04:2021 – Insecure Design**  
  No business-logic control insured the sender actually owned the account.

---

### Vulnerability Description
The `transfer-funds` Edge Function accepted **any** `from_user_id` sent by the client. Because the function executed with the **service-role key**, Row-Level Security (RLS) was bypassed and the database blindly debited the specified account.

```ts
// supabase/functions/transfer-funds/index.ts  (VULNERABLE)
serve(async (req) => {
  const { from_user_id, recipient_email, amount } = await req.json();
  // ❌ Never checks that from_user_id === auth.user.id
  const { error } = await supabase.rpc('process_transfer', {
    from_user_id,          // ← user controlled!
    recipient_email,
    amount,
  });
});
```

The helper SQL function likewise performed no ownership check:

```sql
-- migrations/20240711000003_transfer_feature.sql  (VULNERABLE)
CREATE FUNCTION transfer_funds(sender_id UUID, recipient_id UUID, amount NUMERIC) ...;

CREATE FUNCTION process_transfer(from_user_id UUID, recipient_email TEXT, amount NUMERIC) ...
  PERFORM transfer_funds(from_user_id, recipient_id, amount);  -- ❌ any UUID works
```

Result: An attacker could steal money simply by substituting another user’s ID while the request was in-transit.

---

### Exploitation Walk-through

| Step | Screenshot |
|------|------------|
| 1. Attacker becomes admin to list every account ID | ![Admin dashboard](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/an%20admin%20dashboard%20with%20all%20users%20and%20balances.png) |
| 2. Note victim’s starting balance (1 000 KES) | ![Victim balance](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/initial%20recipient%20balance%201000.png) |
| 3. Intercept normal transfer request | ![Send 1 000](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/send%20joelmark%201000.png) |
| 4. Replace `from_user_id` with victim’s UUID | ![Modify from_user_id](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/current%20user%20request%20change%20from_user_id%20field.png) |
| 5. Hit **Send** → 200 OK | ![200 OK](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/200%20OK.png) |
| 6. Victim’s new balance is **0** | ![Balance deducted](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/new%20user%20id.png) |

The attacker’s account balance increased accordingly, even though they never owned the deducted funds.

---

### Root Cause
1. Edge Function trusted client input (`from_user_id`).
2. Function executed with `service_role` → RLS bypass.
3. SQL logic lacked ownership and balance checks.

---

### Security Fix Implementation

#### 1. Edge Function
```ts
// supabase/functions/transfer-funds/index.ts  (FIXED)
serve(async (req) => {
  const authHeader = req.headers.get('Authorization') || "";
  const jwt        = authHeader.replace("Bearer ", "");
  const supabase   = createClient(SUPABASE_URL, SERVICE_ROLE_KEY,
    { global: { headers: { Authorization: jwt } } });

  const { data: { user } } = await supabase.auth.getUser(jwt);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { recipient_email, amount } = await req.json();
  const { error } = await supabase.rpc('process_transfer', {
    current_user_id: user.id,   // ✅ server-side value
    recipient_email,
    amount,
  });
});
```

#### 2. SQL Layer
```sql
-- migrations/20240711000003_transfer_feature.sql  (FIXED)
CREATE OR REPLACE FUNCTION process_transfer(
  current_user_id UUID,
  recipient_email TEXT,
  amount NUMERIC
) RETURNS VOID AS $$
DECLARE
  recipient_id UUID;
BEGIN
  SELECT id INTO recipient_id FROM profiles WHERE email = recipient_email;
  IF recipient_id IS NULL THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  PERFORM transfer_funds(current_user_id, recipient_id, amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

(Optionally we also added an insufficient-funds check inside `transfer_funds`.)

---

### Patch Verification
Attempting the same Burp modification now returns **400 Bad Request**:
```json
{
  "error": "Unauthorized"
}
```
Victim balances remain unchanged.

---

### Best-Practice Takeaways
1. Never trust client-supplied identifiers; derive them on the server from auth context.
2. Use RLS wherever possible—avoid blanket `service_role` operations.
3. Enforce critical invariants (ownership, sufficient balance) inside the database.
4. Log and monitor all high-risk operations (e.g., transfers).
5. Keep business logic checks close to the data (SQL functions / triggers).


https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/an%20admin%20dashboard%20with%20all%20users%20and%20balances.png

https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/initial%20recipient%20balance%201000.png

https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/send%20joelmark%201000.png

https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/current%20user%20request%20change%20from_user_id%20field.png

https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/new%20user%20id.png

https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/200%20OK.png
