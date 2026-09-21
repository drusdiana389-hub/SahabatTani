import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import { useNavigation } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Beranda() {
  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bukaSidebar = () => {
  navigation.openDrawer();
  };

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
    .from('profiles')
    .select('nama, role')
    .eq('id', user.id)
    .maybeSingle();

    console.log('PROFILE:', data);
    console.log('PROFILE ERROR:', error);

    return data;
  }, []);

  const loadTips = useCallback(async () => {
    const { data, error } = await supabase
      .from('tips_budidaya')
      .select('id, judul, isi, kategori, created_at')
      .order('created_at', { ascending: false });

    console.log('TIPS BUDIDAYA:', data);
    console.log('TIPS ERROR:', error);

    return { data, error };
  }, []);

  const loadAll = useCallback(async () => {
    const profileData = await loadProfile();
    setProfile(profileData);

    const { data, error } = await loadTips();

    if (error) {
      Alert.alert(
        'Gagal memuat',
        'Tidak bisa mengambil data tips budidaya.'
      );
    } else {
      setTips(data || []);
    }
  }, [loadProfile, loadTips]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    console.log('=== TOMBOL KELUAR DIKLIK ===');

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Gagal keluar', error.message);
      return;
    }

    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.centerFlex}>
        <ActivityIndicator size="large" color="#6B8E5A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* =========================
          HEADER
      ========================= */}
      <View style={styles.header}>

        <View>
          <Text style={styles.greetLabel}>
            Selamat datang,
          </Text>

          <Text style={styles.greetName}>
            {profile?.nama || 'SahabatTani'}
          </Text>

          {profile?.role ? (
            <Text style={styles.roleBadge}>
              {profile.role === 'pakar'
                ? '👨‍🌾 Pakar'
                : '🌱 Petani'}
            </Text>
          ) : null}
        </View>

        {/* BAGIAN KANAN */}
        <View style={styles.headerButtons}>

          {/* TOMBOL SIDEBAR */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={bukaSidebar}
          >
            <Text style={styles.menuText}>☰</Text>
          </TouchableOpacity>

          {/* TOMBOL KELUAR */}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutText}>
              Keluar
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* =========================
          TIPS BUDIDAYA
      ========================= */}
      <Text style={styles.sectionTitle}>
        Tips budidaya
      </Text>

      <FlatList
        data={tips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }

        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Belum ada tips budidaya.
              {'\n'}
              Tarik ke bawah untuk memuat ulang.
            </Text>
          </View>
        }

        renderItem={({ item }) => (
          <View style={styles.card}>

            {item.kategori ? (
              <Text style={styles.cardKategori}>
                {item.kategori}
              </Text>
            ) : null}

            <Text style={styles.cardJudul}>
              {item.judul}
            </Text>

            <Text
              style={styles.cardIsi}
              numberOfLines={3}
            >
              {item.isi}
            </Text>

          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F7F2',
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  centerFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  greetLabel: {
    fontSize: 13,
    color: '#7A8873',
  },

  greetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#33422C',
    marginTop: 2,
  },

  roleBadge: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B8E5A',
    fontWeight: '600',
  },

  /* =========================
     TOMBOL KANAN
  ========================= */

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuText: {
    fontSize: 24,
    color: '#33422C',
    fontWeight: 'bold',
  },

  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D8C8',
    backgroundColor: '#FFFFFF',
  },

  logoutText: {
    fontSize: 13,
    color: '#33422C',
    fontWeight: '600',
  },

  /* =========================
     TIPS
  ========================= */

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 12,
  },

  listContent: {
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D8C8',
    padding: 16,
    marginBottom: 12,
  },

  cardKategori: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B8E5A',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  cardJudul: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 6,
  },

  cardIsi: {
    fontSize: 13.5,
    color: '#556150',
    lineHeight: 19,
  },

  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 13.5,
    color: '#7A8873',
    textAlign: 'center',
    lineHeight: 22,
  },

});