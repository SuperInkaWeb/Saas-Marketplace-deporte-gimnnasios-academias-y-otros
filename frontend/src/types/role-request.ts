// Solicitud de un atleta para pasar a dueño o entrenador
// (GET /users/role-requests/mine, POST /users/role-requests).
// Base: modelo RoleRequest de backend/prisma/schema.prisma.

export interface RoleRequest {
  id: string;
  userId: string;
  requestedRole: string; // GYM_OWNER | TRAINER
  status: string; // PENDING | APPROVED | REJECTED | REVOKED
  reason?: string | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}
