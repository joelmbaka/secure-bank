import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';
import PaymentFormNative from './PaymentFormNative';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type Props = {
  onDeposit: (amount: number) => void;
  onDepositSuccess: () => void;
};

export default function Deposit({ onDeposit, onDepositSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreatePaymentIntent = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('Create-intent aborted: user is null');
      setMessage('Please sign in first');
      return;
    }

    // Convert amount to number and validate
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage('Please enter a valid deposit amount');
      return;
    }

    setIsCreatingIntent(true);
    setMessage(null);

    try {
      // Create payment intent via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('process-deposit', {
        body: JSON.stringify({
          amount: amountNum,
          currency: 'usd',
          user_id: user.id,
        }),
      });

      if (error || !data) {
        throw error ?? new Error('Failed to create payment intent');
      }

      // data is typed as unknown, cast to expected shape
      const { clientSecret } = data as { clientSecret: string };
      setClientSecret(clientSecret);
    } catch (err) {
      setMessage('Failed to create payment intent. Please try again.');
      console.error(err);
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleSuccessfulPayment = (amountNum: number) => {
    setMessage('Payment successful!');
    onDeposit(amountNum);
    onDepositSuccess();
    setAmount('');
    setClientSecret(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { flex: 1 }]}
    >
      <View style={styles.form}>
        <Input
          label="Deposit Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => {
            // Only allow numbers and decimal points
            const cleanedText = text.replace(/[^0-9.]/g, '');
            setAmount(cleanedText);
          }}
          placeholder="0.00"
        />
        {clientSecret ? (
          Platform.OS === 'web' ? (
            <Elements stripe={stripePromise} options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0d6efd',
                }
              },
            }}>
              <PaymentForm 
                clientSecret={clientSecret} 
                amount={parseFloat(amount)} 
                onDeposit={handleSuccessfulPayment} 
              />
            </Elements>
          ) : (
            <PaymentFormNative 
              clientSecret={clientSecret} 
              amount={parseFloat(amount)} 
              onDeposit={handleSuccessfulPayment} 
            />
          )
        ) : (
          <Button 
            title={isCreatingIntent ? 'Creating payment...' : 'Create Payment'} 
            onPress={handleCreatePaymentIntent} 
            disabled={isCreatingIntent || !amount}
          />
        )}
        {message && (
          <View style={{marginTop: 10, alignItems: 'center'}}>
            <Text style={{color: 'red'}}>{message}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '80%',
  },
});
