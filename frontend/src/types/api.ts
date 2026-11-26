import type { AxiosError } from 'axios';

// Error de una llamada a la API: el backend responde { message }.
// Ojo: cuando falla la validación de un DTO, message llega como lista de textos (string[]);
// varias pantallas lo muestran como si fuera un texto. Pendiente de corregir (ver PR de ESLint F5a).
export type ApiError = AxiosError<{ message?: string }>;
