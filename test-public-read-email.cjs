const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dwwhqkowmyrdauzygztb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3d2hxa293bXlyZGF1enlnenRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDgwODksImV4cCI6MjA4OTEyNDA4OX0.BG48KWhJC4kD6IAAVGjtH4S26aO80Y-7124WKSgRGvc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPublicSelectEmail() {
    const { data, error } = await supabase.from('perfiles').select('*').eq('email', 'estudiante.prueba@sisinfo.edu.co').single();
    if (error) {
        console.error('Error selecting from perfiles:', error.message);
    } else {
        console.log('Successfully read profile:', data);
    }
}

testPublicSelectEmail();
