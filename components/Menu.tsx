import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button } from '@rneui/themed'

type Screen = 'dashboard' | 'deposit' | 'profile' | 'admin'

type Props = {
  navigate: (s: Screen) => void
  current: Screen
  isAdmin: boolean
}

export default function Menu({ navigate, current, isAdmin }: Props) {
  return (
    <View style={styles.container}>
      <Button
        type={current === 'dashboard' ? 'solid' : 'outline'}
        containerStyle={styles.button}
        title="Dashboard"
        onPress={() => navigate('dashboard')}
      />
      <Button
        type={current === 'deposit' ? 'solid' : 'outline'}
        containerStyle={styles.button}
        title="Deposit"
        onPress={() => navigate('deposit')}
      />
      <Button
        type={current === 'profile' ? 'solid' : 'outline'}
        containerStyle={styles.button}
        title="Profile"
        onPress={() => navigate('profile')}
      />
      {isAdmin && (
        <Button
          type={current === 'admin' ? 'solid' : 'outline'}
          containerStyle={styles.button}
          title="Admin"
          onPress={() => navigate('admin')}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    minHeight: 50,
  },
})
