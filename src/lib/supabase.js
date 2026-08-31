import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ ERROR: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY). Por favor confíguralas en Vercel o en tu archivo .env.');
}

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder');

// ==========================================
// AUTENTICACIÓN
// ==========================================
export async function iniciarSesionConGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            queryParams: {
                hd: 'unipaz.edu.co',
                prompt: 'select_account'
            },
            redirectTo: `${window.location.origin}/login`
        }
    });
    if (error) throw error;
    return data;
}

export async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function obtenerSesionActual() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    if (error) return null;
    return { session, perfil };
}

// ==========================================
// PERFILES Y USUARIOS
// ==========================================
export async function actualizarPerfil(id, updates, isProfileId = false) {
    try {
        const query = supabase.from('perfiles').update(updates);
        
        if (isProfileId) {
            query.eq('id', id);
        } else {
            query.eq('user_id', id);
        }

        const { data, error } = await query.select();
        
        if (error) {
            console.error("Error de Supabase en actualizarPerfil:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error("No se pudo encontrar el perfil para actualizar.");
        }

        return data[0];
    } catch (err) {
        console.error("Error crítico en actualizarPerfil:", err.message);
        throw err;
    }
}

export async function obtenerDocentes() {
    const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, linea_investigacion')
        .eq('rol', 'docente');
    if (error) throw error;
    return data;
}

export async function obtenerTodosPerfiles() {
    const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function obtenerTodosUsuarios() {
    return obtenerTodosPerfiles();
}

export async function eliminarUsuario(perfilId) {
    const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', perfilId);
    if (error) throw error;
}

// ==========================================
// NOTIFICACIONES
// ==========================================
export async function obtenerNotificaciones(perfilId) {
    const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', perfilId)
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) return [];
    return data || [];
}

export async function marcarNotificacionLeida(notificacionId) {
    const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', notificacionId);
    if (error) throw error;
}

export async function marcarTodasLeidas(perfilId) {
    const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', perfilId)
        .eq('leida', false);
    if (error) throw error;
}

// ==========================================
// GESTIÓN DE CONTENIDO PÚBLICO (INICIO)
// ==========================================
export async function obtenerNoticias() {
    const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
}

export async function crearNoticia(noticia) {
    const { data, error } = await supabase
        .from('noticias')
        .insert(noticia)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function actualizarNoticia(id, updates) {
    const { data, error } = await supabase
        .from('noticias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function eliminarNoticia(id) {
    const { error } = await supabase
        .from('noticias')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export async function obtenerEventos(tipo = null) {
    let query = supabase.from('eventos').select('*').order('fecha_evento', { ascending: true });
    if (tipo) query = query.eq('tipo', tipo);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function crearEvento(evento) {
    const { data, error } = await supabase
        .from('eventos')
        .insert(evento)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function actualizarEvento(id, updates) {
    const { data, error } = await supabase
        .from('eventos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function eliminarEvento(id) {
    const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export async function obtenerGaleria() {
    const { data, error } = await supabase
        .from('galeria')
        .select('*, eventos(titulo)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function crearGaleria(item) {
    const { data, error } = await supabase
        .from('galeria')
        .insert(item)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function eliminarGaleria(id) {
    const { error } = await supabase
        .from('galeria')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ==========================================
// MÓDULOS DE APRENDIZAJE
// ==========================================
export async function obtenerModulos() {
    const { data, error } = await supabase
        .from('modulos')
        .select('*')
        .order('nombre', { ascending: true });
    if (error) throw error;
    return data;
}

export async function obtenerContenidosModulo(moduloId) {
    const { data, error } = await supabase
        .from('contenidos_modulos')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function crearContenidoModulo(contenido) {
    const { data, error } = await supabase
        .from('contenidos_modulos')
        .insert(contenido)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function actualizarContenidoModulo(id, updates) {
    const { data, error } = await supabase
        .from('contenidos_modulos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function eliminarContenidoModulo(id) {
    const { error } = await supabase
        .from('contenidos_modulos')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ==========================================
// ESTADÍSTICAS DEL SISTEMA
// ==========================================
export async function obtenerEstadisticasAdmin() {
    try {
        const { count: totalEstudiantes } = await supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante');
        const { count: totalDocentes } = await supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'docente');
        const { count: totalOvas } = await supabase.from('ovas').select('*', { count: 'exact', head: true });
        const { count: totalEvaluaciones } = await supabase.from('resultados_ovas').select('*', { count: 'exact', head: true });

        return {
            totalUsers: (totalEstudiantes || 0) + (totalDocentes || 0),
            totalStudents: totalEstudiantes || 0,
            totalTeachers: totalDocentes || 0,
            totalOvas: totalOvas || 0,
            totalEvaluaciones: totalEvaluaciones || 0
        };
    } catch (err) {
        console.error("Error al obtener estadísticas:", err);
        return {
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalOvas: 0,
            totalEvaluaciones: 0
        };
    }
}

// ==========================================
// HELPERS DE SEGURIDAD Y VALIDACIÓN
// ==========================================
const FILE_LIMIT_MB = 10;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'html'];

function validarArchivo(file) {
    if (!file) throw new Error("No se ha proporcionado ningún archivo");
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > FILE_LIMIT_MB) {
        throw new Error(`El archivo es demasiado grande (Máximo ${FILE_LIMIT_MB}MB)`);
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`Extensión de archivo .${ext} no permitida`);
    }
}

export async function descargarArchivo(fullUrl, fileName) {
    try {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName || 'recurso';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Error al descargar archivo:', error.message);
        window.open(fullUrl, '_blank');
    }
}

// ==========================================
// GESTIÓN DE OVAs (Aula Virtual)
// ==========================================
export async function obtenerOvaPorId(id) {
    const { data, error } = await supabase
        .from('ovas')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function obtenerOvasModulo(moduloId) {
    const { data, error } = await supabase
        .from('ovas')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function crearOva(ovaData) {
    const { data, error } = await supabase
        .from('ovas')
        .insert([ovaData])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function actualizarOva(id, ovaData) {
    const { data, error } = await supabase
        .from('ovas')
        .update({ ...ovaData, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function eliminarOva(id) {
    const { error } = await supabase
        .from('ovas')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export async function subirArchivoOva(file, pathPrefix = 'ovas') {
    validarArchivo(file);
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    let contentType = file.type;
    if (fileExt.toLowerCase() === 'html' || fileExt.toLowerCase() === 'htm') {
        contentType = 'text/html; charset=utf-8';
    }

    const { error: uploadError } = await supabase.storage
        .from('ovas-publico')
        .upload(fileName, file, { 
            upsert: false,
            contentType: contentType 
        });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
        .from('ovas-publico')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

// ==========================================
// SEGUIMIENTO Y MÉTRICAS DE OVAs
// ==========================================
export async function registrarResultadoOva(perfilId, ovaId, puntaje, aprobado, respuestasDetalle = null) {
    try {
        const { data: current } = await supabase
            .from('resultados_ovas')
            .select('mejor_puntaje, intentos, completado, respuestas_detalle')
            .eq('perfil_id', perfilId)
            .eq('ova_id', ovaId)
            .single();

        const intentos = (current?.intentos || 0) + 1;
        const mejorPuntaje = Math.max(current?.mejor_puntaje || 0, puntaje);
        const finalRespuestasDetalle = respuestasDetalle !== null ? respuestasDetalle : (current?.respuestas_detalle || null);

        const { data, error } = await supabase
            .from('resultados_ovas')
            .upsert({
                perfil_id: perfilId,
                ova_id: ovaId,
                intentos,
                mejor_puntaje: mejorPuntaje,
                ultima_calificacion: puntaje,
                completado: aprobado || (current?.completado || false),
                respuestas_detalle: finalRespuestasDetalle,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'perfil_id, ova_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error al registrar resultado OVA:", err.message);
        throw err;
    }
}

export async function obtenerSeguimientoOvas() {
    try {
        const { data, error } = await supabase
            .from('resultados_ovas')
            .select(`
                *,
                perfil:perfil_id ( id, nombre, apellido, email ),
                ova:ova_id ( id, titulo, tipo, modulo_id, modulos:modulo_id ( id, nombre ) )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error al obtener seguimiento OVAs:", err.message);
        throw err;
    }
}

export async function obtenerMisResultadosOvas(perfilId) {
    try {
        const { data, error } = await supabase
            .from('resultados_ovas')
            .select(`
                *,
                ova:ova_id (
                    id,
                    titulo,
                    descripcion,
                    imagen_portada,
                    tipo,
                    modulo_id,
                    modulos:modulo_id ( id, nombre )
                )
            `)
            .eq('perfil_id', perfilId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error al obtener resultados del estudiante:", err.message);
        return [];
    }
}

export async function eliminarResultadoOva(id) {
    const { error } = await supabase
        .from('resultados_ovas')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export async function eliminarTodoSeguimiento() {
    const { error } = await supabase
        .from('resultados_ovas')
        .delete()
        .neq('id', 0);
    if (error) throw error;
}
