import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function DashboardPakar() {
  const [pertanyaan, setPertanyaan] = useState([]);
  const [jawaban, setJawaban] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);

  const [akses, setAkses] = useState("checking");

  const loadPertanyaan = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("PROFILE TANYA JAWAB:", profile);
    console.log("PROFILE ERROR:", profileError);
    setRole(profile?.role || null);
    setAkses("allowed");

    const { data, error } = await supabase
      .from("konsultasi")
      .select(
        `
    id,
    judul,
    jawaban,
    status,
    created_at,
    petani_id,
    pakar_id,
    profiles:petani_id (
      nama
    )
  `,
      )
      .order("created_at", { ascending: false });

    console.log("DATA KONSULTASI PAKAR:", data);
    console.log("ERROR KONSULTASI PAKAR:", error);

    if (error) {
      Alert.alert("Gagal memuat", error.message);
      return;
    }

    setPertanyaan(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadPertanyaan();
      setLoading(false);
    };

    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPertanyaan();
    setRefreshing(false);
  };

  const kirimJawaban = async (item) => {
    const text = jawaban[item.id];

    if (!text || !text.trim()) {
      Alert.alert("Jawaban kosong", "Silakan tulis jawaban terlebih dahulu.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "Akun pakar tidak ditemukan.");
      return;
    }

    const { error } = await supabase
      .from("konsultasi")
      .update({
        jawaban: text.trim(),
        pakar_id: userId,
        status: "dijawab",
        dijawab_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      console.log("ERROR UPDATE KONSULTASI:", error);
      Alert.alert("Gagal", error.message);
      return;
    }

    const { error: pesanError } = await supabase.from("pesan").insert({
      konsultasi_id: item.id,
      pengirim_id: userId,
      isi: text.trim(),
    });

    if (pesanError) {
      console.log("ERROR INSERT PESAN:", pesanError);
      Alert.alert("Gagal mengirim jawaban", pesanError.message);
      return;
    }

    Alert.alert("Berhasil", "Jawaban berhasil dikirim ke petani.");

    setJawaban((prev) => ({
      ...prev,
      [item.id]: "",
    }));

    await loadPertanyaan();
  };

  if (loading || akses === "checking") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B8E5A" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Tanya Jawab</Text>

      <Text style={styles.subtitle}>
        💬 Pertanyaan dan jawaban dari 🌱 petani & 👨‍🌾 pakar
      </Text>

      <FlatList
        data={pertanyaan}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada pertanyaan dari 🌱 petani.</Text>
        }
        renderItem={({ item }) => {
          const sudahDijawab = item.status === "dijawab";

          return (
            <View style={styles.card}>
              <View style={styles.headerCard}>
                <View>
                  <Text style={styles.nama}>
                    🌱 {item.profiles?.nama || "Petani"}
                  </Text>

                  <Text style={styles.date}>📝 Pertanyaan #{item.id}</Text>
                </View>

                <Text
                  style={[
                    styles.status,
                    sudahDijawab ? styles.statusAnswered : styles.statusWaiting,
                  ]}
                >
                  {sudahDijawab ? "✅ Sudah dijawab" : "⏳ Menunggu"}
                </Text>
              </View>

              <Text style={styles.label}>❓ Pertanyaan:</Text>

              <Text style={styles.question}>{item.judul}</Text>

              {sudahDijawab ? (
                <View style={styles.answerBox}>
                  <Text style={styles.answerInfo}>
                    ✅ Pertanyaan sudah dijawab
                  </Text>

                  <Text style={styles.answerText}>{item.jawaban}</Text>

                  {(role === "pakar" || item.petani_id === userId) && (
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={() =>
                        router.push({
                          pathname: "/konsultasi/[id]",
                          params: {
                            id: item.id,
                          },
                        })
                      }
                    >
                      <Text style={styles.chatButtonText}>
                        💬 Lihat Percakapan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : role === "pakar" ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Tulis jawaban untuk 🌱 petani..."
                    multiline
                    value={jawaban[item.id] || ""}
                    onChangeText={(text) =>
                      setJawaban((prev) => ({
                        ...prev,
                        [item.id]: text,
                      }))
                    }
                  />

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => kirimJawaban(item)}
                  >
                    <Text style={styles.buttonText}>📤 Kirim Jawaban</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingText}>
                    ⏳ Menunggu jawaban dari pakar.
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
    padding: 20,
    paddingTop: 55,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7F2",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B8E5A",
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#33422C",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: "#7A8873",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#D0D8C8",
  },

  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  answerText: {
    fontSize: 14,
    color: "#33422C",
    lineHeight: 21,
    marginBottom: 12,
  },

  waitingBox: {
    backgroundColor: "#FFF8E9",
    borderRadius: 10,
    padding: 12,
  },

  waitingText: {
    color: "#8A6415",
    fontSize: 13,
  },

  nama: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#33422C",
  },

  date: {
    fontSize: 11,
    color: "#7A8873",
    marginTop: 3,
  },

  status: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: "hidden",
  },

  statusWaiting: {
    backgroundColor: "#FFF1D6",
    color: "#9A6B00",
  },

  statusAnswered: {
    backgroundColor: "#E4F2D8",
    color: "#4C7A32",
  },

  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7A8873",
    marginBottom: 5,
  },

  question: {
    fontSize: 15,
    color: "#33422C",
    lineHeight: 21,
    marginBottom: 15,
  },

  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#D0D8C8",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFBF8",
    textAlignVertical: "top",
    fontSize: 14,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#4C7A32",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  answerBox: {
    backgroundColor: "#F0F6EA",
    borderRadius: 10,
    padding: 12,
  },

  answerInfo: {
    fontSize: 13,
    color: "#4C7A32",
    fontWeight: "600",
    marginBottom: 10,
  },

  chatButton: {
    backgroundColor: "#6B8E5A",
    padding: 11,
    borderRadius: 9,
    alignItems: "center",
  },

  chatButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#7A8873",
  },
});