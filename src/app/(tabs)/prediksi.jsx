import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Prediksi() {
  const [tanaman, setTanaman] = useState('');

  const [tanggalTanam, setTanggalTanam] = useState(new Date());
  const [tanggalPanen, setTanggalPanen] = useState(new Date());

  const [showTanggalTanam, setShowTanggalTanam] = useState(false);
  const [showTanggalPanen, setShowTanggalPanen] = useState(false);

  const [hasil, setHasil] = useState(null);

  // ==============================
  // PILIH TANGGAL TANAM
  // ==============================

  const handleTanggalTanamChange = (event, selectedDate) => {
    setShowTanggalTanam(false);

    if (selectedDate) {
      setTanggalTanam(selectedDate);
    }
  };

  // ==============================
  // PILIH TANGGAL PANEN
  // ==============================

  const handleTanggalPanenChange = (event, selectedDate) => {
    setShowTanggalPanen(false);

    if (selectedDate) {
      setTanggalPanen(selectedDate);
    }
  };

  // ==============================
  // HITUNG PERKIRAAN
  // ==============================

  const handlePrediksi = () => {
    const namaTanaman = tanaman.trim();

    if (!namaTanaman) {
      Alert.alert(
        'Data belum lengkap',
        'Masukkan nama tanaman terlebih dahulu.'
      );
      return;
    }

    // Hilangkan jam supaya perhitungan hanya berdasarkan tanggal
    const tanam = new Date(tanggalTanam);
    const panen = new Date(tanggalPanen);

    tanam.setHours(0, 0, 0, 0);
    panen.setHours(0, 0, 0, 0);

    // Hitung selisih hari
    const selisihWaktu = panen.getTime() - tanam.getTime();
    const umurTanaman = Math.ceil(
      selisihWaktu / (1000 * 60 * 60 * 24)
    );

    if (umurTanaman <= 0) {
      Alert.alert(
        'Tanggal tidak valid',
        'Tanggal panen harus setelah tanggal tanam.'
      );
      return;
    }

    setHasil({
      tanaman: namaTanaman,
      tanggalTanam: new Date(tanggalTanam),
      tanggalPanen: new Date(tanggalPanen),
      umur: umurTanaman,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >

      {/* ==============================
          JUDUL
      ============================== */}

      <Text style={styles.title}>
        Prediksi Panen 🌱
      </Text>

      <Text style={styles.subtitle}>
        Masukkan nama tanaman, tanggal tanam,
        dan perkiraan tanggal panen.
      </Text>


      {/* ==============================
          NAMA TANAMAN
      ============================== */}

      <Text style={styles.label}>
        Nama tanaman
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Contoh: Bawang merah"
        value={tanaman}
        onChangeText={setTanaman}
        autoCapitalize="words"
      />


      {/* ==============================
          TANGGAL TANAM
      ============================== */}

      <Text style={styles.label}>
        Tanggal tanam
      </Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowTanggalTanam(true)}
      >
        <Text style={styles.calendarIcon}>
          📅
        </Text>

        <View style={styles.dateContent}>
          <Text style={styles.dateLabel}>
            Pilih tanggal tanam
          </Text>

          <Text style={styles.dateValue}>
            {formatTanggal(tanggalTanam)}
          </Text>
        </View>
      </TouchableOpacity>


      {showTanggalTanam && (
        <DateTimePicker
          value={tanggalTanam}
          mode="date"
          display={
            Platform.OS === 'ios'
              ? 'spinner'
              : 'default'
          }
          onChange={handleTanggalTanamChange}
        />
      )}


      {/* ==============================
          TANGGAL PANEN
      ============================== */}

      <Text style={styles.label}>
        Perkiraan tanggal panen
      </Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowTanggalPanen(true)}
      >
        <Text style={styles.calendarIcon}>
          🌾
        </Text>

        <View style={styles.dateContent}>
          <Text style={styles.dateLabel}>
            Pilih tanggal panen
          </Text>

          <Text style={styles.dateValue}>
            {formatTanggal(tanggalPanen)}
          </Text>
        </View>
      </TouchableOpacity>


      {showTanggalPanen && (
        <DateTimePicker
          value={tanggalPanen}
          mode="date"
          display={
            Platform.OS === 'ios'
              ? 'spinner'
              : 'default'
          }
          onChange={handleTanggalPanenChange}
        />
      )}


      {/* ==============================
          KETERANGAN
      ============================== */}

      <Text style={styles.hint}>
        Tentukan sendiri perkiraan tanggal panen
        berdasarkan jenis tanaman dan kondisi
        tanaman yang kamu tanam.
      </Text>


      {/* ==============================
          BUTTON
      ============================== */}

      <TouchableOpacity
        style={styles.button}
        onPress={handlePrediksi}
      >
        <Text style={styles.buttonText}>
          🔮 Lihat Prediksi
        </Text>
      </TouchableOpacity>


      {/* ==============================
          HASIL
      ============================== */}

      {hasil && (
        <View style={styles.resultCard}>

          <Text style={styles.resultTitle}>
            Hasil Prediksi 🌾
          </Text>


          {/* TANAMAN */}

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Tanaman
            </Text>

            <Text style={styles.resultValue}>
              {hasil.tanaman}
            </Text>
          </View>


          {/* TANGGAL TANAM */}

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Tanggal tanam
            </Text>

            <Text style={styles.resultValue}>
              {formatTanggal(hasil.tanggalTanam)}
            </Text>
          </View>


          {/* TANGGAL PANEN */}

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Perkiraan panen
            </Text>

            <Text style={styles.harvestDate}>
              {formatTanggal(hasil.tanggalPanen)}
            </Text>
          </View>


          {/* UMUR TANAMAN */}

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Perkiraan umur tanaman
            </Text>

            <Text style={styles.resultValue}>
              ± {hasil.umur} hari
            </Text>
          </View>


          {/* CATATAN */}

          <View style={styles.infoBox}>

            <Text style={styles.infoTitle}>
              💡 Catatan
            </Text>

            <Text style={styles.infoText}>
              Tanggal panen merupakan perkiraan yang
              ditentukan berdasarkan informasi dari
              petani. Waktu panen sebenarnya dapat
              berbeda karena varietas, kondisi tanah,
              perawatan, dan cuaca.
            </Text>

          </View>

        </View>
      )}

    </ScrollView>
  );
}


// ========================================
// FORMAT TANGGAL
// ========================================

function formatTanggal(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}


// ========================================
// STYLE
// ========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F7F2',
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#33422C',
  },

  subtitle: {
    fontSize: 13,
    color: '#7A8873',
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    marginBottom: 20,
  },

  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  calendarIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  dateContent: {
    flex: 1,
  },

  dateLabel: {
    fontSize: 11,
    color: '#7A8873',
    marginBottom: 2,
  },

  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#33422C',
  },

  hint: {
    fontSize: 11,
    color: '#7A8873',
    lineHeight: 16,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#6B8E5A',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D0D8C8',
    padding: 18,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 15,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EA',
  },

  resultLabel: {
    fontSize: 13,
    color: '#7A8873',
    flex: 1,
  },

  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#33422C',
    maxWidth: '60%',
    textAlign: 'right',
  },

  harvestDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B8E5A',
    maxWidth: '60%',
    textAlign: 'right',
  },

  infoBox: {
    backgroundColor: '#F5F7F2',
    borderRadius: 10,
    padding: 13,
    marginTop: 18,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 5,
  },

  infoText: {
    fontSize: 12,
    color: '#65705F',
    lineHeight: 18,
  },

});