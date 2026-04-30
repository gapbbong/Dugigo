const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pwyflwjtafarkwbejoen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eWZsd2p0YWZhcmt3YmVqb2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNTIzMSwiZXhwIjoyMDg3MjExMjMxfQ.DWtKZHpkM9D-mR26mG1ncrVHi2vxIre3l7-9bH4IVEE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    const { data, error } = await supabase
        .from('teachers')
        .select('name, assigned_class, sub_grade, sub_class')
        .order('name');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total teachers in DB: ${data.length}`);
    const withSub = data.filter(t => t.sub_grade !== null);
    console.log(`Teachers with sub assignment: ${withSub.length}`);
    console.log(JSON.stringify(withSub, null, 2));

    const withMain = data.filter(t => t.assigned_class !== null);
    console.log(`Teachers with homeroom assignment: ${withMain.length}`);
}

verify();
