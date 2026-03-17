const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dwwhqkowmyrdauzygztb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3d2hxa293bXlyZGF1enlnenRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDgwODksImV4cCI6MjA4OTEyNDA4OX0.BG48KWhJC4kD6IAAVGjtH4S26aO80Y-7124WKSgRGvc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PASSWORDS = ['password123', 'admin123', 'unipaz123', 'sisinfo123', '12345678', 'Carlos123', 'Beatriz123'];
const USERS = ['estudiante.prueba@sisinfo.edu.co', 'docente@semillero.com'];

async function testPasswords() {
    for (const email of USERS) {
        console.log(`Testing email: ${email}`);
        for (const password of PASSWORDS) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error) {
                console.log(`✅ SUCCESS! ${email} -> ${password}`);
                return;
            }
        }
    }
    console.log('❌ All common passwords failed.');
}

testPasswords();
