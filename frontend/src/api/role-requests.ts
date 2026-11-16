import api from './api-client';

// Evento que avisa al panel que se creó una solicitud de rol (para refrescar su estado).
export const ROLE_REQUEST_EVENT = 'hercix:role-request-created';

export type RequestableRole = 'TRAINER' | 'GYM_OWNER';

export async function createRoleRequest(requestedRole: RequestableRole, reason: string) {
  const { data } = await api.post('/users/role-requests', { requestedRole, reason });
  window.dispatchEvent(new Event(ROLE_REQUEST_EVENT));
  return data;
}
