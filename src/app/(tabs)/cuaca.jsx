import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getWeather, getWeatherText } from '../../lib/weather';

export default function Cuaca() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const latitude = -7.2575;
  const longitude = 112.7521;

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      setLoading(true);

      const data = await getWeather(latitude, longitude);

      console.log('DATA CUACA:', data);

      setWeather(data);
    } catch (error) {
      console.log('ERROR CUACA:', error);

      Alert.alert(
        'Gagal memuat cuaca',
        'Data cuaca tidak dapat diambil.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B8E5A" />
        <Text style={styles.loadingText}>
          Mengambil data cuaca...
        </Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.center}>
        <Text>Data cuaca tidak tersedia.</Text>
      </View>
    );
  }

  const current = weather.current;
  const daily = weather.daily;

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Cuaca 🌦️</Text>

      <Text style={styles.location}>
        Perkiraan cuaca 7 hari
      </Text>

      {/* CUACA SEKARANG */}
      <View style={styles.currentCard}>

        <Text style={styles.currentTitle}>
          Kondisi sekarang
        </Text>

        <Text style={styles.weatherIcon}>
          {getWeatherIcon(current.weather_code)}
        </Text>

        <Text style={styles.temperature}>
          {Math.round(current.temperature_2m)}°C
        </Text>

        <Text style={styles.condition}>
          {getWeatherText(current.weather_code)}
        </Text>

        <View style={styles.infoRow}>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              Kelembapan
            </Text>

            <Text style={styles.infoValue}>
              {current.relative_humidity_2m}%
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              Terasa
            </Text>

            <Text style={styles.infoValue}>
              {Math.round(current.apparent_temperature)}°C
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              Angin
            </Text>

            <Text style={styles.infoValue}>
              {Math.round(current.wind_speed_10m)} km/j
            </Text>
          </View>

        </View>
      </View>

      {/* PERINGATAN */}
      {getWarning(daily) && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>
            ⚠️ Perhatian
          </Text>

          <Text style={styles.warningText}>
            {getWarning(daily)}
          </Text>
        </View>
      )}

      {/* FORECAST */}
      <Text style={styles.sectionTitle}>
        Prakiraan 7 Hari
      </Text>

      <FlatList
        data={daily.time}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {

          const rain =
            daily.precipitation_probability_max[index];

          const code =
            daily.weather_code[index];

          return (
            <View style={styles.dayCard}>

              <View style={styles.dayLeft}>

                <Text style={styles.date}>
                  {formatDate(item)}
                </Text>

                <Text style={styles.dayCondition}>
                  {getWeatherIcon(code)}{' '}
                  {getWeatherText(code)}
                </Text>

              </View>

              <View style={styles.dayRight}>

                <Text style={styles.temp}>
                  {Math.round(
                    daily.temperature_2m_max[index]
                  )}°
                  {' / '}
                  {Math.round(
                    daily.temperature_2m_min[index]
                  )}°
                </Text>

                <Text style={styles.rain}>
                  💧 {rain}% hujan
                </Text>

              </View>

            </View>
          );
        }}
      />

    </View>
  );
}


// ================================
// ICON CUACA
// ================================

function getWeatherIcon(code) {

  if (code === 0) return '☀️';

  if ([1, 2, 3].includes(code))
    return '⛅';

  if ([45, 48].includes(code))
    return '🌫️';

  if ([51, 53, 55].includes(code))
    return '🌦️';

  if ([61, 63, 65].includes(code))
    return '🌧️';

  if ([80, 81, 82].includes(code))
    return '🌧️';

  if ([95, 96, 99].includes(code))
    return '⛈️';

  return '🌤️';
}


// ================================
// FORMAT TANGGAL
// ================================

function formatDate(dateString) {

  const date = new Date(dateString);

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}


// ================================
// PERINGATAN CUACA
// ================================

function getWarning(daily) {

  for (let i = 0; i < daily.time.length; i++) {

    const rain =
      daily.precipitation_probability_max[i];

    const code =
      daily.weather_code[i];

    if ([95, 96, 99].includes(code)) {
      return 'Ada kemungkinan badai petir dalam beberapa hari ke depan.';
    }

    if (rain >= 80) {
      return 'Kemungkinan hujan cukup tinggi dalam beberapa hari ke depan.';
    }

    if ([65, 82].includes(code)) {
      return 'Diperkirakan terjadi hujan deras pada salah satu hari.';
    }
  }

  return null;
}


// ================================
// STYLE
// ================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F7F2',
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B8E5A',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33422C',
  },

  location: {
    fontSize: 13,
    color: '#7A8873',
    marginTop: 4,
    marginBottom: 18,
  },

  currentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    marginBottom: 14,
  },

  currentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A8873',
  },

  weatherIcon: {
    fontSize: 55,
    marginTop: 8,
  },

  temperature: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#33422C',
  },

  condition: {
    fontSize: 16,
    color: '#6B8E5A',
    fontWeight: '600',
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },

  infoBox: {
    alignItems: 'center',
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: '#7A8873',
  },

  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#33422C',
    marginTop: 3,
  },

  warningBox: {
    backgroundColor: '#FFF4D8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E8D39A',
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A6415',
    marginBottom: 4,
  },

  warningText: {
    fontSize: 12.5,
    color: '#6E571F',
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#33422C',
    marginBottom: 10,
  },

  list: {
    paddingBottom: 30,
  },

  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#D0D8C8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dayLeft: {
    flex: 1,
  },

  date: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#33422C',
  },

  dayCondition: {
    fontSize: 12,
    color: '#6B8E5A',
    marginTop: 5,
  },

  dayRight: {
    alignItems: 'flex-end',
  },

  temp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#33422C',
  },

  rain: {
    fontSize: 11,
    color: '#64809A',
    marginTop: 4,
  },

});