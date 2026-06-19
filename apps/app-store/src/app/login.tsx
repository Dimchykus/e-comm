import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import {
  useAuthControllerLogin,
  type LoginDto,
  type PublicUserDto,
} from '@/api';
import { useSession } from '@/auth';

// The gateway returns the signed-in user plus a bearer token, but its OpenAPI
// response has no schema so Orval types the body as `void`. Describe it here.
type LoginResponse = { user: PublicUserDto; accessToken: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const { signIn } = useSession();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({ defaultValues: { email: '', password: '' } });

  const login = useAuthControllerLogin();

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await login.mutateAsync({ data: values });
      const { accessToken, user } = res.data as unknown as LoginResponse;
      await signIn(accessToken, user);
      // The root layout's Stack.Protected guard flips to the authenticated
      // group and redirects automatically — no manual navigation needed.
    } catch {
      setError('root', {
        message: 'Invalid email or password. Please try again.',
      });
    }
  });

  const placeholderColor = colorScheme === 'dark' ? '#B0B4BA' : '#60646C';

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <SafeAreaView className="flex-1 w-full max-w-[800px] self-center px-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="flex-grow justify-center gap-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-[32px] leading-[44px] font-semibold text-black dark:text-white mb-1">
              Welcome back
            </Text>
            <Text className="text-sm font-medium text-[#60646C] dark:text-[#B0B4BA]">
              Sign in to continue
            </Text>

            <View className="gap-4 mt-2">
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: EMAIL_PATTERN,
                    message: 'Enter a valid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="gap-1">
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor={placeholderColor}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      inputMode="email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      className="h-[52px] rounded-2xl px-4 text-base text-black dark:text-white bg-[#F0F0F3] dark:bg-[#212225]"
                    />
                    {errors.email && (
                      <Text className="text-sm text-[#E5484D]">
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="gap-1">
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor={placeholderColor}
                      autoCapitalize="none"
                      autoComplete="password"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      onSubmitEditing={onSubmit}
                      returnKeyType="go"
                      className="h-[52px] rounded-2xl px-4 text-base text-black dark:text-white bg-[#F0F0F3] dark:bg-[#212225]"
                    />
                    {errors.password && (
                      <Text className="text-sm text-[#E5484D]">
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

            {errors.root && (
              <Text className="text-sm text-[#E5484D]">
                {errors.root.message}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onSubmit}
              className="h-[52px] rounded-2xl bg-[#208AEF] items-center justify-center mt-2 active:opacity-70 disabled:opacity-70"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Sign in
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
