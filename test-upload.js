import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dwwhqkowmyrdauzygztb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3d2hxa293bXlyZGF1enlnenRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDgwODksImV4cCI6MjA4OTEyNDA4OX0.BG48KWhJC4kD6IAAVGjtH4S26aO80Y-7124WKSgRGvc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
    const content = 'Test content';
    const fileName = `test-${Date.now()}.txt`;
    
    console.log(`Attempting to upload ${fileName} to documentos-proyectos...`);
    
    const { data, error } = await supabase.storage
        .from('documentos-proyectos')
        .upload(fileName, content, { contentType: 'text/plain' });
        
    if (error) {
        console.error('Upload error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Upload success:', data);
        
        const { data: urlData } = supabase.storage
            .from('documentos-proyectos')
            .getPublicUrl(fileName);
        console.log('Public URL:', urlData.publicUrl);
    }
}

testUpload();
