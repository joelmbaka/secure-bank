## Privilege Escalation Vulnerability via Insecure Profile Update

### Vulnerability Description
The application had two critical security flaws that allowed privilege escalation:
1. **Frontend Logic**: The app directly used the `is_admin` database field to determine admin privileges
2. **Backend Policy**: No restrictions prevented users from modifying the `is_admin` field

### Vulnerable Frontend Code
The React Native app directly checks the `is_admin` field to determine admin status:

```tsx
// components/Menu.tsx
// Source: https://github.com/joelmbaka/vulnerable-bank/blob/main/components/Menu.tsx
{isAdmin && ( // ← This boolean comes directly from the database
  <Button
    type={current === 'admin' ? 'solid' : 'outline'}
    title="Admin"
    onPress={() => navigate('admin')}
  />
)}
```

```tsx
// components/Account.tsx
// Source: https://github.com/joelmbaka/vulnerable-bank/blob/main/components/Account.tsx
const { data } = await supabase
  .from('profiles')
  .select(`username, website, avatar_url, is_admin`) // ← Fetching is_admin
  .eq('id', session?.user.id)
  .single();

// Then passes is_admin to Menu component
<Menu isAdmin={data?.is_admin} />
```

### Vulnerable Backend Setup
The initial RLS policy allowed unrestricted updates:

```sql
-- migrations/20240709000000_initial_schema.sql
-- Source: https://github.com/joelmbaka/vulnerable-bank/blob/main/migrations/20240709000000_initial_schema.sql
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING (auth.uid() = id); -- No field restrictions!
```

### Exploitation Steps

#### Step 1: User starts as non-admin
![User is not an admin](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/user%20mbakajoe26%20is%20not%20an%20admin.png)
- The user `mbakajoe26` has no admin privileges
- Admin dashboard is not visible in the app

#### Step 2: Fill username field and prepare for interception
![Fill username field](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/fill%20new%20username%20field.png)
- Navigate to profile page
- Enter a new username (e.g. "attacker")
- Prepare to intercept the request with Burp Suite

#### Step 3: Intercept request with Burp Suite
![Intercept request](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/intercept%20the%20request%20in%20Burp%20and%20send%20to%20repeater.png)
- Start Burp Suite proxy
- Click "Update" button to send request
- Capture the request in Burp Proxy
- Right-click and "Send to Repeater" for modification

#### Step 4: Add is_admin=true field
![Add is_admin field](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/add%20a%20new%20field%2C%20is_admin%3Dtrue.png)
- In Burp Repeater, locate the JSON body
- Add `"is_admin": true` field
- Note: The Content-Length will now be incorrect

#### Step 5: Modify Content-Length
![Modify Content-Length](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/modify%20content%20length.png)
- Recalculate the new body length (151 bytes)
- Update the `Content-Length` header to match
- **Click "Send"** to execute the modified request

#### Step 6: Receive 200 OK response
![200 OK response](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/we%20get%20a%20200%20OK%20response.png)
- **Expected:** Server returns 200 OK status
- The response shows the updated profile including `"is_admin": true`

#### Step 7: Verify admin status updated
![Admin status set](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/the%20new%20value%20of%20is_admin%20has%20been%20set%20to%20true.png)
- Refresh the profile page
- The `is_admin` field now shows `true`
- The app will now render admin features

#### Step 8: Access admin dashboard
![Access admin dashboard](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/access%20to%20admin%20dashbard.png)
- Navigate to the admin dashboard
- View all user accounts and sensitive data

#### Step 9: Initial menu tabs
![Initial menu tabs](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/initially%2C%20we%20only%20had%203%20menu%20tabs.png)
- Before exploit: Only 3 menu tabs visible

#### Step 10: Menu tabs after exploit
![Menu tabs after exploit](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/4%20menus%20afgter%20exploit.png)
- After exploit: 4th "Admin" tab appears

### Security Fix Implementation
We implemented a PostgreSQL trigger to prevent unauthorized admin changes:

```sql
-- migrations/20240709000000_initial_schema.sql
CREATE OR REPLACE FUNCTION public.prevent_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin <> OLD.is_admin AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin status can only be changed by administrators';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_admin_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_escalation();
```

### Response After Enforcing RLS

After implementing the fix, any attempt to escalate privilege by updating the `is_admin` field will be blocked by the RLS policy. The server now returns a 42501 error:

```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy (USING expression) for table \"profiles\""
}
```

![Response after enforcing RLS](https://oqdmvh61m9qj3x98.public.blob.vercel-storage.com/response%20after%20enforcing%20RLS.png)

### OWASP Classification
**Primary Category:** [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)  
**Secondary Category:** [A07:2021 - Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)

### Best Practices Added
1. Implemented server-side admin status validation
2. Added audit logging for admin status changes
3. Enforced principle of least privilege in RLS policies
4. Implemented security triggers instead of relying on application logic
