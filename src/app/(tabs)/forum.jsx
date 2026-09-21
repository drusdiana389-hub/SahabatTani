import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Forum() {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [konsultasi, setKonsultasi] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [judulBaru, setJudulBaru] = useState('');
  const [posting, setPosting] = useState(false);

  const loadKonsultasi = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    setUserId(user.id);

    console.log('AUTH USER ID:', user.id);

    // =========================================
    // AMBIL ROLE USER
    // =========================================

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    console.log('PROFILE FORUM:', profileData);
    console.log('PROFILE FORUM ERROR:', profileError);

    if (profileError) {
      Alert.alert(
        'Gagal memuat profil',
        'Tidak bisa mengambil data role pengguna.'
      );
      return;
    }

    setRole(profileData?.role || null);

    console.log('ROLE USER:', profileData?.role);

    // =========================================
    // AMBIL DATA KONSULTASI
    // =========================================

    const { data, error } = await supabase
      .from('konsultasi')
      .select(
        `
        id,
        judul,
        status,
        created_at,
        petani:petani_id ( nama ),
        pakar:pakar_id ( nama )
      `
      )
      .order('created_at', { ascending: false });

    console.log('KONSULTASI:', data);
    console.log('KONSULTASI ERROR:', error);

    if (error) {
      Alert.alert(
        'Gagal memuat',
        'Tidak bisa mengambil data forum.'
      );
      return;
    }

    setKonsultasi(data || []);
  }, []);

  // =========================================
  // LOAD AWAL
  // =========================================

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadKonsultasi();
      setLoading(false);
    })();
  }, [loadKonsultasi]);

  // =========================================
  // REFRESH
  // =========================================

  const onRefresh = async () => {
    setRefreshing(true);
    await loadKonsultasi();
    setRefreshing(false);
  };

  // =========================================
  // BUAT PERTANYAAN
  // KHUSUS PETANI
  // =========================================

  const handleBuatPertanyaan = async () => {
    console.log('=== TOMBOL KIRIM PERTANYAAN DIKLIK ===');

    // CEK ROLE
    if (role !== 'petani') {
      Alert.alert(
        'Akses ditolak',
        'Hanya Petani yang dapat membuat pertanyaan.'
      );
      return;
    }

    const judulBersih = judulBaru.trim();

    if (!judulBersih) {
      Alert.alert(
        'Peringatan',
        'Judul pertanyaan tidak boleh kosong!'
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        'Peringatan',
        'Sesi kamu tidak ditemukan, coba login ulang.'
      );
      return;
    }

    console.log('USER ID YANG DIKIRIM:', userId);

    setPosting(true);

    const { data, error } = await supabase
      .from('konsultasi')
      .insert({
        petani_id: userId,
        judul: judulBersih,
        status: 'menunggu',
      })
      .select()
      .single();

    setPosting(false);

    console.log('INSERT KONSULTASI:', data);
    console.log('INSERT ERROR:', error);

    if (error) {
      Alert.alert(
        'Gagal mengirim',
        error.message
      );
      return;
    }

    setJudulBaru('');
    setModalVisible(false);

    await loadKonsultasi();
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <View style={styles.centerFlex}>
        <ActivityIndicator
          size="large"
          color="#6B8E5A"
        />
      </View>
    );
  }

  // =========================================
  // HALAMAN FORUM
  // =========================================

  return (
    <View style={styles.container}>

      {/* =========================
          HEADER
      ========================= */}

      <View style={styles.header}>

        <View>
          <Text style={styles.title}>
            Forum diskusi
          </Text>

          {role === 'pakar' && (
            <Text style={styles.roleInfo}>
              👨‍🌾 Mode Pakar
            </Text>
          )}

          {role === 'petani' && (
            <Text style={styles.roleInfo}>
              🌱 Mode Petani
            </Text>
          )}
        </View>

        {/* =================================
            TOMBOL BUAT PERTANYAAN
            HANYA UNTUK PETANI
        ================================= */}

        {role === 'petani' && (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.newBtnText}>
              + Buat pertanyaan
            </Text>
          </TouchableOpacity>
        )}

      </View>

      {/* =========================
          DAFTAR KONSULTASI
      ========================= */}

      <FlatList
        data={konsultasi}
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
              Belum ada pertanyaan.
            </Text>
          </View>
        }

        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/konsultasi/[id]',
                params: {
                  id: item.id,
                },
              })
            }
          >

            <View style={styles.cardTop}>

              <Text
                style={styles.cardJudul}
                numberOfLines={2}
              >
                {item.judul}
              </Text>

              <StatusBadge
                status={item.status}
              />

            </View>

            <Text style={styles.cardSub}>

              {item.pakar?.nama
                ? `Dijawab oleh ${item.pakar.nama}`
                : `Oleh ${item.petani?.nama || 'Petani'}`}

            </Text>

          </TouchableOpacity>
        )}
      />

      {/* =================================
          MODAL BUAT PERTANYAAN
          HANYA DIPAKAI PETANI
      ================================= */}

      {role === 'petani' && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            if (!posting) {
              setModalVisible(false);
            }
          }}
        >

          <View style={styles.modalOverlay}>

            <View style={styles.modalBox}>

              <Text style={styles.modalTitle}>
                Buat pertanyaan baru
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Tulis pertanyaanmu di sini..."
                placeholderTextColor="#9AA493"
                value={judulBaru}
                onChangeText={setJudulBaru}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>

                {/* BATAL */}

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setJudulBaru('');
                  }}
                  disabled={posting}
                >

                  <Text style={styles.modalCancelText}>
                    Batal
                  </Text>

                </TouchableOpacity>

                {/* KIRIM */}

                <TouchableOpacity
                  style={[
                    styles.modalSendBtn,
                    posting &&
                      styles.modalSendBtnDisabled,
                  ]}
                  onPress={handleBuatPertanyaan}
                  disabled={posting}
                >

                  <Text style={styles.modalSendText}>
                    {posting
                      ? 'Mengirim...'
                      : 'Kirim'}
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          </View>

        </Modal>
      )}

    </View>
  );
}


// ========================================
// STATUS BADGE
// ========================================

function StatusBadge({ status }) {

  const isMenunggu =
    status === 'menunggu';

  return (
    <View
      style={[
        styles.statusBadge,
        isMenunggu
          ? styles.statusMenunggu
          : styles.statusSelesai,
      ]}
    >

      <Text
        style={[
          styles.statusText,
          isMenunggu
            ? styles.statusTextMenunggu
            : styles.statusTextSelesai,
        ]}
      >

        {isMenunggu
          ? 'Menunggu'
          : status}

      </Text>

    </View>
  );
}


// ========================================
// STYLE
// ========================================

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
    alignItems: 'center',
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#33422C',
  },

  roleInfo: {
    fontSize: 11,
    color: '#6B8E5A',
    marginTop: 3,
    fontWeight: '600',
  },

  newBtn: {
    backgroundColor: '#6B8E5A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },

  newBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
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
    marginBottom: 10,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },

  cardJudul: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#33422C',
    flex: 1,
  },

  cardSub: {
    fontSize: 12.5,
    color: '#7A8873',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusMenunggu: {
    backgroundColor: '#FAEEDA',
  },

  statusSelesai: {
    backgroundColor: '#DDEBD5',
  },

  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  statusTextMenunggu: {
    color: '#BA7517',
  },

  statusTextSelesai: {
    color: '#6B8E5A',
  },

  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 13.5,
    color: '#7A8873',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 22,
    paddingBottom: 34,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 14,
  },

  modalInput: {
    backgroundColor: '#F5F7F2',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    borderRadius: 10,
    padding: 14,
    fontSize: 14.5,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: '#33422C',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D8C8',
    alignItems: 'center',
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#33422C',
  },

  modalSendBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#6B8E5A',
    alignItems: 'center',
  },

  modalSendBtnDisabled: {
    opacity: 0.6,
  },

  modalSendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

});