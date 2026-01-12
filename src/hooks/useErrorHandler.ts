import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for centralized error handling with toast notifications
 * Provides consistent error messaging across the application
 */
export const useErrorHandler = () => {
  const { t } = useTranslation();

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      console.error(`Error in ${context || 'unknown context'}:`, error);

      let message = t('errors.unexpectedError');

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = String(error.message);
      }

      toast.error(message, {
        description: context,
        duration: 5000,
      });

      return message;
    },
    [t]
  );

  const handleSuccess = useCallback(
    (message: string, description?: string) => {
      toast.success(message, {
        description,
        duration: 3000,
      });
    },
    []
  );

  const handleInfo = useCallback((message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  }, []);

  const handleWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  };
};
