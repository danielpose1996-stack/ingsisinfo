import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, iniciarSesionConGoogle, cerrarSesion as supabaseLogout } from '../lib/supabase';

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
    const [authError, setAuthError] = useState(null);

    const refreshPerfil = async () => {
        if (!user) return;
        try {
            const { data: p } = await supabase
                .from('perfiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (p) {
                setPerfil(p);
                setIsAdmin(p.rol === 'admin');
            }
        } catch (err) {
            console.error("Error al refrescar perfil:", err);
        }
    };

    const perfilRef = React.useRef(perfil);
    useEffect(() => { perfilRef.current = perfil; }, [perfil]);

    // 1. Escuchar cambios de Auth de manera estable
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                const userEmail = session.user.email?.toLowerCase() || '';
                
                // Validación estricta en tiempo de ejecución del dominio institucional
                if (!userEmail.endsWith('@unipaz.edu.co')) {
                    console.error("Dominio de correo no autorizado:", userEmail);
                    setAuthError('Solo se permiten cuentas de correo institucional @unipaz.edu.co');
                    supabaseLogout().catch(() => {});
                    setUser(null);
                    setPerfil(null);
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                setAuthError(null);
                setUser(session.user);
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
    }, []);

    // 2. Cargar perfil cuando cambia el usuario
    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            if (!user) return;
            
            try {
                const { data: p, error: pError } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                
                if (!isMounted) return;

                if (pError && pError.code === 'PGRST116') {
                    // Si el trigger de la BD está procesando el nuevo usuario, esperamos brevemente
                    console.warn("Perfil en proceso de creación, reintentando lectura...");
                    setTimeout(async () => {
                        if (!isMounted || !user) return;
                        const { data: retryProfile } = await supabase
                            .from('perfiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .single();
                        
                        if (retryProfile && isMounted) {
                            setPerfil(retryProfile);
                            setIsAdmin(retryProfile.rol === 'admin');
                            if (retryProfile.rol === 'admin') {
                                sessionStorage.setItem('isAdminLoggedIn', 'true');
                            }
                        }
                        if (isMounted) setLoading(false);
                    }, 1200);
                } else if (p) {
                    setPerfil(p);
                    if (p.rol === 'admin') {
                        setIsAdmin(true);
                        sessionStorage.setItem('isAdminLoggedIn', 'true');
                    } else {
                        setIsAdmin(false);
                        sessionStorage.removeItem('isAdminLoggedIn');
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error al cargar perfil:", err);
                if (isMounted) setLoading(false);
            }
        }

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const iniciarSesion = async () => {
        setAuthError(null);
        return await iniciarSesionConGoogle();
    };

    const cerrarSesion = async () => {
        try {
            setUser(null);
            setPerfil(null);
            setIsAdmin(false);
            setAuthError(null);
            sessionStorage.removeItem('isAdminLoggedIn');
            sessionStorage.removeItem('admin_access_gate');
            
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key);
            });

            await supabaseLogout();
        } catch (err) {
            console.error("Error al cerrar sesión:", err.message);
        } finally {
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            perfil,
            loading,
            isAdmin,
            authError,
            iniciarSesion,
            iniciarSesionConGoogle,
            cerrarSesion,
            refreshPerfil
        }}>
            {children}
        </AuthContext.Provider>
    );
};
