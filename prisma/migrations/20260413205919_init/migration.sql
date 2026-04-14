-- CreateEnum
CREATE TYPE "EstadoExpedienteGlobal" AS ENUM ('BORRADOR', 'RECIBIDO', 'DOCUMENTAL', 'INCOMPATIBILIDADES', 'TECNICA', 'LEGAL', 'KML_SIG', 'OBSERVADO', 'CORRECCION', 'INFORME', 'CONTROL', 'APROBADO', 'INGRESADO', 'CERRADO', 'RECHAZADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoEtapa" AS ENUM ('PENDIENTE', 'HABILITADA', 'EN_PROGRESO', 'OBSERVADA', 'BLOQUEADA', 'CERRADA', 'REABIERTA', 'RECHAZADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoEtapa" AS ENUM ('RECEPCION', 'CHECKLIST', 'INCOMPATIBILIDADES', 'REVISION_TECNICA', 'REVISION_LEGAL', 'KML_SIG', 'INFORME_TECNICO', 'CONTROL_FINAL', 'INGRESO_SAG', 'CIERRE');

-- CreateEnum
CREATE TYPE "SeveridadAlerta" AS ENUM ('INFORMATIVA', 'ADVERTENCIA', 'CRITICA');

-- CreateEnum
CREATE TYPE "SeveridadNC" AS ENUM ('MENOR', 'MAYOR', 'CRITICA');

-- CreateEnum
CREATE TYPE "ResultadoRevision" AS ENUM ('APROBADA', 'APROBADA_CON_OBSERVACIONES', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "CanalRecepcion" AS ENUM ('PRESENCIAL', 'CORREO', 'PLATAFORMA_DIGITAL', 'INTERNO');

-- CreateEnum
CREATE TYPE "PrioridadExpediente" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "OrigenAlerta" AS ENUM ('AUTOMATICA', 'MANUAL');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('EXPEDIENTE', 'ETAPA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('BORRADOR', 'VIGENTE', 'CERRADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoAdmisibilidad" AS ENUM ('ADMISIBLE', 'INADMISIBLE_OBSERVADA');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ACTIVA', 'RESUELTA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoNoConformidad" AS ENUM ('ABIERTA', 'EN_PROCESO', 'CERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoAccionCorrectiva" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'CERRADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoInformeTecnico" AS ENUM ('BORRADOR', 'VIGENTE', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoControlFinal" AS ENUM ('BORRADOR', 'APROBADO', 'OBSERVADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('ACTIVO', 'OBSERVADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoVersionDocumento" AS ENUM ('ACTIVA', 'REEMPLAZADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoReportJob" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "initials" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "id" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes" (
    "id" TEXT NOT NULL,
    "codigo_interno" TEXT NOT NULL,
    "estado_global" "EstadoExpedienteGlobal" NOT NULL,
    "nombre_propietario" TEXT NOT NULL,
    "rut_propietario" TEXT NOT NULL,
    "nombre_proyecto" TEXT,
    "rol_predial" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "superficie_total" DECIMAL(12,2) NOT NULL,
    "numero_lotes" INTEGER NOT NULL,
    "numero_planos_recibidos" INTEGER,
    "presencia_kml" BOOLEAN,
    "canal_recepcion" "CanalRecepcion" NOT NULL,
    "prioridad" "PrioridadExpediente" NOT NULL,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL,
    "fecha_limite_sag" TIMESTAMP(3),
    "observaciones_iniciales" TEXT,
    "profesional_responsable_id" TEXT NOT NULL,
    "revisor_asignado_id" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expedientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expediente_etapas" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "tipo_etapa" "TipoEtapa" NOT NULL,
    "estado_etapa" "EstadoEtapa" NOT NULL,
    "responsable_user_id" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expediente_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expediente_historial_estados" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "estado_anterior" "EstadoExpedienteGlobal",
    "estado_nuevo" "EstadoExpedienteGlobal" NOT NULL,
    "changed_by_user_id" TEXT,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expediente_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expediente_etapa_historial_estados" (
    "id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "estado_anterior" "EstadoEtapa",
    "estado_nuevo" "EstadoEtapa" NOT NULL,
    "changed_by_user_id" TEXT,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expediente_etapa_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaperturas_etapa" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "reopened_by_user_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado_anterior" "EstadoEtapa" NOT NULL,
    "estado_nuevo" "EstadoEtapa" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reaperturas_etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recepciones_expediente" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "folio_ingreso" TEXT NOT NULL,
    "estado_admisibilidad" "EstadoAdmisibilidad" NOT NULL,
    "created_by_user_id" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recepciones_expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL,
    "checklist_template_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "checklist_template_id" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "estado_registro" "EstadoRegistro" NOT NULL DEFAULT 'VIGENTE',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_item_resultados" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "checklist_template_item_id" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "observacion" TEXT,
    "is_critical_snapshot" BOOLEAN NOT NULL DEFAULT false,
    "is_required_snapshot" BOOLEAN NOT NULL DEFAULT true,
    "checked_by_user_id" TEXT,
    "checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_item_resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declaraciones_incompatibilidad" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "tipo_etapa" "TipoEtapa",
    "firmada" BOOLEAN NOT NULL DEFAULT false,
    "firmada_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "declaraciones_incompatibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisiones_tecnicas" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "iteracion" INTEGER NOT NULL,
    "resultado" "ResultadoRevision" NOT NULL,
    "estado_registro" "EstadoRegistro" NOT NULL,
    "observaciones" TEXT,
    "revisor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revisiones_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisiones_legales" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "iteracion" INTEGER NOT NULL,
    "resultado" "ResultadoRevision" NOT NULL,
    "estado_registro" "EstadoRegistro" NOT NULL,
    "observaciones" TEXT,
    "revisor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revisiones_legales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validaciones_kml" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "iteracion" INTEGER NOT NULL,
    "resultado" "ResultadoRevision" NOT NULL,
    "estado_registro" "EstadoRegistro" NOT NULL,
    "sistema_referencia" TEXT,
    "numero_poligonos" INTEGER,
    "observaciones" TEXT,
    "revisor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validaciones_kml_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informes_tecnicos" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "estado" "EstadoInformeTecnico" NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "informes_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informe_tecnico_versiones" (
    "id" TEXT NOT NULL,
    "informe_tecnico_id" TEXT NOT NULL,
    "numero_version" INTEGER NOT NULL,
    "contenido" JSONB,
    "estado_registro" "EstadoRegistro" NOT NULL,
    "documento_version_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "informe_tecnico_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles_finales" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT NOT NULL,
    "estado" "EstadoControlFinal" NOT NULL,
    "observaciones" TEXT,
    "aprobador_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controles_finales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento_catalogo" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_documento_catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "expediente_etapa_id" TEXT,
    "tipo_documento_catalogo_id" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_versiones" (
    "id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "numero_version" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "nombre_archivo_original" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "hash_archivo" TEXT,
    "estado_version" "EstadoVersionDocumento" NOT NULL DEFAULT 'ACTIVA',
    "uploaded_by_user_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_alerta" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "severity" "SeveridadAlerta" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "regla_alerta_id" TEXT,
    "scope_type" "ScopeType" NOT NULL,
    "origin_type" "OrigenAlerta" NOT NULL,
    "severity" "SeveridadAlerta" NOT NULL,
    "status" "EstadoAlerta" NOT NULL DEFAULT 'ACTIVA',
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "responsible_user_id" TEXT,
    "resolved_by_user_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "no_conformidades" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT,
    "scope_type" "ScopeType" NOT NULL,
    "severity" "SeveridadNC" NOT NULL,
    "status" "EstadoNoConformidad" NOT NULL DEFAULT 'ABIERTA',
    "codigo" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable_user_id" TEXT,
    "fecha_deteccion" TIMESTAMP(3) NOT NULL,
    "fecha_compromiso" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "no_conformidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acciones_correctivas" (
    "id" TEXT NOT NULL,
    "no_conformidad_id" TEXT NOT NULL,
    "responsable_user_id" TEXT NOT NULL,
    "estado" "EstadoAccionCorrectiva" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_compromiso" TIMESTAMP(3) NOT NULL,
    "fecha_cierre" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acciones_correctivas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "expediente_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "comentario" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" TEXT NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "EstadoReportJob" NOT NULL DEFAULT 'PENDIENTE',
    "params" JSONB,
    "result" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogos_parametro" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "sort_order" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogos_parametro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_code_key" ON "permisos"("code");

-- CreateIndex
CREATE INDEX "usuario_roles_rol_id_idx" ON "usuario_roles"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_roles_usuario_id_rol_id_key" ON "usuario_roles"("usuario_id", "rol_id");

-- CreateIndex
CREATE INDEX "rol_permisos_permiso_id_idx" ON "rol_permisos"("permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permisos_rol_id_permiso_id_key" ON "rol_permisos"("rol_id", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_codigo_interno_key" ON "expedientes"("codigo_interno");

-- CreateIndex
CREATE INDEX "expedientes_estado_global_idx" ON "expedientes"("estado_global");

-- CreateIndex
CREATE INDEX "expedientes_profesional_responsable_id_idx" ON "expedientes"("profesional_responsable_id");

-- CreateIndex
CREATE INDEX "expedientes_revisor_asignado_id_idx" ON "expedientes"("revisor_asignado_id");

-- CreateIndex
CREATE INDEX "expedientes_fecha_recepcion_idx" ON "expedientes"("fecha_recepcion");

-- CreateIndex
CREATE INDEX "expediente_etapas_responsable_user_id_idx" ON "expediente_etapas"("responsable_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "expediente_etapas_expediente_id_tipo_etapa_key" ON "expediente_etapas"("expediente_id", "tipo_etapa");

-- CreateIndex
CREATE INDEX "expediente_historial_estados_expediente_id_created_at_idx" ON "expediente_historial_estados"("expediente_id", "created_at");

-- CreateIndex
CREATE INDEX "expediente_etapa_historial_estados_expediente_etapa_id_crea_idx" ON "expediente_etapa_historial_estados"("expediente_etapa_id", "created_at");

-- CreateIndex
CREATE INDEX "reaperturas_etapa_expediente_id_expediente_etapa_id_idx" ON "reaperturas_etapa"("expediente_id", "expediente_etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "recepciones_expediente_expediente_id_key" ON "recepciones_expediente"("expediente_id");

-- CreateIndex
CREATE UNIQUE INDEX "recepciones_expediente_folio_ingreso_key" ON "recepciones_expediente"("folio_ingreso");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_code_key" ON "checklist_templates"("code");

-- CreateIndex
CREATE INDEX "checklist_template_items_checklist_template_id_order_index_idx" ON "checklist_template_items"("checklist_template_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_template_items_checklist_template_id_code_key" ON "checklist_template_items"("checklist_template_id", "code");

-- CreateIndex
CREATE INDEX "checklists_expediente_id_idx" ON "checklists"("expediente_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_item_resultados_checklist_id_checklist_template_i_key" ON "checklist_item_resultados"("checklist_id", "checklist_template_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "declaraciones_incompatibilidad_expediente_id_usuario_id_sco_key" ON "declaraciones_incompatibilidad"("expediente_id", "usuario_id", "scope_type", "tipo_etapa");

-- CreateIndex
CREATE INDEX "revisiones_tecnicas_expediente_etapa_id_idx" ON "revisiones_tecnicas"("expediente_etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "revisiones_tecnicas_expediente_id_iteracion_key" ON "revisiones_tecnicas"("expediente_id", "iteracion");

-- CreateIndex
CREATE INDEX "revisiones_legales_expediente_etapa_id_idx" ON "revisiones_legales"("expediente_etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "revisiones_legales_expediente_id_iteracion_key" ON "revisiones_legales"("expediente_id", "iteracion");

-- CreateIndex
CREATE INDEX "validaciones_kml_expediente_etapa_id_idx" ON "validaciones_kml"("expediente_etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "validaciones_kml_expediente_id_iteracion_key" ON "validaciones_kml"("expediente_id", "iteracion");

-- CreateIndex
CREATE INDEX "informes_tecnicos_expediente_id_vigente_idx" ON "informes_tecnicos"("expediente_id", "vigente");

-- CreateIndex
CREATE UNIQUE INDEX "informe_tecnico_versiones_informe_tecnico_id_numero_version_key" ON "informe_tecnico_versiones"("informe_tecnico_id", "numero_version");

-- CreateIndex
CREATE INDEX "controles_finales_expediente_id_idx" ON "controles_finales"("expediente_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_catalogo_code_key" ON "tipos_documento_catalogo"("code");

-- CreateIndex
CREATE INDEX "documentos_expediente_id_expediente_etapa_id_idx" ON "documentos"("expediente_id", "expediente_etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "documento_versiones_storage_key_key" ON "documento_versiones"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "documento_versiones_documento_id_numero_version_key" ON "documento_versiones"("documento_id", "numero_version");

-- CreateIndex
CREATE UNIQUE INDEX "reglas_alerta_code_key" ON "reglas_alerta"("code");

-- CreateIndex
CREATE INDEX "alertas_expediente_id_status_severity_idx" ON "alertas"("expediente_id", "status", "severity");

-- CreateIndex
CREATE INDEX "alertas_idempotency_key_idx" ON "alertas"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "no_conformidades_codigo_key" ON "no_conformidades"("codigo");

-- CreateIndex
CREATE INDEX "no_conformidades_expediente_id_status_severity_idx" ON "no_conformidades"("expediente_id", "status", "severity");

-- CreateIndex
CREATE INDEX "acciones_correctivas_no_conformidad_id_estado_idx" ON "acciones_correctivas"("no_conformidad_id", "estado");

-- CreateIndex
CREATE INDEX "audit_logs_expediente_id_created_at_idx" ON "audit_logs"("expediente_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "report_jobs_requested_by_user_id_status_idx" ON "report_jobs"("requested_by_user_id", "status");

-- CreateIndex
CREATE INDEX "catalogos_parametro_tipo_is_active_idx" ON "catalogos_parametro"("tipo", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "catalogos_parametro_tipo_code_key" ON "catalogos_parametro"("tipo", "code");

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_profesional_responsable_id_fkey" FOREIGN KEY ("profesional_responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_revisor_asignado_id_fkey" FOREIGN KEY ("revisor_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_etapas" ADD CONSTRAINT "expediente_etapas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_etapas" ADD CONSTRAINT "expediente_etapas_responsable_user_id_fkey" FOREIGN KEY ("responsable_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_historial_estados" ADD CONSTRAINT "expediente_historial_estados_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_historial_estados" ADD CONSTRAINT "expediente_historial_estados_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_etapa_historial_estados" ADD CONSTRAINT "expediente_etapa_historial_estados_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_etapa_historial_estados" ADD CONSTRAINT "expediente_etapa_historial_estados_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaperturas_etapa" ADD CONSTRAINT "reaperturas_etapa_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaperturas_etapa" ADD CONSTRAINT "reaperturas_etapa_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaperturas_etapa" ADD CONSTRAINT "reaperturas_etapa_reopened_by_user_id_fkey" FOREIGN KEY ("reopened_by_user_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_expediente" ADD CONSTRAINT "recepciones_expediente_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_expediente" ADD CONSTRAINT "recepciones_expediente_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_checklist_template_id_fkey" FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_checklist_template_id_fkey" FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_item_resultados" ADD CONSTRAINT "checklist_item_resultados_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_item_resultados" ADD CONSTRAINT "checklist_item_resultados_checklist_template_item_id_fkey" FOREIGN KEY ("checklist_template_item_id") REFERENCES "checklist_template_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_item_resultados" ADD CONSTRAINT "checklist_item_resultados_checked_by_user_id_fkey" FOREIGN KEY ("checked_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaraciones_incompatibilidad" ADD CONSTRAINT "declaraciones_incompatibilidad_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaraciones_incompatibilidad" ADD CONSTRAINT "declaraciones_incompatibilidad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_tecnicas" ADD CONSTRAINT "revisiones_tecnicas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_tecnicas" ADD CONSTRAINT "revisiones_tecnicas_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_tecnicas" ADD CONSTRAINT "revisiones_tecnicas_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_legales" ADD CONSTRAINT "revisiones_legales_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_legales" ADD CONSTRAINT "revisiones_legales_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_legales" ADD CONSTRAINT "revisiones_legales_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_kml" ADD CONSTRAINT "validaciones_kml_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_kml" ADD CONSTRAINT "validaciones_kml_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones_kml" ADD CONSTRAINT "validaciones_kml_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes_tecnicos" ADD CONSTRAINT "informes_tecnicos_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes_tecnicos" ADD CONSTRAINT "informes_tecnicos_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes_tecnicos" ADD CONSTRAINT "informes_tecnicos_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informe_tecnico_versiones" ADD CONSTRAINT "informe_tecnico_versiones_informe_tecnico_id_fkey" FOREIGN KEY ("informe_tecnico_id") REFERENCES "informes_tecnicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informe_tecnico_versiones" ADD CONSTRAINT "informe_tecnico_versiones_documento_version_id_fkey" FOREIGN KEY ("documento_version_id") REFERENCES "documento_versiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informe_tecnico_versiones" ADD CONSTRAINT "informe_tecnico_versiones_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles_finales" ADD CONSTRAINT "controles_finales_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles_finales" ADD CONSTRAINT "controles_finales_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles_finales" ADD CONSTRAINT "controles_finales_aprobador_user_id_fkey" FOREIGN KEY ("aprobador_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_expediente_etapa_id_fkey" FOREIGN KEY ("expediente_etapa_id") REFERENCES "expediente_etapas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipo_documento_catalogo_id_fkey" FOREIGN KEY ("tipo_documento_catalogo_id") REFERENCES "tipos_documento_catalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versiones" ADD CONSTRAINT "documento_versiones_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versiones" ADD CONSTRAINT "documento_versiones_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_regla_alerta_id_fkey" FOREIGN KEY ("regla_alerta_id") REFERENCES "reglas_alerta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_conformidades" ADD CONSTRAINT "no_conformidades_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_conformidades" ADD CONSTRAINT "no_conformidades_responsable_user_id_fkey" FOREIGN KEY ("responsable_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_correctivas" ADD CONSTRAINT "acciones_correctivas_no_conformidad_id_fkey" FOREIGN KEY ("no_conformidad_id") REFERENCES "no_conformidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_correctivas" ADD CONSTRAINT "acciones_correctivas_responsable_user_id_fkey" FOREIGN KEY ("responsable_user_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
