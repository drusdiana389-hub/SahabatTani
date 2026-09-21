import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { supabase } from '../../lib/supabase';

export default function DrawerLayout() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      console.log('ROLE USER:', data);
      console.log('ROLE ERROR:', error);

      if (error) {
        console.log('Gagal mengambil role:', error);
        setRole(null);
        return;
      }

      setRole(data?.role || null);
    } catch (error) {
      console.log('ERROR LOAD ROLE:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Tunggu role selesai diambil
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F7F2',
        }}
      >
        <ActivityIndicator size="large" color="#6B8E5A" />
      </View>
    );
  }

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      {/* BERANDA */}
      <Drawer.Screen
        name="index"
        options={{
          title: '🏠 Beranda',
        }}
      />

      {/* FORUM */}
      <Drawer.Screen
        name="forum"
        options={{
          title: '💬 Forum',
        }}
      />

      {/* PREDIKSI */}
      <Drawer.Screen
        name="prediksi"
        options={{
          title: '🌾 Prediksi Panen',
        }}
      />

      {/* DASHBOARD PAKAR
          HANYA MUNCUL UNTUK ROLE PAKAR */}
      {role === 'pakar' && (
        <Drawer.Screen
          name="pakar"
          options={{
            title: '👨‍🌾 Dashboard Pakar',
          }}
        />
      )}

      {/* CUACA */}
      <Drawer.Screen
        name="cuaca"
        options={{
          title: '🌦️ Cuaca',
        }}
      />

      {/* EXPLORE */}
      <Drawer.Screen
        name="explore"
        options={{
          title: '🔍 Explore',
        }}
      />
    </Drawer>
  );
}