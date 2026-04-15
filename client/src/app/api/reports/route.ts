import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/reports — 문항 오류 제보 등록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question_id, subject, year, round, question_num, user_id, report_type, comment } = body;

    if (!question_id || !report_type) {
      return NextResponse.json({ error: 'question_id and report_type are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('question_reports')
      .insert({ question_id, subject, year, round, question_num, user_id, report_type, comment })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, report: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/reports — 어드민용 전체 제보 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data, error } = await supabaseAdmin
      .from('question_reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ reports: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/reports — 상태 변경 (resolved / ignored)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolver_note } = body;

    const { error } = await supabaseAdmin
      .from('question_reports')
      .update({ status, resolver_note, resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
