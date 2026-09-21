import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('petani');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    console.log('=== TOMBOL DAFTAR DIKLIK ===');

    const namaBersih = nama.trim();
    const emailBersih = email.trim().toLowerCase();

    if (!namaBersih || !emailBersih || !password) {
      Alert.alert(
        'Peringatan',
        'Nama, email, dan password wajib diisi!'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Peringatan',
        'Password minimal 6 karakter!'
      );
      return;
    }

    setLoading(true);

    console.log('Register dengan:', {
      nama: namaBersih,
      email: emailBersih,
      role: role,
    });

    const { data, error } = await supabase.auth.signUp({
      email: emailBersih,
      password: password,
      options: {
        data: {
          nama: namaBersih,
          role: role,
        },
      },
    });

    setLoading(false);

    console.log('DATA SUPABASE:', data);
    console.log('ERROR SUPABASE:', error);

    if (error) {
      Alert.alert(
        'Register gagal',
        error.message
      );
      return;
    }

    Alert.alert(
      'Berhasil! 🌱',
      'Akun berhasil dibuat. Silakan cek email jika verifikasi diperlukan.'
    );

    // Kosongkan form
    setNama('');
    setEmail('');
    setPassword('');
    setRole('petani');

    // Pindah otomatis ke halaman Login
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>

        <Text style={styles.title}>
          Daftar SahabatTani 🌱
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nama"
          value={nama}
          onChangeText={setNama}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          Daftar sebagai:
        </Text>

        <View style={styles.roleContainer}>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === 'petani' && styles.roleActive,
            ]}
            onPress={() => setRole('petani')}
            disabled={loading}
          >
            <Text style={styles.roleText}>
              🌱 Petani
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === 'pakar' && styles.roleActive,
            ]}
            onPress={() => setRole('pakar')}
            disabled={loading}
          >
            <Text style={styles.roleText}>
              👨‍🌾 Pakar
            </Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Mendaftar...' : 'Daftar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => router.replace('/login')}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            Sudah punya akun? Masuk di sini
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
  },

  form: {
    width: '100%',
    maxWidth: 500,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8C8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    fontSize: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  roleButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#AAB5A0',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  roleActive: {
    backgroundColor: '#DDEBD5',
    borderColor: '#6B8E5A',
  },

  roleText: {
    fontSize: 16,
  },

  registerButton: {
    backgroundColor: '#6B8E5A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },

  registerButtonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  switchLink: {
    marginTop: 18,
    alignItems: 'center',
  },

  switchText: {
    color: '#6B8E5A',
    fontSize: 14,
    fontWeight: '600',
  },
});