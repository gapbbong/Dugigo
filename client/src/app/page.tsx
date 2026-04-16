import { redirect } from 'next/navigation';

// 루트 페이지는 로그인으로 리다이렉트
export default function RootPage() {
  redirect('/login');
}
