import { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Link } from 'expo-router';
import { signupWithEmail } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signupWithEmail(email, password);
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message);
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

            {/* Signup Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Get started with your Skeleton workspace
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
                    onSubmitEditing={handleSignup}
                  />
                </View>

                <Button
                  onPress={handleSignup}
                  disabled={loading}
                  className="mt-2"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="font-medium text-white">Sign Up</Text>
                  )}
                </Button>

                {/* Sign in link */}
                <View className="flex-row justify-center mt-2 gap-1">
                  <Text className="text-muted-foreground">Already have an account?</Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text className="text-primary font-semibold">Sign in</Text>
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
