import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

// ======================================================
// KOTAK KETIKAN — dipisah jadi komponen sendiri.
// Ini PENTING: komponen ini punya state teksnya sendiri
// (bukan dari komponen induk), jadi walaupun daftar chat
// di atas terus berubah (pesan baru masuk lewat Realtime),
// kotak ketikan ini TIDAK ikut render ulang dan teks yang
// sedang diketik tidak akan hilang/ke-reset.
// ======================================================
const ChatInputBar = memo(function ChatInputBar({ onSend, mengirim }) {
  const [teks, setTeks] = useState('');

  const handleKirim = () => {
    const isiBersih = teks.trim();
    if (!isiBersih) return;
    onSend(isiBersih);
    setTeks('');
  };

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        placeholder="Tulis pesan..."
        value={teks}
        onChangeText={setTeks}
        multiline
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
      />
      <TouchableOpacity
        style={[styles.sendBtn, mengirim && styles.sendBtnDisabled]}
        onPress={handleKirim}
        disabled={mengirim}
      >
        <Text style={styles.sendBtnText}>{mengirim ? '...' : 'Kirim'}</Text>
      </TouchableOpacity>
    </View>
  );
});

export default function DetailKonsultasi() {
  const { id } = useLocalSearchParams();
  const [userId, setUserId] = useState(null);
  const [konsultasi, setKonsultasi] = useState(null);
  const [pesan, setPesan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mengirim, setMengirim] = useState(false);
  const listRef = useRef(null);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }
    setUserId(user.id);

    const { data: konsultasiData, error: konsultasiError } = await supabase
      .from('konsultasi')
      .select(
        `
        id,
        judul,
        status,
        petani:petani_id ( nama ),
        pakar:pakar_id ( nama )
      `
      )
      .eq('id', id)
      .single();

    console.log('DETAIL KONSULTASI:', konsultasiData);
    console.log('DETAIL KONSULTASI ERROR:', konsultasiError);

    if (konsultasiError) {
      Alert.alert('Gagal memuat', 'Konsultasi tidak ditemukan.');
      router.back();
      return;
    }
    setKonsultasi(konsultasiData);

    const { data: pesanData, error: pesanError } = await supabase
      .from('pesan')
      .select(
        `
        id,
        isi,
        created_at,
        pengirim_id,
        pengirim:pengirim_id ( nama )
      `
      )
      .eq('konsultasi_id', id)
      .order('created_at', { ascending: true });

    console.log('PESAN:', pesanData);
    console.log('PESAN ERROR:', pesanError);

    setPesan(pesanData || []);
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    })();
  }, [loadData]);

  // Dengarkan pesan baru secara real-time
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`pesan-konsultasi-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pesan',
          filter: `konsultasi_id=eq.${id}`,
        },
        (payload) => {
          console.log('PESAN BARU MASUK:', payload.new);
          setPesan((prev) => {
            const sudahAda = prev.some((p) => p.id === payload.new.id);
            if (sudahAda) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Dibungkus useCallback dengan dependency stabil (id, userId),
  // supaya ChatInputBar (yang di-memo) tidak ikut render ulang
  // gara-gara fungsi ini berubah identitas tiap kali komponen render.
  const handleKirim = useCallback(
    async (isiBersih) => {
      console.log('=== TOMBOL KIRIM PESAN DIKLIK ===');

      if (!userId) {
        Alert.alert('Peringatan', 'Sesi kamu tidak ditemukan, coba login ulang.');
        return;
      }

      setMengirim(true);

      const { data, error } = await supabase
        .from('pesan')
        .insert({
          konsultasi_id: id,
          pengirim_id: userId,
          isi: isiBersih,
        })
        .select()
        .single();

      setMengirim(false);

      console.log('KIRIM PESAN ERROR:', error);

      if (error) {
        Alert.alert('Gagal mengirim', error.message);
        return;
      }

      if (data) {
        setPesan((prev) => {
          const sudahAda = prev.some((p) => p.id === data.id);
          if (sudahAda) return prev;
          return [...prev, data];
        });
      }
    },
    [id, userId]
  );

  if (loading) {
    return (
      <View style={styles.centerFlex}>
        <ActivityIndicator size="large" color="#6B8E5A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {konsultasi?.judul}
        </Text>
        <Text style={styles.headerSub}>
          {konsultasi?.pakar?.nama
            ? `Bersama ${konsultasi.pakar.nama}`
            : 'Menunggu pakar merespons'}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={pesan}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Belum ada pesan. Mulai percakapan di bawah ini.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.pengirim_id === userId;
          return (
            <View
              style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              {!isMe && item.pengirim?.nama ? (
                <Text style={styles.bubbleName}>{item.pengirim.nama}</Text>
              ) : null}
              <Text
                style={isMe ? styles.bubbleTextMe : styles.bubbleTextThem}
              >
                {item.isi}
              </Text>
            </View>
          );
        }}
      />

      <ChatInputBar onSend={handleKirim} mengirim={mengirim} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F5F7F2',
  },

  centerFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D0D8C8',
  },

  backText: {
    fontSize: 13,
    color: '#6B8E5A',
    fontWeight: '600',
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33422C',
  },

  headerSub: {
    fontSize: 12,
    color: '#7A8873',
    marginTop: 2,
  },

  chatContent: {
    padding: 20,
    flexGrow: 1,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 13.5,
    color: '#7A8873',
    textAlign: 'center',
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 10,
  },

  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    alignSelf: 'flex-start',
  },

  bubbleMe: {
    backgroundColor: '#DDEBD5',
    alignSelf: 'flex-end',
  },

  bubbleName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B8E5A',
    marginBottom: 3,
  },

  bubbleTextThem: {
    fontSize: 13.5,
    color: '#33422C',
    lineHeight: 19,
  },

  bubbleTextMe: {
    fontSize: 13.5,
    color: '#33422C',
    lineHeight: 19,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D0D8C8',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D0D8C8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },

  sendBtn: {
    backgroundColor: '#6B8E5A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },

  sendBtnDisabled: {
    opacity: 0.6,
  },

  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});