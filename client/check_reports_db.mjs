import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the current directory
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReports() {
    console.log('Checking dukigo_question_reports table...');
    const { data, error } = await supabase
        .from('dukigo_question_reports')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching reports:', error.message);
        if (error.message.includes('relation "dukigo_question_reports" does not exist')) {
            console.log('The table "dukigo_question_reports" is missing!');
        }
    } else {
        console.log('Table exists. Sample data:', data);
    }
}

checkReports();
