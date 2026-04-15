import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

// ngrok 터널을 통해 자체 호스팅 Supabase에 접근할 때
// ngrok 브라우저 경고 인터스티셜 페이지를 건너뛰기 위한 커스텀 fetch
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const headers = new Headers(options?.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  return fetch(url, { ...options, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'dugigo-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});
