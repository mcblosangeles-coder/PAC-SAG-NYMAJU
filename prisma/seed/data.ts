export type SeedRole = {
  code: string;
  name: string;
  description: string;
};

export type SeedPermission = {
  code: string;
  name: string;
  description: string;
};

export const ROLES: SeedRole[] = [
  { code: "director_pac", name: "Director PAC", description: "Dirección funcional transversal del proceso PAC." },
  { code: "admin_sistema", name: "Administrador de Sistema", description: "Soporte técnico y administración de seguridad/configuración." },
  { code: "revisor_documental", name: "Revisor Documental", description: "Control documental y checklist." },
  { code: "revisor_tecnico", name: "Revisor Técnico", description: "Evaluación técnica del expediente." },
  { code: "revisor_legal", name: "Revisor Legal", description: "Evaluación legal del expediente." },
  { code: "encargado_kml_sig", name: "Encargado KML/SIG", description: "Validación espacial y consistencia KML/SIG." },
  { code: "responsable_control_final", name: "Responsable Control Final", description: "Control final y liberación SAG según precondiciones." },
  { code: "responsable_auditoria_calidad", name: "Responsable Auditoría/Calidad", description: "Gestión de alertas, NC y trazabilidad de calidad." },
  { code: "profesional_responsable", name: "Profesional Responsable", description: "Gestión del expediente propio y carga documental contextual." },
  { code: "usuario_consulta", name: "Usuario Consulta", description: "Acceso de lectura para monitoreo." }
];

export const PERMISSIONS: SeedPermission[] = [
  { code: "auth.login", name: "Iniciar sesión", description: "Permite autenticación con credenciales." },
  { code: "auth.refresh", name: "Refrescar sesión", description: "Permite renovación de token." },
  { code: "auth.logout", name: "Cerrar sesión", description: "Permite invalidar sesión activa." },
  { code: "auth.me.read", name: "Ver perfil propio", description: "Permite consultar identidad del usuario autenticado." },
  { code: "users.read", name: "Leer usuarios", description: "Permite consultar usuarios." },
  { code: "users.create", name: "Crear usuarios", description: "Permite crear usuarios." },
  { code: "users.update", name: "Actualizar usuarios", description: "Permite editar usuarios." },
  { code: "roles.read", name: "Leer roles", description: "Permite consultar roles." },
  { code: "roles.update", name: "Actualizar roles", description: "Permite asignación/gestión de roles." },
  { code: "permissions.read", name: "Leer permisos", description: "Permite consultar catálogo de permisos." },
  { code: "expedientes.read", name: "Leer expedientes", description: "Permite consultar expedientes." },
  { code: "expedientes.create", name: "Crear expedientes", description: "Permite registrar expedientes." },
  { code: "expedientes.update", name: "Actualizar expedientes", description: "Permite editar datos generales de expediente." },
  { code: "expedientes.change_state", name: "Cambiar estado expediente", description: "Permite cambiar estado global (uso restringido)." },
  { code: "workflow.read", name: "Leer workflow", description: "Permite visualizar flujo y etapas del expediente." },
  { code: "workflow.blocking_reasons.read", name: "Leer bloqueos workflow", description: "Permite consultar bloqueos del workflow." },
  { code: "workflow.reopen_stage", name: "Reabrir etapa", description: "Permite reabrir etapas bajo trazabilidad." },
  { code: "recepcion.read", name: "Leer recepción", description: "Permite consultar datos de recepción." },
  { code: "recepcion.write", name: "Editar recepción", description: "Permite registrar/actualizar recepción." },
  { code: "recepcion.finalize", name: "Finalizar recepción", description: "Permite cerrar recepción documental." },
  { code: "checklist.read", name: "Leer checklist", description: "Permite consultar checklist." },
  { code: "checklist.write", name: "Editar checklist", description: "Permite editar ítems de checklist." },
  { code: "checklist.close", name: "Cerrar checklist", description: "Permite cierre de checklist con precondiciones." },
  { code: "incompatibilidades.read", name: "Leer incompatibilidades", description: "Permite consultar declaraciones de incompatibilidad." },
  { code: "incompatibilidades.sign", name: "Firmar incompatibilidades", description: "Permite declarar y firmar incompatibilidades." },
  { code: "revision_tecnica.read", name: "Leer revisión técnica", description: "Permite consultar revisión técnica." },
  { code: "revision_tecnica.write", name: "Editar revisión técnica", description: "Permite elaborar revisión técnica." },
  { code: "revision_tecnica.close", name: "Cerrar revisión técnica", description: "Permite cierre técnico formal." },
  { code: "revision_legal.read", name: "Leer revisión legal", description: "Permite consultar revisión legal." },
  { code: "revision_legal.write", name: "Editar revisión legal", description: "Permite elaborar revisión legal." },
  { code: "revision_legal.close", name: "Cerrar revisión legal", description: "Permite cierre legal formal." },
  { code: "kml.read", name: "Leer KML/SIG", description: "Permite consultar validaciones KML/SIG." },
  { code: "kml.write", name: "Editar KML/SIG", description: "Permite cargar/validar insumos KML/SIG." },
  { code: "kml.close", name: "Cerrar KML/SIG", description: "Permite cierre de etapa KML/SIG." },
  { code: "informe.read", name: "Leer informe", description: "Permite consultar informe técnico." },
  { code: "informe.write", name: "Editar informe", description: "Permite generar/editar informe técnico." },
  { code: "informe.approve", name: "Aprobar informe", description: "Permite aprobar informe técnico." },
  { code: "control_final.read", name: "Leer control final", description: "Permite consultar control final." },
  { code: "control_final.write", name: "Editar control final", description: "Permite elaborar control final." },
  { code: "control_final.approve", name: "Aprobar control final", description: "Permite aprobar control final." },
  { code: "sag.release", name: "Liberar SAG", description: "Permite liberar expediente a SAG." },
  { code: "documentos.read", name: "Leer documentos", description: "Permite listar documentos del expediente." },
  { code: "documentos.upload", name: "Subir documentos", description: "Permite carga documental." },
  { code: "documentos.version", name: "Versionar documentos", description: "Permite crear nuevas versiones de documento." },
  { code: "documentos.download", name: "Descargar documentos", description: "Permite descargar documentos." },
  { code: "alertas.read", name: "Leer alertas", description: "Permite consultar alertas." },
  { code: "alertas.create", name: "Crear alertas", description: "Permite crear alertas manuales." },
  { code: "alertas.resolve", name: "Resolver alertas", description: "Permite cerrar alertas." },
  { code: "nc.read", name: "Leer no conformidades", description: "Permite consultar NC." },
  { code: "nc.create", name: "Crear no conformidades", description: "Permite registrar NC." },
  { code: "nc.update", name: "Actualizar no conformidades", description: "Permite gestionar NC." },
  { code: "nc.close", name: "Cerrar no conformidades", description: "Permite cierre de NC." },
  { code: "audit.read", name: "Leer auditoría", description: "Permite consultar trazabilidad y logs." },
  { code: "reportes.read", name: "Leer reportes", description: "Permite consultar dashboard/reportes." },
  { code: "reportes.export", name: "Exportar reportes", description: "Permite exportar reportes." },
  { code: "config.read", name: "Leer configuración", description: "Permite consultar catálogos y parámetros." },
  { code: "config.manage", name: "Gestionar configuración", description: "Permite administrar catálogos y parámetros." }
];

export const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  director_pac: PERMISSIONS.map((p) => p.code),
  admin_sistema: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "users.read", "users.create", "users.update",
    "roles.read", "roles.update", "permissions.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "recepcion.read", "checklist.read", "incompatibilidades.read",
    "revision_tecnica.read", "revision_legal.read", "kml.read",
    "informe.read", "control_final.read",
    "documentos.read", "documentos.download",
    "alertas.read", "nc.read",
    "audit.read", "reportes.read", "reportes.export",
    "config.read", "config.manage",
    "workflow.reopen_stage"
  ],
  revisor_documental: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "recepcion.read", "recepcion.write", "recepcion.finalize",
    "checklist.read", "checklist.write", "checklist.close",
    "documentos.read", "documentos.upload", "documentos.version", "documentos.download"
  ],
  revisor_tecnico: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "revision_tecnica.read", "revision_tecnica.write", "revision_tecnica.close",
    "documentos.read", "documentos.upload", "documentos.version", "documentos.download"
  ],
  revisor_legal: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "revision_legal.read", "revision_legal.write", "revision_legal.close",
    "documentos.read", "documentos.upload", "documentos.version", "documentos.download"
  ],
  encargado_kml_sig: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "kml.read", "kml.write", "kml.close",
    "documentos.read", "documentos.upload", "documentos.version", "documentos.download"
  ],
  responsable_control_final: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "expedientes.change_state",
    "workflow.read", "workflow.blocking_reasons.read", "workflow.reopen_stage",
    "informe.read", "informe.write", "informe.approve",
    "control_final.read", "control_final.write", "control_final.approve",
    "sag.release",
    "alertas.read", "nc.read", "audit.read", "reportes.read", "reportes.export",
    "documentos.read", "documentos.download"
  ],
  responsable_auditoria_calidad: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "alertas.read", "alertas.create", "alertas.resolve",
    "nc.read", "nc.create", "nc.update", "nc.close",
    "audit.read", "reportes.read", "reportes.export",
    "documentos.read", "documentos.download"
  ],
  profesional_responsable: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "recepcion.read", "checklist.read",
    "incompatibilidades.read", "incompatibilidades.sign",
    "documentos.read", "documentos.upload", "documentos.version", "documentos.download"
  ],
  usuario_consulta: [
    "auth.login", "auth.refresh", "auth.logout", "auth.me.read",
    "expedientes.read", "workflow.read", "workflow.blocking_reasons.read",
    "recepcion.read", "checklist.read", "incompatibilidades.read",
    "revision_tecnica.read", "revision_legal.read", "kml.read",
    "informe.read", "control_final.read",
    "documentos.read", "documentos.download",
    "alertas.read", "nc.read", "reportes.read"
  ]
};

export const CATALOGO_TIPOS_DOCUMENTO = [
  { code: "SOLICITUD", name: "Solicitud", descripcion: "Documento principal de solicitud PAC." },
  { code: "ANTECEDENTE_TECNICO", name: "Antecedente Técnico", descripcion: "Soporte técnico del expediente." },
  { code: "ANTECEDENTE_LEGAL", name: "Antecedente Legal", descripcion: "Soporte legal del expediente." },
  { code: "KML", name: "Archivo KML", descripcion: "Insumo geoespacial KML/SIG." },
  { code: "INFORME_TECNICO", name: "Informe Técnico", descripcion: "Informe técnico emitido por revisión." },
  { code: "RESOLUCION", name: "Resolución", descripcion: "Resolución o acto administrativo asociado." }
] as const;

export const CATALOGO_PARAMETROS = [
  { tipo: "CANAL_RECEPCION", code: "PRESENCIAL", name: "Presencial", sortOrder: 1 },
  { tipo: "CANAL_RECEPCION", code: "CORREO", name: "Correo", sortOrder: 2 },
  { tipo: "CANAL_RECEPCION", code: "PLATAFORMA_DIGITAL", name: "Plataforma Digital", sortOrder: 3 },
  { tipo: "CANAL_RECEPCION", code: "INTERNO", name: "Interno", sortOrder: 4 },
  { tipo: "PRIORIDAD_EXPEDIENTE", code: "BAJA", name: "Baja", sortOrder: 1 },
  { tipo: "PRIORIDAD_EXPEDIENTE", code: "MEDIA", name: "Media", sortOrder: 2 },
  { tipo: "PRIORIDAD_EXPEDIENTE", code: "ALTA", name: "Alta", sortOrder: 3 },
  { tipo: "PRIORIDAD_EXPEDIENTE", code: "CRITICA", name: "Crítica", sortOrder: 4 }
] as const;
