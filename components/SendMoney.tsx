import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { supabase } from '../lib/supabase';

type Props = {
  onSend: () => void;
  onSendSuccess: () => void;
};

export default function SendMoney({ onSend, onSendSuccess }: Props) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage('Please sign in first');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    if (!recipientEmail) {
      setMessage('Please enter recipient email');
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      const { error } = await supabase.functions.invoke('transfer-funds', {
        body: JSON.stringify({
          from_user_id: user.id,
          recipient_email: recipientEmail,
          amount: amountNum,
        }),
      });

      if (error) throw error;

      setMessage('Money sent successfully!');
      onSendSuccess();
      onSend();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setMessage('Failed to send money: ' + errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Recipient Email"
        value={recipientEmail}
        onChangeText={setRecipientEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input
        label="Amount"
        value={amount}
        onChangeText={(text) => {
          // Only allow numbers and decimal points
          const cleanedText = text.replace(/[^0-9.]/g, '');
          setAmount(cleanedText);
        }}
        keyboardType="numeric"
        placeholder="0.00"
      />
      <Button
        title={isSending ? 'Sending...' : 'Send Money'}
        onPress={handleSend}
        disabled={isSending}
      />
      {message && (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
});
