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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('=== TOMBOL MASUK DIKLIK ===');

    const emailBersih = email.trim().toLowerCase();

    if (!emailBersih || !password) {
      Alert.alert(
        'Peringatan',
        'Email dan password wajib diisi!'
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

    console.log('Login dengan:', {
      email: emailBersih,
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailBersih,
      password: password,
    });

    setLoading(false);

    console.log('DATA SUPABASE:', data);
    console.log('ERROR SUPABASE:', error);

    if (error) {
      Alert.alert(
        'Masuk gagal',
        error.message
      );
      return;
    }

    // Kosongkan form
    setEmail('');
    setPassword('');

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>

        <Text style={styles.title}>
          Masuk SahabatTani 🌱
        </Text>

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

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Masuk...' : 'Masuk'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => router.replace('/register')}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            Belum punya akun? Daftar di sini
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

  loginButton: {
    backgroundColor: '#6B8E5A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },

  loginButtonDisabled: {
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