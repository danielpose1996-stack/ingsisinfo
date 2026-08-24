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
    const [realPerfil, setRealPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Estado de simulación de rol para pruebas administrativas
    const [simulatedRole, setSimulatedRole] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('simulated_role') || null;
        }
        return null;
    });
    const [simulatedLinea, setSimulatedLinea] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('simulated_linea') || '';
        }
        return '';
    });

    const realIsAdmin = realPerfil?.rol === 'admin';
    const isSimulating = Boolean(simulatedRole && realIsAdmin);

    // Perfil derivado: si la simulación está activa, refleja el rol y línea simulados
    const perfil = React.useMemo(() => {
        if (!realPerfil) return null;
        if (isSimulating) {
            return {
                ...realPerfil,
                rol: simulatedRole,
                linea_investigacion: simulatedRole === 'docente' ? (simulatedLinea || 'Robótica') : realPerfil.linea_investigacion
            };
        }
        return realPerfil;
    }, [realPerfil, isSimulating, simulatedRole, simulatedLinea]);

    // isAdmin para la UI activa (si está simulando, se comporta como el rol simulado)
    const isAdmin = isSimulating ? false : realIsAdmin;

    const startSimulation = (role, linea = '') => {
        if (!realIsAdmin) {
            console.error("Solo los administradores pueden iniciar el modo simulación.");
            return;
        }
        if (role !== 'docente' && role !== 'estudiante') {
            console.error("Rol de simulación no válido.");
            return;
        }
        setSimulatedRole(role);
        setSimulatedLinea(linea || 'Robótica');
        sessionStorage.setItem('simulated_role', role);
        if (linea) sessionStorage.setItem('simulated_linea', linea);
        else sessionStorage.removeItem('simulated_linea');
    };

    const stopSimulation = () => {
        setSimulatedRole(null);
        setSimulatedLinea('');
        sessionStorage.removeItem('simulated_role');
        sessionStorage.removeItem('simulated_linea');
    };

    const refreshPerfil = async () => {
        if (!user) return;
        try {
            const { data: p } = await supabase
                .from('perfiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (p) {
                setRealPerfil(p);
            }
        } catch (err) {
            console.error("Error al refrescar perfil:", err);
        }
    };

    const userRef = React.useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    const perfilRef = React.useRef(realPerfil);
    useEffect(() => { perfilRef.current = realPerfil; }, [realPerfil]);

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
                    setRealPerfil(null);
                    setLoading(false);
                    return;
                }

                setAuthError(null);

                // Si es el mismo usuario ya cargado, no mutar la referencia del estado `user`
                if (!userRef.current || userRef.current.id !== session.user.id) {
                    setUser(session.user);
                    if (!perfilRef.current) {
                        setLoading(true);
                    }
                }
            } else {
                if (userRef.current) {
                    setUser(null);
                    setRealPerfil(null);
                    setLoading(false);
                    sessionStorage.removeItem('isAdminLoggedIn');
                    sessionStorage.removeItem('simulated_role');
                    sessionStorage.removeItem('simulated_linea');
                } else {
                    setLoading(false);
                }
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
                            setRealPerfil(retryProfile);
                            if (retryProfile.rol === 'admin') {
                                sessionStorage.setItem('isAdminLoggedIn', 'true');
                            }
                        }
                        if (isMounted) setLoading(false);
                    }, 1200);
                } else if (p) {
                    setRealPerfil(p);
                    if (p.rol === 'admin') {
                        sessionStorage.setItem('isAdminLoggedIn', 'true');
                    } else {
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
            setRealPerfil(null);
            setAuthError(null);
            sessionStorage.removeItem('isAdminLoggedIn');
            sessionStorage.removeItem('admin_access_gate');
            sessionStorage.removeItem('simulated_role');
            sessionStorage.removeItem('simulated_linea');
            
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
            realPerfil,
            loading,
            isAdmin,
            realIsAdmin,
            simulatedRole,
            simulatedLinea,
            isSimulating,
            startSimulation,
            stopSimulation,
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
