import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Account from './components/Account'
import Dashboard from './components/Dashboard'
import Deposit from './components/Deposit'
import SendMoney from './components/SendMoney'
import Menu from './components/Menu'
import AdminDashboard from './components/AdminDashboard'
import { View } from 'react-native'
import { Session } from '@supabase/supabase-js'

type AppScreen = 'dashboard' | 'deposit' | 'profile' | 'admin' | 'sendMoney'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [screen, setScreen] = useState<AppScreen>('dashboard')
  const [balance, setBalance] = useState(0)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const fetchProfile = useCallback(async () => {
    console.log('Fetching profile from server...');
    setIsRefreshing(true);
    try {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select(`username, website, avatar_url, balance, is_admin`)
          .eq('id', session.user.id)
          .single()

        console.log('Profile data received:', data);

        if (data) {
          setUsername(data.username)
          setWebsite(data.website)
          setAvatarUrl(data.avatar_url)
          setBalance(data.balance || 0)
          setIsAdmin(data.is_admin)
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session, fetchProfile])

  if (!session || !session.user) {
    return (
      <View>
        <Auth />
      </View>
    )
  }

  const handleDeposit = (amount: number) => {
    if (amount > 0) {
      setScreen('dashboard')
    }
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return (
          <Dashboard 
            balance={balance} 
            isRefreshing={isRefreshing}
            onDepositPress={() => setScreen('deposit')} 
            onSendMoneyPress={() => setScreen('sendMoney')}
            email={session.user?.email}
          />
        )
      case 'deposit':
        return <Deposit onDeposit={handleDeposit} onDepositSuccess={fetchProfile} />
      case 'sendMoney':
        return <SendMoney onSend={() => setScreen('dashboard')} onSendSuccess={fetchProfile} />
      case 'profile':
        return <Account key={session.user.id} session={session} />
      case 'admin':
        return <AdminDashboard />
      default:
        return (
          <Dashboard
            balance={balance}
            isRefreshing={isRefreshing}
            onDepositPress={() => setScreen('deposit')}
            onSendMoneyPress={() => setScreen('sendMoney')} 
          />
        );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Menu navigate={setScreen} current={screen} isAdmin={isAdmin} />
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
    </View>
  )
}