import React, { createContext, useContext, useState, useEffect } from 'react';
import { obtenerSesionActual, supabase, iniciarSesion as supabaseLogin, cerrarSesion as supabaseLogout } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshPerfil = async () => {
        if (!user) return;
        const { data: p } = await supabase
            .from('perfiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if (p) setPerfil(p);
    };

    useEffect(() => {
        // Carga inicial
        const initSession = async () => {
            const data = await obtenerSesionActual();
            if (data) {
                setUser(data.session.user);
                setPerfil(data.perfil);
            } else {
                // Check if there's a bypass profile persisted
                const savedBypass = sessionStorage.getItem('bypassProfile');
                if (savedBypass) {
                    try {
                        const p = JSON.parse(savedBypass);
                        setUser({ id: p.user_id, email: p.email });
                        setPerfil(p);
                    } catch (e) {
                        sessionStorage.removeItem('bypassProfile');
                    }
                }
            }
            
            // Check admin persistence (simulated like in vanilla)
            const adminSession = sessionStorage.getItem('isAdminLoggedIn');
            if (adminSession === 'true') setIsAdmin(true);
            
            setLoading(false);
        };

        initSession();

        // Escuchar cambios de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setUser(session.user);
                const { data: p } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();
                setPerfil(p);
            } else {
                // Solo limpiar si no hay una sesión de bypass activa
                if (!sessionStorage.getItem('bypassProfile')) {
                    setUser(null);
                    setPerfil(null);
                }
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginAdmin = (username, password) => {
        // Credenciales administrativas predeterminadas (simuladas como en vanilla)
        if (username === 'admin' && password === 'admin123') {
            setIsAdmin(true);
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            return true;
        }
        return false;
    };

    const logoutAdmin = () => {
        setIsAdmin(false);
        sessionStorage.removeItem('isAdminLoggedIn');
    };

    const iniciarSesion = async (email, password) => {
        try {
            return await supabaseLogin(email, password);
        } catch (error) {
            console.error("Supabase Auth Error:", error.message);
            // FALLBACK PARA DESARROLLO: Intento de bypass si falla Auth normal
            console.warn("MODO DESARROLLO: Intentando bypass para", email);
            
            try {
                // Buscar en la tabla perfiles si existe este correo (case-insensitive)
                const { data: p, error: perfilError } = await supabase
                    .from('perfiles')
                    .select('*')
                    .ilike('email', email.trim())
                    .single();

                if (p && !perfilError) {
                    // Verificar si el password coincide con el guardado en bypass o el maestro
                    const isCorrectPassword = password === 'password123' || (p.bypass_password && password === p.bypass_password);
                    
                    if (isCorrectPassword) {
                        console.log("Bypass exitoso: Usuario encontrado y contraseña válida.");
                        setUser({ id: p.user_id, email: p.email });
                        setPerfil(p);
                        sessionStorage.setItem('bypassProfile', JSON.stringify(p));
                        return { user: { id: p.user_id }, session: {} };
                    } else {
                        console.warn("Bypass fallido: Contraseña incorrecta.");
                        // Si la contraseña no coincide, lanzamos un error específico
                        throw new Error("Contraseña incorrecta. (Nota: Si es bypass, usa 'password123' o la que definiste)");
                    }
                } else {
                    console.warn("Bypass fallido: Usuario no encontrado en perfiles.");
                    // Si ni siquiera existe el perfil, lanzamos el error original
                }
            } catch (bypassErr) {
                console.error("Error crítico en bypass:", bypassErr.message);
                throw bypassErr;
            }
            
            throw error;
            throw error;
        }
    };

    const cerrarSesion = async () => {
        await supabaseLogout();
        // Limpiar manualmente para el modo bypass
        setUser(null);
        setPerfil(null);
        sessionStorage.removeItem('bypassProfile');
    };

    return (
        <AuthContext.Provider value={{ user, perfil, loading, isAdmin, loginAdmin, logoutAdmin, iniciarSesion, cerrarSesion, refreshPerfil }}>
            {children}
        </AuthContext.Provider>
    );
};
