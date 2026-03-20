import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// AUTH
export async function registrarUsuario(data) {
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });
        
        if (authError) {
            // Si es error de rate limit, lanzamos para manejarlo en el catch
            if (authError.message.includes('rate limit')) throw authError;
            throw authError;
        }

        const { error: perfilError } = await supabase.from('perfiles').insert({
            user_id: authData.user.id,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            rol: data.rol,
            carrera: data.carrera || null,
            semestre: data.semestre || null,
            linea_investigacion: data.linea_investigacion || null,
        });
        if (perfilError) throw perfilError;

        return authData;
    } catch (error) {
        if (error.message.includes('rate limit')) {
            console.warn("Rate limit excedido. Creando perfil en modo bypass...");
            // Crear un ID temporal para el bypass
            const tempUserId = crypto.randomUUID();
            const { data: perfil, error: perfilError } = await supabase.from('perfiles').insert({
                user_id: tempUserId,
                nombre: data.nombre,
                apellido: data.apellido,
                email: data.email,
                rol: data.rol,
                carrera: data.carrera || null,
                semestre: data.semestre || null,
                linea_investigacion: data.linea_investigacion || null,
                bypass_password: data.password
            }).select().single();

            if (perfilError) throw perfilError;
            
            return { 
                user: { id: tempUserId, email: data.email }, 
                isBypass: true,
                message: "Usuario creado en modo desarrollo (bypass) debido a límites de Supabase."
            };
        }
        throw error;
    }
}

export async function iniciarSesion(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

// PERFILES
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
            // Último recurso: intentar por email si tenemos el email en updates
            if (updates.email) {
                console.warn("No se encontró el perfil, intentando por email...");
                const { data: dataEmail, error: errorEmail } = await supabase
                    .from('perfiles')
                    .update(updates)
                    .ilike('email', updates.email)
                    .select();
                
                if (errorEmail) throw errorEmail;
                return dataEmail?.[0];
            }
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

// PROYECTOS
export async function obtenerProyectosEstudiante(perfilId) {
    const { data, error } = await supabase
        .from('proyectos')
        .select(`
            *,
            docente:docente_id ( nombre, apellido ),
            versiones_proyecto ( id, nombre_archivo, version, documento_url, comentario_estudiante, created_at ),
            observaciones ( id, texto, created_at, docente:docente_id ( nombre, apellido ) )
        `)
        .eq('estudiante_id', perfilId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function obtenerProyectosDocente(docenteId) {
    const { data, error } = await supabase
        .from('proyectos')
        .select(`
            *,
            estudiante:estudiante_id ( nombre, apellido ),
            versiones_proyecto ( id, nombre_archivo, version, documento_url, comentario_estudiante, created_at ),
            observaciones ( id, texto, created_at, docente:docente_id ( nombre, apellido ) )
        `)
        .eq('docente_id', docenteId)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function crearProyecto({ nombre, estado, estudianteId, docenteId, linea_investigacion }) {
    const { data, error } = await supabase
        .from('proyectos')
        .insert({ nombre, estado, estudiante_id: estudianteId, docente_id: docenteId, linea_investigacion })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function eliminarProyecto(proyectoId) {
    try {
        const { error } = await supabase.from('proyectos').delete().eq('id', proyectoId);
        if (error) {
            console.error("Error de Supabase en eliminarProyecto:", error.message);
            throw error;
        }
    } catch (err) {
        console.error("Error crítico en eliminarProyecto:", err.message);
        throw err;
    }
}

export async function enviarObservacion(proyectoId, docenteId, texto) {
    const { data, error } = await supabase
        .from('observaciones')
        .insert({ proyecto_id: proyectoId, docente_id: docenteId, texto })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function finalizarProyecto(proyectoId, finalFile, perfilId) {
    const versionData = await subirDocumento(finalFile, proyectoId, perfilId, "Versión final aprobada");
    const { data, error } = await supabase
        .from('proyectos')
        .update({
            terminado: true,
            estado: 'aplicacion',
            updated_at: new Date().toISOString()
        })
        .eq('id', proyectoId)
        .select()
        .single();

    if (error) throw error;
    return { proyecto: data, version: versionData };
}

export async function actualizarEstadoProyecto(proyectoId, estado) {
    const { data, error } = await supabase
        .from('proyectos')
        .update({ estado })
        .eq('id', proyectoId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// VERSIONES
export const subirDocumento = async (file, proyectoId, estudianteId, comentario = null) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${proyectoId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('documentos-proyectos')
        .upload(fileName, file, { 
            upsert: false,
            contentType: file.type 
        });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
        .from('documentos-proyectos')
        .getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // 3. Crear registro en versiones_proyecto
    const { data: versionData, error: versionError } = await supabase
        .from('versiones_proyecto')
        .insert([{
            proyecto_id: proyectoId,
            documento_url: publicUrl,
            nombre_archivo: file.name,
            comentario_estudiante: comentario
        }])
        .select('*')
        .single();
    if (versionError) throw versionError;
    return versionData;
}

export async function descargarDocumento(path) {
    const { data, error } = await supabase.storage
        .from('documentos-proyectos')
        .download(path);
    if (error) throw error;
    return data;
}

// OBSERVACIONES
export async function obtenerObservaciones(proyectoId) {
    const { data, error } = await supabase
        .from('observaciones')
        .select('*, docente:docente_id ( nombre, apellido )')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

// NOTIFICACIONES
export async function obtenerNotificaciones(perfilId) {
    const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', perfilId)
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) throw error;
    return data;
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

// GESTIÓN DE INICIO
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

// AULA VIRTUAL
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

// ADMIN AVANZADO
export async function obtenerTodosPerfiles() {
    const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function eliminarPerfil(perfilId) {
    const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', perfilId);
    if (error) throw error;
}

export async function obtenerTodosProyectos() {
    const { data, error } = await supabase
        .from('proyectos')
        .select(`
            *,
            estudiante:estudiante_id ( nombre, apellido ),
            docente:docente_id ( nombre, apellido ),
            versiones_proyecto ( documento_url )
        `)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function obtenerProyectosFinalizados() {
    const { data, error } = await supabase
        .from('proyectos')
        .select(`
            *,
            estudiante:estudiante_id ( nombre, apellido ),
            docente:docente_id ( nombre, apellido ),
            versiones_proyecto ( documento_url )
        `)
        .eq('terminado', true)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function obtenerEstadisticas() {
    const { count: totalEstudiantes } = await supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante');
    const { count: totalDocentes } = await supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'docente');
    const { count: totalProyectos } = await supabase.from('proyectos').select('*', { count: 'exact', head: true });
    const { count: proyectosEnRevision } = await supabase.from('proyectos').select('*', { count: 'exact', head: true }).eq('terminado', false);

    return {
        estudiantes: totalEstudiantes || 0,
        docentes: totalDocentes || 0,
        proyectos: totalProyectos || 0,
        enRevision: proyectosEnRevision || 0
    };
}

export async function eliminarUsuario(perfilId) {
    const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', perfilId);
    if (error) throw error;
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

export async function obtenerEstadisticasAdmin() {
    return obtenerEstadisticas();
}

export async function obtenerTodosUsuarios() {
    return obtenerTodosPerfiles();
}

export async function descargarArchivo(fullUrl, fileName) {
    try {
        // 1. Extraer el path relativo (fileName en storage) de la URL pública
        // Ejemplo: .../storage/v1/object/public/documentos-proyectos/nombre-del-archivo.docx
        const bucketName = 'documentos-proyectos';
        const urlParts = fullUrl.split(`${bucketName}/`);
        if (urlParts.length < 2) throw new Error("URL de archivo inválida");
        
        const path = urlParts[1].split('?')[0]; // Limpiar cualquier parámetro previo
        
        // 2. Generar una URL firmada con el parámetro de descarga forzado
        // Esto le dice a Supabase que envíe las cabeceras Content-Disposition correctas
        let finalName = fileName || 'documento.docx';
        if (!finalName.includes('.')) finalName += '.docx';

        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(path, 60, {
                download: finalName
            });

        if (error) throw error;

        // 3. Disparar la descarga con la URL firmada
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = finalName;
        // Agregamos target _blank por si el navegador decide abrirlo en vez de descargarlo (aunque signedUrl + download lo fuerza)
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        console.log("Descarga firmada iniciada para:", finalName);
    } catch (error) {
        console.error('Error crítico en descarga firmada:', error.message);
        // Fallback último recurso
        window.open(fullUrl, '_blank');
    }
}

// ==========================================
// OVA MANAGEMENT (Aula Virtual)
// ==========================================

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
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('documentos-proyectos')
        .upload(fileName, file, { 
            upsert: false,
            contentType: file.type 
        });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
        .from('documentos-proyectos')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

