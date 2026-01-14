import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'aboia_session';
const SESSION_EXPIRY_KEY = 'aboia_session_expiry';

interface Session {
  token: string;
  expiresAt: number;
}

export function usePassphraseAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem(SESSION_KEY);
      const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!token || !expiryStr) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        // Session expired
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    checkSession();
  }, []);

  const verify = useCallback(async (passphrase: string): Promise<{ 
    success: boolean; 
    error?: string;
    remainingAttempts?: number;
    blockedFor?: number;
  }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-passphrase', {
        body: { passphrase }
      });

      if (error) {
        console.error('Error invoking verify-passphrase:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
      }

      if (data.error) {
        return { 
          success: false, 
          error: data.error,
          remainingAttempts: data.remainingAttempts,
          blockedFor: data.blockedFor
        };
      }

      if (data.success && data.sessionToken) {
        // Store session
        localStorage.setItem(SESSION_KEY, data.sessionToken);
        localStorage.setItem(SESSION_EXPIRY_KEY, data.expiresAt.toString());
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Réponse inattendue du serveur' };
    } catch (err) {
      console.error('Error in verify:', err);
      return { success: false, error: 'Erreur de connexion' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    loading,
    verify,
    logout
  };
}
