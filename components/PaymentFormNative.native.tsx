import React, { useState } from 'react';
import { Button } from '@rneui/themed';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { View, Text } from 'react-native';

interface PaymentFormNativeProps {
  clientSecret: string;
  amount: number;
  onDeposit: (amount: number) => void;
}

export default function PaymentFormNative({ clientSecret, amount, onDeposit }: PaymentFormNativeProps) {
  const { confirmPayment } = useStripe();
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePayPress = async () => {
    if (!cardDetails?.complete) {
      setMessage('Enter complete card details');
      return;
    }
    setIsProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {},
        },
      });

      if (error) {
        setMessage(error.message || 'Payment failed');
      } else if (paymentIntent) {
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
      <CardField
        postalCodeEnabled={false}
        placeholders={{ number: '4242 4242 4242 4242' }}
        cardStyle={{ backgroundColor: '#FFFFFF' }}
        style={{ width: '100%', height: 50, marginVertical: 30 }}
        onCardChange={(card) => setCardDetails(card)}
      />
      <Button
        title={isProcessing ? 'Processing...' : 'Deposit'}
        onPress={handlePayPress}
        disabled={isProcessing}
      />
      {message && (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={{ color: 'red' }}>{message}</Text>
        </View>
      )}
    </>
  );
}
