import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * Base URL for the API Gateway. Override per environment with the
 * EXPO_PUBLIC_API_URL env var (Expo exposes EXPO_PUBLIC_* to the app at build
 * time). Defaults to the local gateway used in development.
 */
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * The Orval-generated hooks call the global `axios` export directly (no mutator
 * override is configured), so we configure that same global instance here.
 * `AXIOS_INSTANCE` is re-exported for callers that need the raw client.
 */
axios.defaults.baseURL = baseURL;

export const AXIOS_INSTANCE = axios;

let authToken: string | null = null;

/**
 * Set (or clear) the bearer token used for authenticated requests. Call this
 * after login with the access token returned by /auth/login, and with `null`
 * on logout. The auth layer (`@/auth`) wires this up automatically.
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

axios.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

/**
 * Mutator used by Orval-generated hooks. Returns the response body directly and
 * exposes a `.cancel()` so react-query can abort in-flight requests.
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error attach cancel for react-query cancellation support
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default customInstance;

// Error type surfaced to react-query (error / mutation generics).
export type ErrorType<Error> = AxiosError<Error>;

// Body type for mutations (matches the second arg of customInstance).
export type BodyType<BodyData> = BodyData;
