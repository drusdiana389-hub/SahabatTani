import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Forum() {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);

  const [konsultasi, setKonsultasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [judulBaru, setJudulBaru] = useState("");
  const [posting, setPosting] = useState(false);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    // Ambil role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("PROFILE FORUM:", profile);
    console.log("PROFILE ERROR:", profileError);

    setRole(profile?.role || null);

    let query = supabase.from("konsultasi").select(
      `
        id,
        judul,
        status,
        created_at,
        petani_id,
        pakar_id,
        petani:petani_id (
          nama
        ),
        pakar:pakar_id (
          nama
        )
      `,
    );

    // Forum berisi inbox pribadi petani. Pakar melihat antrean konsultasinya.
    if (profile?.role === "petani") {
      query = query.eq("petani_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    console.log("KONSULTASI:", data);
    console.log("KONSULTASI ERROR:", error);

    if (error) {
      Alert.alert("Gagal memuat", error.message);
      return;
    }

    setKonsultasi(data || []);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    load();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBuatPertanyaan = async () => {
    const judulBersih = judulBaru.trim();

    if (!judulBersih) {
      Alert.alert("Peringatan", "Pertanyaan tidak boleh kosong.");
      return;
    }

    if (!userId) {
      Alert.alert("Peringatan", "Sesi tidak ditemukan.");
      return;
    }

    // Pastikan hanya petani yang bisa membuat pertanyaan
    if (role !== "petani") {
      Alert.alert(
        "Tidak diizinkan",
        "🌱 Hanya petani yang dapat mengajukan pertanyaan.",
      );
      return;
    }

    setPosting(true);

    const { data, error } = await supabase
      .from("konsultasi")
      .insert({
        petani_id: userId,
        judul: judulBersih,
        status: "menunggu",
      })
      .select()
      .single();

    setPosting(false);

    console.log("INSERT KONSULTASI:", data);
    console.log("INSERT ERROR:", error);

    if (error) {
      Alert.alert("Gagal mengirim", error.message);
      return;
    }

    setJudulBaru("");
    setModalVisible(false);

    await loadData();

    Alert.alert("Berhasil", "Pertanyaan berhasil dikirim ke forum.");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B8E5A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💬 Konsultasi Pribadi</Text>

          <Text style={styles.subtitle}>Chat pribadi kamu bersama pakar</Text>
        </View>

        {/* HANYA PETANI YANG MEMBUAT KONSULTASI */}
        {role === "petani" && (
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.newButtonText}>+ Ajukan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DAFTAR PERTANYAAN */}
      <FlatList
        data={konsultasi}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Belum ada pertanyaan.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/konsultasi/[id]",
                params: {
                  id: item.id,
                },
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.question} numberOfLines={2}>
                {item.judul}
              </Text>

              <View
                style={[
                  styles.status,
                  item.status === "dijawab"
                    ? styles.statusAnswered
                    : styles.statusWaiting,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === "dijawab"
                      ? styles.statusTextAnswered
                      : styles.statusTextWaiting,
                  ]}
                >
                  {item.status === "dijawab" ? "Sudah dijawab" : "Menunggu"}
                </Text>
              </View>
            </View>

            <Text style={styles.petani}>
              🌱 {item.petani?.nama || "Petani"}
            </Text>

            {item.pakar?.nama && (
              <Text style={styles.pakar}>
                👨‍🌾 Dijawab oleh {item.pakar.nama}
              </Text>
            )}

            <Text style={styles.openText}>Lihat diskusi →</Text>
          </TouchableOpacity>
        )}
      />

      {/* MODAL AJUKAN PERTANYAAN */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Ajukan Pertanyaan</Text>

            <Text style={styles.modalSubtitle}>
              Pertanyaan kamu akan dilihat oleh pakar.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contoh: Bagaimana cara menjaga kesuburan tanah?"
              value={judulBaru}
              onChangeText={setJudulBaru}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setJudulBaru("");
                }}
                disabled={posting}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  posting && styles.sendButtonDisabled,
                ]}
                onPress={handleBuatPertanyaan}
                disabled={posting}
              >
                <Text style={styles.sendText}>
                  {posting ? "Mengirim..." : "Kirim Pertanyaan"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7F2",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#33422C",
  },

  subtitle: {
    fontSize: 12,
    color: "#7A8873",
    marginTop: 4,
    maxWidth: 220,
  },

  newButton: {
    backgroundColor: "#6B8E5A",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
  },

  newButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  list: {
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D8C8",
    borderRadius: 13,
    padding: 16,
    marginBottom: 10,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#33422C",
    lineHeight: 21,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusWaiting: {
    backgroundColor: "#FAEEDA",
  },

  statusAnswered: {
    backgroundColor: "#DDEBD5",
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: "700",
  },

  statusTextWaiting: {
    color: "#BA7517",
  },

  statusTextAnswered: {
    color: "#4C7A32",
  },

  petani: {
    fontSize: 12,
    color: "#7A8873",
    marginTop: 9,
  },

  pakar: {
    fontSize: 12,
    color: "#6B8E5A",
    marginTop: 4,
  },

  openText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B8E5A",
    marginTop: 10,
  },

  empty: {
    padding: 40,
    alignItems: "center",
  },

  emptyText: {
    color: "#7A8873",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    paddingBottom: 35,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#33422C",
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#7A8873",
    marginTop: 4,
    marginBottom: 15,
  },

  input: {
    minHeight: 110,
    backgroundColor: "#F5F7F2",
    borderWidth: 1,
    borderColor: "#D0D8C8",
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    marginBottom: 15,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D0D8C8",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelText: {
    color: "#33422C",
    fontWeight: "600",
  },

  sendButton: {
    flex: 1,
    backgroundColor: "#6B8E5A",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  sendButtonDisabled: {
    opacity: 0.6,
  },

  sendText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
