import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, FlatList, Modal, InteractionManager } from 'react-native';
import { Button, Card, ListItem, Input } from '@rneui/themed';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type SavingsProduct = {
  id: string;
  name: string;
  demographic: string;
  annual_interest_pct: number;
  term_months: number;
  min_deposit: number;
};

type UserSaving = {
  id: string;
  principal: number;
  starts_at: string;
  status: string;
  maturity_at: string;
  interest_accrued: number;
  savings_product: {
    name: string;
    annual_interest_pct: number;
    term_months: number;
  };
};

type Props = {
  session: Session;
  onBack: () => void;
  onRefresh: () => void;
  balance: number;
};

export default function Savings({ session, onBack, onRefresh, balance }: Props) {
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [savings, setSavings] = useState<UserSaving[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching savings products');
      const { data, error } = await supabase
        .from('savings_products')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching savings products:', error);
        throw error;
      }
      console.log('Savings products data:', data);
      setProducts(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSavings = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching user savings for user:', session.user?.id);
      const { data, error } = await supabase
        .from('user_savings')
        .select(`
          id,
          principal,
          starts_at,
          status,
          maturity_at,
          interest_accrued,
          savings_product: savings_products (name, annual_interest_pct, term_months)
        `);
      
      if (error) {
        console.error('Error fetching user savings:', error);
        throw error;
      }
      console.log('User savings data:', data);
      setSavings(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [session.user?.id]);

  useEffect(() => {
    fetchProducts();
    fetchSavings();
  }, [fetchProducts, fetchSavings]);

  const handleOpenSavings = async (productId: string, amount: number) => {
    setLoading(true);
    try {
      console.log('Attempting to create savings account with:', { 
        productId, 
        amount,
        userId: session.user.id 
      });
      
      const { error } = await supabase.rpc('create_savings', {
        p_user_id: session.user.id,
        p_product_id: productId,
        p_amount: amount,
      });

      if (error) throw error;
      
      // Close modal first
      setShowDepositModal(false);
      
      // Use InteractionManager to ensure alert shows after animations
      InteractionManager.runAfterInteractions(() => {
        Alert.alert(
          'Success', 
          `Savings account opened with KES ${amount.toFixed(2)}`,
          [{
            text: 'OK',
            onPress: () => {
              fetchSavings();
              onRefresh();
            }
          }]
        );
      });
      
    } catch (error) {
      console.error('Caught error:', error);
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (savingId: string) => {
    setLoading(true);
    try {
      console.log('Withdrawing savings for user:', session.user.id);
      const { error } = await supabase.rpc('withdraw_savings', {
        p_savings_id: savingId
      });
      
      if (error) {
        console.error('Error withdrawing savings:', error);
        throw error;
      }
      
      console.log('Savings withdrawn successfully');
      Alert.alert('Success', 'Savings withdrawn successfully');
      fetchSavings();
      onRefresh(); // Refresh balance
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDepositModal = (product: SavingsProduct) => {
    setSelectedProduct(product);
    setDepositAmount(product.min_deposit.toString());
    setShowDepositModal(true);
  };

  const handleConfirmDeposit = () => {
    if (!selectedProduct) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < selectedProduct.min_deposit) {
      Alert.alert('Invalid Amount', `Deposit amount must be at least KES ${selectedProduct.min_deposit.toFixed(2)}`);
      return;
    }
    
    if (balance < amount) {
      Alert.alert(
        'Insufficient Funds',
        `You need at least KES ${amount.toFixed(2)} to open this savings account.\nWould you like to deposit now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Deposit', onPress: () => onBack() }
        ]
      );
      return;
    }
    
    handleOpenSavings(selectedProduct.id, amount);
    setShowDepositModal(false);
  };

  const renderProduct = ({ item }: { item: SavingsProduct }) => (
    <Card>
      <Card.Title>{item.name}</Card.Title>
      <Card.Divider />
      <Text>For: {item.demographic}</Text>
      <Text>Interest: {item.annual_interest_pct}% per annum</Text>
      <Text>Term: {item.term_months} months</Text>
      <Text>Min Deposit: KES {item.min_deposit.toFixed(2)}</Text>
      <Button
        title="Save"
        onPress={() => handleOpenDepositModal(item)}
        disabled={loading}
      />
    </Card>
  );

  const renderSaving = ({ item }: { item: UserSaving }) => (
    <Card>
      <Card.Title>{item.savings_product?.name || 'Unknown Product'}</Card.Title>
      <Card.Divider />
      <Text>Amount: KES {item.principal}</Text>
      <Text>Start Date: {new Date(item.starts_at).toLocaleDateString()}</Text>
      <Text>Status: {item.status}</Text>
      {item.status === 'active' && (
        <Text>Maturity Date: {new Date(item.maturity_at).toLocaleDateString()}</Text>
      )}
      <Text>Accrued Interest: KES {item.interest_accrued}</Text>
      {item.status === 'matured' && (
        <Button
          title="Withdraw"
          onPress={() => handleWithdraw(item.id)}
          disabled={loading}
        />
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={onBack} />
      <Text style={styles.header}>Available Savings Products</Text>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
      />
      
      <Text style={styles.header}>Your Savings</Text>
      <FlatList
        data={savings}
        renderItem={renderSaving}
        keyExtractor={item => item.id}
      />

      {/* Deposit Modal */}
      {showDepositModal && selectedProduct && (
        <Modal
          visible={showDepositModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDepositModal(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <View style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              width: '80%',
            }}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Enter Deposit Amount</Text>
              <Text>Minimum: KES {selectedProduct.min_deposit.toFixed(2)}</Text>
              <Input
                placeholder="KES"
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
              <Button
                title="Confirm"
                onPress={handleConfirmDeposit}
                disabled={loading}
              />
              <Button
                title="Cancel"
                onPress={() => setShowDepositModal(false)}
                type="outline"
                disabled={loading}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
});
