import { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { loginWithEmail, auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch(err => {
          Alert.alert('Google Sign-In Error', err.message);
        });
      }
    }
  }, [response]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-12 gap-8 items-center w-full">

            {/* Logo area */}
            <View className="items-center gap-2">
              <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center shadow-sm">
                <Text className="text-primary-foreground text-3xl font-bold tracking-widest">T</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground tracking-tight mt-2">
                Skeleton
              </Text>
            </View>

            {/* Login Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your workspace account
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-5">
                
                <View className="gap-2">
                  <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </Text>
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholder="you@company.com"
                    editable={!loading}
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Password
                  </Text>
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    editable={!loading}
                    onSubmitEditing={handleEmailLogin}
                  />
                </View>

                <Button
                  onPress={handleEmailLogin}
                  disabled={loading}
                  className="mt-2"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="font-medium text-white">Sign In</Text>
                  )}
                </Button>

                <Button variant="ghost" disabled={loading} onPress={() => {}}>
                  <Text>Forgot password?</Text>
                </Button>

                {/* Divider */}
                <View className="flex-row items-center gap-3 mt-2">
                  <View className="flex-1 h-px bg-border" />
                  <Text className="text-xs text-muted-foreground uppercase">OR</Text>
                  <View className="flex-1 h-px bg-border" />
                </View>

                {/* Google */}
                <Button
                  variant="outline"
                  onPress={() => promptAsync()}
                  disabled={!request || loading}
                >
                  <Text className="font-medium text-foreground">Continue with Google</Text>
                </Button>

                {/* Sign up link */}
                <View className="flex-row justify-center mt-2 gap-1">
                  <Text className="text-muted-foreground">Don't have an account?</Text>
                  <Link href="/(auth)/signup" asChild>
                    <TouchableOpacity>
                      <Text className="text-primary font-semibold">Sign up</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

              </CardContent>
            </Card>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
