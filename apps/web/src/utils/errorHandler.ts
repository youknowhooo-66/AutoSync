import { AxiosError } from 'axios';

/**
 * Extracts a clear human-readable error message from an Axios error or standard JavaScript Error.
 * Preserves technical details when available (e.g. status code, validation message).
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'Ocorreu um erro ao processar a requisição.'): string {
  if (!error) return fallbackMessage;

  if (error instanceof AxiosError || (typeof error === 'object' && error !== null && 'response' in error)) {
    const axiosErr = error as AxiosError<any>;

    if (axiosErr.response) {
      const status = axiosErr.response.status;
      const data = axiosErr.response.data;

      // Special status handling
      if (status === 401) {
        return 'Sessão expirada ou credenciais inválidas. Por favor, refaça o login.';
      }
      if (status === 403) {
        return 'Você não possui permissão para executar esta ação.';
      }
      if (status === 404) {
        return 'O recurso solicitado não foi encontrado.';
      }
      if (status === 409) {
        return data?.message || 'Conflito de dados (registro já existe).';
      }

      // Explicit backend error message
      if (typeof data?.message === 'string' && data.message.trim().length > 0) {
        return data.message;
      }

      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors.join(', ');
      }
    }

    if (axiosErr.code === 'ERR_NETWORK') {
      return 'Erro de conexão com o servidor. Verifique se o backend está em execução.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}
