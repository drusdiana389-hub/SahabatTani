import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getWeather, getWeatherText } from "../../lib/weather";

const REGIONS = [
  {
    id: "surabaya",
    name: "Surabaya",
    province: "Jawa Timur",
    latitude: -7.2575,
    longitude: 112.7521,
  },
  {
    id: "bandung",
    name: "Bandung",
    province: "Jawa Barat",
    latitude: -6.9175,
    longitude: 107.6191,
  },
  {
    id: "yogyakarta",
    name: "Yogyakarta",
    province: "DI Yogyakarta",
    latitude: -7.7956,
    longitude: 110.3695,
  },
  {
    id: "medan",
    name: "Medan",
    province: "Sumatera Utara",
    latitude: 3.5952,
    longitude: 98.6722,
  },
];

const CROP_GUIDES = {
  Bawang: {
    seed: {
      name: "Bima Brebes",
      detail: "Umbi seragam, daya tumbuh tinggi",
      badge: "Unggulan",
    },
    fertilizer: {
      name: "NPK 16-16-16 + kompos",
      detail: "Untuk fase awal dan pembentukan umbi",
    },
    tips: [
      "Pilih lahan dengan drainase baik dan pH 5,5-6,5.",
      "Jaga kelembapan tanpa membuat bedengan tergenang.",
      "Hentikan penyiraman 5-7 hari sebelum panen.",
    ],
  },
  Cabai: {
    seed: {
      name: "Hibrida tahan penyakit",
      detail: "Cocok untuk lahan terbuka dan polybag",
      badge: "Tahan virus",
    },
    fertilizer: {
      name: "NPK 15-15-15 + KNO3",
      detail: "Mendukung bunga dan pembentukan buah",
    },
    tips: [
      "Semai benih di media steril selama 21-28 hari.",
      "Pasang mulsa dan ajir sejak tanaman mulai tumbuh.",
      "Periksa daun bagian bawah setiap pagi untuk deteksi hama.",
    ],
  },
  Padi: {
    seed: {
      name: "Inpari 32",
      detail: "Potensi hasil tinggi, umur sekitar 120 hari",
      badge: "Adaptif",
    },
    fertilizer: {
      name: "Urea + NPK Phonska",
      detail: "Berikan bertahap sesuai fase pertumbuhan",
    },
    tips: [
      "Gunakan bibit muda 2-3 batang per lubang tanam.",
      "Atur pengairan berselang untuk menghemat air.",
      "Lakukan pengamatan wereng sebelum menentukan pestisida.",
    ],
  },
};

const TRAINING = [
  {
    icon: "🎥",
    title: "Membuat bedengan yang sehat",
    meta: "Video • 12 menit",
  },
  {
    icon: "📘",
    title: "Membaca gejala kekurangan unsur hara",
    meta: "Modul • 8 halaman",
  },
  {
    icon: "🧪",
    title: "Racikan pupuk organik untuk pemula",
    meta: "Kelas eksklusif • 25 menit",
  },
];

export default function PusatTani() {
  const [regionId, setRegionId] = useState("surabaya");
  const [crop, setCrop] = useState("Bawang");
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const region = REGIONS.find((item) => item.id === regionId) || REGIONS[0];
  const guide = CROP_GUIDES[crop];

  useEffect(() => {
    let active = true;
    setLoadingWeather(true);

    getWeather(region.latitude, region.longitude)
      .then((data) => {
        if (active) setWeather(data);
      })
      .catch(() => {
        if (active) setWeather(null);
      })
      .finally(() => {
        if (active) setLoadingWeather(false);
      });

    return () => {
      active = false;
    };
  }, [region]);

  const weatherAdvice = useMemo(() => {
    if (!weather?.current) return "Data cuaca belum tersedia.";
    const code = weather.current.weather_code;
    if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code))
      return "Tunda penyemprotan dan cek drainase lahan hari ini.";
    if (weather.current.temperature_2m >= 32)
      return "Siram pagi atau sore dan gunakan mulsa untuk menjaga kelembapan.";
    return "Cuaca cukup mendukung. Waktu pagi baik untuk pemupukan ringan.";
  }, [weather]);

  const openConsultation = () => {
    Alert.alert(
      "Konsultasi pribadi",
      "Ajukan pertanyaan di forum dan pakar akan membantu menjawabnya.",
      [
        { text: "Nanti", style: "cancel" },
        { text: "Buka forum", onPress: () => router.push("/(tabs)/forum") },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>🌱 RUANG BELAJAR PETANI</Text>
        <Text style={styles.title}>Pusat Tani</Text>
        <Text style={styles.subtitle}>
          Panduan yang menyesuaikan tanaman dan wilayahmu.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Pilih tanaman</Text>
      <View style={styles.chipRow}>
        {Object.keys(CROP_GUIDES).map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, crop === item && styles.chipActive]}
            onPress={() => setCrop(item)}
          >
            <Text
              style={[styles.chipText, crop === item && styles.chipTextActive]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Cuaca tiap daerah</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.regionRow}
      >
        {REGIONS.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.regionChip,
              regionId === item.id && styles.regionChipActive,
            ]}
            onPress={() => setRegionId(item.id)}
          >
            <Text
              style={[
                styles.regionText,
                regionId === item.id && styles.regionTextActive,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.regionProvince,
                regionId === item.id && styles.regionTextActive,
              ]}
            >
              {item.province}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <View>
            <Text style={styles.cardKicker}>KONDISI TERKINI</Text>
            <Text style={styles.cardTitle}>{region.name}</Text>
          </View>
          {loadingWeather ? (
            <ActivityIndicator color="#F7C873" />
          ) : (
            <Text style={styles.weatherIcon}>
              {getWeatherIcon(weather?.current?.weather_code)}
            </Text>
          )}
        </View>
        {loadingWeather ? (
          <Text style={styles.weatherHint}>Mengambil data cuaca...</Text>
        ) : weather?.current ? (
          <>
            <View style={styles.weatherMain}>
              <Text style={styles.temperature}>
                {Math.round(weather.current.temperature_2m)}°
              </Text>
              <Text style={styles.condition}>
                {getWeatherText(weather.current.weather_code)}
              </Text>
            </View>
            <View style={styles.weatherStats}>
              <Text style={styles.stat}>
                Kelembapan {weather.current.relative_humidity_2m}%
              </Text>
              <Text style={styles.stat}>
                Angin {Math.round(weather.current.wind_speed_10m)} km/j
              </Text>
            </View>
            <Text style={styles.weatherAdvice}>{weatherAdvice}</Text>
          </>
        ) : (
          <Text style={styles.weatherHint}>
            Data cuaca sedang tidak tersedia. Coba pilih daerah lain.
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Rekomendasi {crop}</Text>
      <View style={styles.recommendationGrid}>
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationIcon}>🌱</Text>
          <Text style={styles.cardKicker}>PILIHAN BIBIT</Text>
          <Text style={styles.recommendationTitle}>{guide.seed.name}</Text>
          <Text style={styles.cardDescription}>{guide.seed.detail}</Text>
          <Text style={styles.badge}>{guide.seed.badge}</Text>
        </View>
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationIcon}>🧺</Text>
          <Text style={styles.cardKicker}>PILIHAN PUPUK</Text>
          <Text style={styles.recommendationTitle}>
            {guide.fertilizer.name}
          </Text>
          <Text style={styles.cardDescription}>{guide.fertilizer.detail}</Text>
          <Text style={styles.badge}>Sesuai fase awal</Text>
        </View>
      </View>

      <View style={styles.tipSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Tips spesifik {crop}</Text>
          <Text style={styles.tipCount}>{guide.tips.length} langkah</Text>
        </View>
        {guide.tips.map((tip, index) => (
          <View key={tip} style={styles.tipRow}>
            <Text style={styles.tipNumber}>0{index + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.exclusiveCard}>
        <View style={styles.exclusiveTop}>
          <Text style={styles.exclusiveIcon}>🔒</Text>
          <View style={styles.exclusiveCopy}>
            <Text style={styles.exclusiveKicker}>AKSES EKSKLUSIF</Text>
            <Text style={styles.exclusiveTitle}>Materi pelatihan pilihan</Text>
          </View>
          <Text style={styles.memberBadge}>MEMBER</Text>
        </View>
        {TRAINING.map((item) => (
          <Pressable
            key={item.title}
            style={styles.trainingRow}
            onPress={() =>
              Alert.alert(
                "Materi eksklusif",
                `${item.title} akan segera dibuka.`,
              )
            }
          >
            <Text style={styles.trainingIcon}>{item.icon}</Text>
            <View style={styles.trainingCopy}>
              <Text style={styles.trainingTitle}>{item.title}</Text>
              <Text style={styles.trainingMeta}>{item.meta}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
        <Pressable style={styles.consultButton} onPress={openConsultation}>
          <Text style={styles.consultButtonText}>
            👨‍🌾 Konsultasi pribadi dengan agronom
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7F2" },
  content: { padding: 20, paddingTop: 56, paddingBottom: 42 },
  hero: { marginBottom: 24 },
  eyebrow: {
    color: "#C48738",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: { color: "#283D2B", fontSize: 30, fontWeight: "800" },
  subtitle: { color: "#718073", fontSize: 14, marginTop: 6, lineHeight: 20 },
  sectionTitle: {
    color: "#283D2B",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 11,
  },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 23 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6DFD0",
  },
  chipActive: { backgroundColor: "#496D4A", borderColor: "#496D4A" },
  chipText: { color: "#637366", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#FFFFFF" },
  regionRow: { gap: 9, paddingBottom: 12 },
  regionChip: {
    minWidth: 112,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: "#D6DFD0",
  },
  regionChipActive: { backgroundColor: "#E6F0E2", borderColor: "#7C9D6E" },
  regionText: { color: "#334B36", fontSize: 13, fontWeight: "800" },
  regionProvince: { color: "#869287", fontSize: 10, marginTop: 3 },
  regionTextActive: { color: "#365A3C" },
  weatherCard: {
    backgroundColor: "#29483C",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardKicker: {
    color: "#93A99B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  cardTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  weatherIcon: { fontSize: 34 },
  weatherMain: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 9,
    marginTop: 13,
  },
  temperature: { color: "#F7C873", fontSize: 42, fontWeight: "800" },
  condition: { color: "#DDE9D7", fontSize: 14, fontWeight: "700" },
  weatherStats: {
    flexDirection: "row",
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: "#416152",
    paddingTop: 12,
    marginTop: 9,
  },
  stat: { color: "#C5D4C6", fontSize: 12 },
  weatherAdvice: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 15,
  },
  weatherHint: { color: "#C5D4C6", fontSize: 13, marginTop: 18 },
  recommendationGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  recommendationCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6DFD0",
    padding: 14,
    minHeight: 174,
  },
  recommendationIcon: { fontSize: 25, marginBottom: 12 },
  recommendationTitle: {
    color: "#334B36",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  cardDescription: {
    color: "#778478",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  badge: { color: "#B2772D", fontSize: 10, fontWeight: "800", marginTop: 12 },
  tipSection: {
    backgroundColor: "#EAF1E4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tipCount: { color: "#769072", fontSize: 11, fontWeight: "700" },
  tipRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#D8E5D2",
    paddingVertical: 12,
  },
  tipNumber: { color: "#739464", fontSize: 12, fontWeight: "800" },
  tipText: { flex: 1, color: "#4A604C", fontSize: 13, lineHeight: 19 },
  exclusiveCard: {
    backgroundColor: "#FFF8E9",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EED9A7",
  },
  exclusiveTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  exclusiveIcon: { fontSize: 22, marginRight: 10 },
  exclusiveCopy: { flex: 1 },
  exclusiveKicker: {
    color: "#B2772D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  exclusiveTitle: {
    color: "#59451F",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 3,
  },
  memberBadge: {
    color: "#8D6B2D",
    fontSize: 9,
    fontWeight: "800",
    backgroundColor: "#F6E6BC",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
  },
  trainingRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0DFB9",
    paddingVertical: 12,
  },
  trainingIcon: { fontSize: 20, width: 32 },
  trainingCopy: { flex: 1 },
  trainingTitle: { color: "#59451F", fontSize: 13, fontWeight: "700" },
  trainingMeta: { color: "#A58C5C", fontSize: 11, marginTop: 3 },
  arrow: { color: "#B2772D", fontSize: 25 },
  consultButton: {
    backgroundColor: "#496D4A",
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
    marginTop: 8,
  },
  consultButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
