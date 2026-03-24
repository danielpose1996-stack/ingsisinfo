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

    const perfilRef = React.useRef(perfil);
    useEffect(() => { perfilRef.current = perfil; }, [perfil]);

    // 1. Escuchar cambios de Auth de manera estable
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setUser(session.user);
                // Usamos la ref para no depender de perfil en el useEffect
                if (!perfilRef.current) {
                    setLoading(true);
                }
            } else {
                setUser(null);
                setPerfil(null);
                setIsAdmin(false);
                setLoading(false);
                sessionStorage.removeItem('isAdminLoggedIn');
            }
        });

        return () => subscription.unsubscribe();
    }, []); // Array VACÍO = Estabilidad total

    // 2. Efecto separado para cargar el perfil cuando cambia el usuario
    useEffect(() => {
        async function loadProfile() {
            if (!user) return;
            
            try {
                const { data: p, error: pError } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                
                if (pError && pError.code === 'PGRST116') {
                    console.warn("No se encontró perfil, cerrando...");
                    await supabaseLogout();
                    setUser(null);
                    setPerfil(null);
                    setIsAdmin(false);
                } else {
                    setPerfil(p || null);
                    setIsAdmin(p?.rol === 'admin');
                    
                    // Persistence admin
                    if (p?.rol === 'admin' || sessionStorage.getItem('isAdminLoggedIn') === 'true') {
                        setIsAdmin(true);
                    }
                }
            } catch (err) {
                console.error("Error cargando perfil:", err);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [user]);

    const loginAdmin = async (email, password) => {
        // Compatibility wrapper for admin login
        const data = await supabaseLogin(email, password);
        if (data) {
            const { data: p } = await supabase.from('perfiles').select('rol').eq('user_id', data.user.id).single();
            if (p?.rol === 'admin') {
                setIsAdmin(true);
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                return true;
            } else {
                // Not an admin, sign out immediately
                await supabaseLogout();
                return false;
            }
        }
        return false;
    };

    const logoutAdmin = () => {
        setIsAdmin(false);
        sessionStorage.removeItem('isAdminLoggedIn');
    };

    const iniciarSesion = async (email, password) => {
        return await supabaseLogin(email, password);
    };

    const cerrarSesion = async () => {
        try {
            // Limpieza optimista (inmediata) de sesión
            setUser(null);
            setPerfil(null);
            setIsAdmin(false);
            sessionStorage.removeItem('isAdminLoggedIn');
            sessionStorage.removeItem('bypassProfile');
            
            // Forzar limpieza de Supabase en LocalStorage inmediatamente
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key);
            });

            // Llamada de red a Supabase para invalidar token en el servidor
            await supabaseLogout();
        } catch (err) {
            console.error("Error logging out of Supabase:", err.message);
        } finally {
            // Forzar recarga limpia para destruir la instancia en memoria de Supabase
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, perfil, loading, isAdmin, loginAdmin, logoutAdmin, iniciarSesion, cerrarSesion, refreshPerfil }}>
            {children}
        </AuthContext.Provider>
    );
};
