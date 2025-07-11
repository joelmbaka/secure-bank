-- Add money transfer functionality

-- Helper function to transfer funds between accounts
CREATE OR REPLACE FUNCTION transfer_funds(
    sender_id UUID,
    recipient_id UUID,
    amount NUMERIC
) RETURNS VOID AS $$
BEGIN
    -- Update sender balance (no balance check - vulnerable to overdraft)
    UPDATE profiles 
    SET balance = balance - amount 
    WHERE id = sender_id;
    
    -- Update recipient balance
    UPDATE profiles 
    SET balance = balance + amount 
    WHERE id = recipient_id;
    
    -- Record transaction for sender
    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
        sender_id, 
        'transfer', 
        -amount, 
        'KES', 
        'completed',
        jsonb_build_object('recipient', recipient_id)
    );
    
    -- Record transaction for recipient
    INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
    VALUES (
        recipient_id, 
        'transfer', 
        amount, 
        'KES', 
        'completed',
        jsonb_build_object('sender', sender_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- function that trusts client input without validation
CREATE OR REPLACE FUNCTION process_transfer(
    current_user_id UUID,
    recipient_email TEXT,
    amount NUMERIC
) RETURNS VOID AS $$
DECLARE
    recipient_id UUID;
BEGIN
    -- Look up recipient by email
    SELECT id INTO recipient_id FROM public.profiles WHERE email = recipient_email;
    
    IF recipient_id IS NULL THEN
        RAISE EXCEPTION 'Recipient not found';
    END IF;
    
    -- Transfer funds
    PERFORM transfer_funds(current_user_id, recipient_id, amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION transfer_funds(UUID, UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION process_transfer(UUID, TEXT, NUMERIC) TO service_role;
