# M3-B1 - DISENO REFRESH TOKENS PERSISTENTES

## Fecha
2026-04-14

## 1) Diagnostico actual

### Hechos confirmados

1. `authService.refresh` valida JWT y reemite tokens sin persistencia de sesion.
2. `authService.logout` es stateless (no invalida refresh token vigente).
3. No existe entidad de sesion/token en `schema.prisma`.

### Impacto

1. No hay revocacion activa de refresh token.
2. No hay deteccion de reutilizacion (token replay).
3. No hay trazabilidad de sesiones por dispositivo/cliente.

## 2) Decision de diseno (recomendada)

Implementar refresh token persistente con:

1. Rotacion obligatoria por uso (single-use refresh token).
2. Revocacion por `logout`.
3. Revocacion en cascada por deteccion de reutilizacion.
4. Almacenamiento solo de hash del token (no token plano).
5. Encadenamiento de rotacion por referencia relacional de sesion.

## 3) Modelo de datos propuesto (Prisma)

```prisma
model UserSession {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  refreshTokenHash    String    @unique @map("refresh_token_hash")
  tokenFamily         String    @map("token_family")
  parentSessionId     String?   @unique @map("parent_session_id")
  replacedBySessionId String?   @unique @map("replaced_by_session_id")
  issuedAt            DateTime  @default(now()) @map("issued_at")
  lastUsedAt          DateTime? @map("last_used_at")
  lastUsedByIp        String?   @map("last_used_by_ip")
  expiresAt           DateTime  @map("expires_at")
  revokedAt           DateTime? @map("revoked_at")
  revokeReason        String?   @map("revoke_reason")
  createdByIp         String?   @map("created_by_ip")
  revokedByIp         String?   @map("revoked_by_ip")
  userAgent           String?   @map("user_agent")
  isActive            Boolean   @default(true) @map("is_active")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  usuario             Usuario   @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentSession       UserSession? @relation("SessionParent", fields: [parentSessionId], references: [id])
  childSession        UserSession? @relation("SessionParent")
  replacedBySession   UserSession? @relation("SessionReplacedBy", fields: [replacedBySessionId], references: [id])
  replacesPrevSession UserSession? @relation("SessionReplacedBy")

  @@index([userId, isActive])
  @@index([tokenFamily])
  @@index([expiresAt])
  @@map("user_sessions")
}
```

### Ajuste relacionado en `Usuario`

Agregar relacion:

```prisma
sessions UserSession[]
```

### Regla de modelado

1. `refreshTokenHash` se usa para lookup de token recibido.
2. La cadena de rotacion se enlaza por `parentSessionId` / `replacedBySessionId` (no por hash).

## 4) Reglas de ciclo de vida

### Login

1. Emitir access token + refresh token.
2. Guardar `refreshTokenHash`, `tokenFamily`, `expiresAt`, `createdByIp`, `userAgent`.

### Refresh

1. Validar firma JWT refresh.
2. Validar claims obligatorios del refresh:
- `sub`
- `jti`
- `type=refresh`
- `family`
- `exp`
3. Buscar por hash del refresh recibido.
4. Rechazar si:
- no existe,
- `revokedAt` no nulo,
- `isActive=false`,
- expirado.
5. Si es valido:
- revocar token actual (`revokedAt`, `revokeReason='rotated'`, `isActive=false`),
- emitir nuevo refresh token de misma familia,
- guardar nueva sesion enlazada a la anterior (`parentSessionId`) y enlazar anterior por `replacedBySessionId`.
6. Si se detecta reutilizacion de token ya revocado:
- revocar toda la familia (`tokenFamily`) con `revokeReason='replay_detected'`,
- responder 401.

### Regla transaccional obligatoria (refresh)

`rotateSession` debe ejecutarse en una transaccion atomica que incluya:

1. validacion de sesion actual;
2. verificacion de estado (activa/no revocada/no expirada);
3. revocacion del token actual;
4. creacion de la nueva sesion;
5. enlace relacional entre sesiones;
6. auditoria de seguridad;
7. retorno de nuevos tokens.

Sin transaccion, refresh concurrentes pueden producir doble rotacion inconsistente.

### Logout

1. Recibir refresh token actual.
2. Resolver hash e intentar revocar registro activo.
3. Operar en modo idempotente:
- devolver `204` tambien si ya estaba revocado/expirado/no encontrado;
- devolver `401` solo para token malformado o firma invalida.
4. Registrar auditoria de seguridad (`auth.logout`).

## 5) Contrato minimo por endpoint (ajuste M3-B2/B3)

### POST `/auth/login`

Sin cambio de request; internamente persiste sesion.

### POST `/auth/refresh`

Request actual se mantiene (`refreshToken`), pero:

1. refresh invalido/revocado/reutilizado -> 401.
2. refresh valido -> rotacion + respuesta de nuevo par de tokens.
3. validacion de claims y consistencia con sesion persistida (sub/family/jti/type/exp).

### POST `/auth/logout`

Recomendado:

1. aceptar `refreshToken` en body para revocacion deterministica;
2. responder `204` de forma idempotente (incluso si ya estaba revocado/expirado);
3. responder `401` solo para token malformado o firma invalida.

## 6) Seguridad y cumplimiento tecnico

1. Hash de refresh token con `HMAC-SHA256` usando secreto de servidor (pepper).
2. Nunca persistir refresh token plano.
3. Limitar sesiones activas por usuario (regla configurable, p.ej. 5).
4. Politica de exceso de sesiones para MVP: revocar automaticamente la sesion activa mas antigua.
5. Limpieza diaria de expirados/revocados con retencion forense configurable (recomendado 30-90 dias).
6. Auditoria obligatoria en:
- login exitoso,
- refresh exitoso,
- refresh rechazado por replay,
- logout.

### Replay (regla explicita)

1. Si un refresh token ya rotado aparece nuevamente, tratarlo como posible replay.
2. Revocar la familia activa asociada.
3. Registrar auditoria de seguridad con severidad alta.
4. Responder `401`.

## 7) Plan de implementacion (secuencia)

### M3-B2-01 (Schema y migracion)

1. Crear `UserSession` en `schema.prisma`.
2. Generar migracion SQL.
3. Actualizar seed si aplica.

### M3-B2-02 (Servicio de sesiones)

1. Crear modulo `session.service.ts`:
- createSession
- rotateSession
- revokeSession
- revokeFamily
- cleanupExpired
- enforceSessionLimit (revocar la mas antigua al superar limite)

### M3-B2-03 (Auth integration)

1. Integrar `login/refresh/logout` con store persistente.
2. Incluir `ip` y `user-agent` desde request.
3. Validar claims requeridos en refresh (`sub`, `jti`, `type`, `family`, `exp`).

### M3-B3-01 (Pruebas)

1. Unit:
- hash/validacion/rotacion/replay.
2. E2E:
- login -> refresh -> refresh previo invalido.
- logout -> refresh falla 401.

## 8) Riesgos y mitigacion

1. **Alto**: ruptura de clientes si `logout` cambia contrato.
- Mitigacion: mantener contrato idempotente `204` para minimizar impacto.
2. **Medio**: crecimiento de tabla por rotacion frecuente.
- Mitigacion: job de purga diario con retencion configurable (30-90 dias).
3. **Medio**: invalidaciones cruzadas por mala gestion de `tokenFamily`.
- Mitigacion: tests de familia/replay antes de release.

## 9) Criterio de cierre M3-B1

1. Diseno aprobado (modelo + flujos + seguridad + plan).
2. Trazabilidad registrada en acta MacroFase 3.
3. Listo para ejecutar M3-B2 (implementacion tecnica).
