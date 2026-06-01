import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Get Authorization token from request headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // 2. Authenticate the user with Supabase using their token
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    // 3. Verify user's role (must be teacher/admin or specific kakao email)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: profileError } = await serviceClient
      .from('dukigo_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isTeacher = profile && (profile.role?.toLowerCase() === 'teacher' || profile.role?.toLowerCase() === 'admin');
    const isOwner = user.email?.toLowerCase() === 'serv@kakao.com';
    
    if (!isTeacher && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
    }
    
    // 4. Fetch all study logs using service client to bypass RLS
    const { data: logs, error: logsError } = await serviceClient
      .from('dukigo_study_logs')
      .select('*');
      
    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }
    
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
