import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'

type Props = {
  balance: number
  isRefreshing: boolean
  onDepositPress: () => void
  onSendMoneyPress: () => void
  email?: string
}

export default function Dashboard({ balance, isRefreshing, onDepositPress, onSendMoneyPress, email }: Props) {

  return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      {email && (
        <Text style={styles.emailText}>{email}</Text>
      )}
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
        <TouchableOpacity 
          style={styles.sendMoneyButton}
          onPress={onSendMoneyPress}
        >
          <Text style={styles.sendMoneyButtonText}>Send Money</Text>
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
    marginTop: 40,
    padding: 12,
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
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
  sendMoneyButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  sendMoneyButtonText: {
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
