import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'

type Props = {
  balance: number
  isRefreshing: boolean
  onDepositPress: () => void
}

export default function Dashboard({ balance, isRefreshing, onDepositPress }: Props) {

  return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <Text style={styles.balance}>${balance.toFixed(2)}</Text>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.depositButton}
          onPress={onDepositPress}
        >
          <Text style={styles.depositButtonText}>Deposit Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.withdrawButton} disabled>
          <Text style={styles.withdrawButtonText}>Withdraw Funds (Coming Soon)</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    padding: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  depositButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
  },
  depositButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  withdrawButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 6,
  },
  withdrawButtonText: {
    color: '#666',
    fontSize: 16,
  },
})
