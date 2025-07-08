import React, { useState } from 'react';
import { Button } from '@rneui/themed';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { View } from 'react-native';
import { Text } from 'react-native';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onDeposit: (amount: number) => void;
}

export default function PaymentForm({ clientSecret, amount, onDeposit }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Validate card elements FIRST
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message!);
        setIsProcessing(false);
        return;
      }

      // Then confirm payment
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setMessage(result.error.message || 'Payment failed');
      } else if (result.paymentIntent) {
        setMessage('Payment successful!');
        onDeposit(amount);
      }
    } catch (err) {
      setMessage('An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <PaymentElement />
      <Button 
        title={isProcessing ? 'Processing...' : 'Deposit'} 
        onPress={handleSubmit} 
        disabled={isProcessing || !stripe || !elements}
      />
      {message && (
        <View style={{marginTop: 10, alignItems: 'center'}}>
          <Text style={{color: 'red'}}>{message}</Text>
        </View>
      )}
    </>
  );
}
