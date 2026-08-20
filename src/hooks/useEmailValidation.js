import { useState, useCallback } from 'react';

/**
 * useEmailValidation
 * Hook unificado para validar correos electrónicos en el frontend.
 * Exige el dominio @unipaz.edu.co.
 */
export function useEmailValidation(initialValue = '') {
  const [email, setEmail] = useState(initialValue);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback((value) => {
    // Normalización: eliminar espacios externos y convertir a minúsculas
    const cleanEmail = value.trim().toLowerCase();
    
    if (!cleanEmail) {
      setError('');
      setIsValid(false);
      return false;
    }

    // Expresión regular para el formato estándar de correo y el dominio unipaz.edu.co
    const unipazRegex = /^[a-zA-Z0-9._%+-]+@unipaz\.edu\.co$/;
    
    if (!unipazRegex.test(cleanEmail)) {
      setError('Correo electrónico inválido (Use @unipaz.edu.co)');
      setIsValid(false);
      return false;
    }

    setError('');
    setIsValid(true);
    return true;
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validate(value);
  };

  const getNormalizedEmail = () => email.trim().toLowerCase();

  return {
    email,
    setEmail: (val) => {
      setEmail(val);
      validate(val);
    },
    error,
    isValid,
    handleChange,
    getNormalizedEmail,
    validate: () => validate(email)
  };
}
