-- ══════════════════════════════════════════════════════════════════════════════
-- SIMULACIÓN COMPLETA CON TRIGGER INTEGRADO — 29 MAYO 2026
-- Booblepet Spa — Script v3 definitivo
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. CORREGIR EL TRIGGER DEL CHECKLIST ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generar_checklist_desde_pasos()
RETURNS TRIGGER AS $$
DECLARE
  v_servicio_id uuid;
  v_tarea_id    uuid;
BEGIN
  SELECT servicio_id
    INTO v_servicio_id
    FROM public.citas
   WHERE id = NEW.cita_id;

  IF v_servicio_id IS NOT NULL THEN
    FOR v_tarea_id IN
      SELECT tarea_id
        FROM public.pasos_servicio
        WHERE servicio_id = v_servicio_id
        ORDER BY orden ASC
    LOOP
      INSERT INTO public.checklist_seguimiento (ficha_id, tarea_id, completado)
      VALUES (NEW.id, v_tarea_id, false);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger de forma limpia y eliminar cualquier trigger duplicado previo
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'fichas_grooming' 
      AND trigger_schema = 'public'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.fichas_grooming;';
  END LOOP;
END $$;

CREATE TRIGGER trg_generar_checklist
  AFTER INSERT ON public.fichas_grooming
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_checklist_desde_pasos();

-- ─── 1.5. ASEGURAR QUE LOS USUARIOS EXISTAN EN AUTH.USERS ────────────────────
INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
  ('abd386e5-b405-42b6-a792-2e20aaf1c332', 'marcelo@veafycode.com', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcelo Estilista"}', now(), now(), 'authenticated', 'authenticated'),
  ('12287498-dde8-4ea7-a401-fb90b2dd54ad', 'carlos@grooming.com', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Mamani"}', now(), now(), 'authenticated', 'authenticated'),
  ('315a814b-7f0b-4894-8e4e-fb3af098082f', 'explotadoslaboralmente@gmail.com', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcelo Alejandro Villarroel Gutierrez"}', now(), now(), 'authenticated', 'authenticated'),
  ('1bb818b1-fc43-49a2-8106-0544ac1e5434', 'admin@grooming.com', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usuario Nuevo"}', now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. INICIAR SIMULACIÓN DE DATOS ──────────────────────────────────────────
DO $$
DECLARE
  -- ─── USUARIOS (YA EXISTEN EN auth.users / perfiles) ───────────────────────
  uid_groomer_juan   uuid := 'abd386e5-b405-42b6-a792-2e20aaf1c332'; -- marcelo@veafycode.com (Estilista)
  uid_groomer_carlos uuid := '12287498-dde8-4ea7-a401-fb90b2dd54ad'; -- carlos@grooming.com (Estilista simulado)
  uid_cliente        uuid := '315a814b-7f0b-4894-8e4e-fb3af098082f'; -- explotadoslaboralmente@gmail.com (Cliente)
  uid_admin          uuid := '1bb818b1-fc43-49a2-8106-0544ac1e5434'; -- admin@grooming.com (Admin)

  -- ─── SERVICIOS (IDs fijos) ────────────────────────────────────────────────
  svc_banio_basico   uuid := 'a0000001-0000-0000-0000-000000000000';
  svc_banio_premium  uuid := 'a0000002-0000-0000-0000-000000000000';
  svc_corte_raza     uuid := 'a0000003-0000-0000-0000-000000000000';
  svc_banio_corte    uuid := 'a0000004-0000-0000-0000-000000000000';
  svc_spa_vip        uuid := 'a0000005-0000-0000-0000-000000000000';

  -- ─── MODIFICADORES (IDs fijos, servicio_id NULL = aplica a todos) ───────── 
  mod_grande         uuid := 'b0000001-0000-0000-0000-000000000000';
  mod_pequeno        uuid := 'b0000002-0000-0000-0000-000000000000';
  mod_nervioso       uuid := 'b0000003-0000-0000-0000-000000000000';
  mod_alergias       uuid := 'b0000004-0000-0000-0000-000000000000';
  mod_pelaje_largo   uuid := 'b0000005-0000-0000-0000-000000000000';
  mod_nudos          uuid := 'b0000006-0000-0000-0000-000000000000';

  -- ─── TAREAS DISPONIBLES (IDs fijos) ──────────────────────────────────────
  t_rev_pulgas       uuid := 'c0000001-0000-0000-0000-000000000000';
  t_rev_piel         uuid := 'c0000002-0000-0000-0000-000000000000';
  t_banio            uuid := 'c0000003-0000-0000-0000-000000000000';
  t_enjuague         uuid := 'c0000004-0000-0000-0000-000000000000';
  t_secado           uuid := 'c0000005-0000-0000-0000-000000000000';
  t_cepillado        uuid := 'c0000006-0000-0000-0000-000000000000';
  t_corte_maquina    uuid := 'c0000007-0000-0000-0000-000000000000';
  t_corte_tijera     uuid := 'c0000008-0000-0000-0000-000000000000';
  t_unas             uuid := 'c0000009-0000-0000-0000-000000000000';
  t_oidos            uuid := 'c0000010-0000-0000-0000-000000000000';
  t_perfume          uuid := 'c0000011-0000-0000-0000-000000000000';
  t_foto_entrega     uuid := 'c0000012-0000-0000-0000-000000000000';

  -- ─── MASCOTAS (IDs fijos) ────────────────────────────────────────────────
  pet_max            uuid := 'd0000001-0000-0000-0000-000000000000';  -- Dueño: cliente
  pet_luna           uuid := 'd0000002-0000-0000-0000-000000000000';  -- Dueño: cliente
  pet_simba          uuid := 'd0000003-0000-0000-0000-000000000000';  -- Dueño: cliente
  pet_bruno          uuid := 'd0000004-0000-0000-0000-000000000000';  -- Invitado
  pet_kira           uuid := 'd0000005-0000-0000-0000-000000000000';  -- Invitado
  pet_rocky          uuid := 'd0000006-0000-0000-0000-000000000000';  -- Invitado

  -- ─── RESERVAS (IDs fijos) ────────────────────────────────────────────────
  res_web            uuid := 'e0000001-0000-0000-0000-000000000000';  -- Web (Marcelo)
  res_presencial_1   uuid := 'e0000002-0000-0000-0000-000000000000';  -- Presencial mañana
  res_presencial_2   uuid := 'e0000003-0000-0000-0000-000000000000';  -- Presencial tarde

  -- ─── CITAS (IDs fijos) ───────────────────────────────────────────────────
  -- Juan:   Max(08:00), Kira(11:00), Bruno(14:00)
  -- Carlos: Luna(09:00), Simba(11:00), Rocky(14:30)
  cita_max           uuid := 'f0000001-0000-0000-0000-000000000000';
  cita_kira          uuid := 'f0000002-0000-0000-0000-000000000000';
  cita_bruno         uuid := 'f0000003-0000-0000-0000-000000000000';
  cita_luna          uuid := 'f0000004-0000-0000-0000-000000000000';
  cita_simba         uuid := 'f0000005-0000-0000-0000-000000000000';
  cita_rocky         uuid := 'f0000006-0000-0000-0000-000000000000';

  -- ─── FICHAS GROOMING ─────────────────────────────────────────────────────
  ficha_max          uuid := '00f00001-0000-0000-0000-000000000000';
  ficha_kira         uuid := '00f00002-0000-0000-0000-000000000000';
  ficha_luna         uuid := '00f00003-0000-0000-0000-000000000000';
  ficha_simba        uuid := '00f00005-0000-0000-0000-000000000000';

BEGIN

  -- Paso 0: Limpieza total rápida y segura usando TRUNCATE CASCADE
  -- Esto evita cualquier error de clave foránea (FK) de registros previos.
  TRUNCATE TABLE 
    public.checklist_seguimiento,
    public.fotos_grooming,
    public.fichas_grooming,
    public.feed_eventos_cita,
    public.encuestas_satisfaccion,
    public.cita_modificadores_aplicados,
    public.pagos,
    public.facturas,
    public.citas,
    public.reservas,
    public.mascotas,
    public.excepciones_agenda,
    public.horarios_base_groomer,
    public.pasos_servicio,
    public.modificadores_servicio,
    public.servicios,
    public.tareas_disponibles,
    public.retiros_insumo
    RESTART IDENTITY CASCADE;


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 1: INSERTAR/ACTUALIZAR PERFILES
-- ══════════════════════════════════════════════════════════════════════════════

  -- Aseguramos que los perfiles existan en public.perfiles
  INSERT INTO public.perfiles (id, email, nombre_completo, rol, telefono, activo)
  VALUES 
    (uid_groomer_juan, 'marcelo@veafycode.com', 'Marcelo Estilista', 'groomer', '76127361', true),
    (uid_groomer_carlos, 'carlos@grooming.com', 'Carlos Mamani', 'groomer', '75849302', true),
    (uid_cliente, 'explotadoslaboralmente@gmail.com', 'Marcelo Alejandro Villarroel Gutierrez', 'cliente', NULL, true),
    (uid_admin, 'admin@grooming.com', 'Usuario Nuevo', 'admin', NULL, true)
  ON CONFLICT (id) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    rol = EXCLUDED.rol,
    telefono = COALESCE(EXCLUDED.telefono, public.perfiles.telefono),
    activo = EXCLUDED.activo;

  -- Perfil extendido groomers
  INSERT INTO public.datos_groomers (perfil_id, especialidad, biografia, color_tag)
  VALUES
    (uid_groomer_juan,   'Razas medianas y grandes', 'Especialista en Golden Retriever, Rottweiler y razas de trabajo. 5 años de experiencia en grooming canino.', 'bg-blue-100'),
    (uid_groomer_carlos, 'Razas pequeñas y felinos', 'Experto en Caniche, Shih Tzu, Yorkshire y gatos de pelo largo. Certificado en manejo de mascotas ansiosas.', 'bg-pink-100')
  ON CONFLICT (perfil_id) DO UPDATE SET
    especialidad = EXCLUDED.especialidad,
    biografia    = EXCLUDED.biografia,
    color_tag    = EXCLUDED.color_tag;

  -- Perfil extendido cliente
  INSERT INTO public.datos_clientes (perfil_id, puntos_lealtad, ci_nit, direccion)
  VALUES (uid_cliente, 250, '8271934', 'Av. Las Américas #345, Zona Norte')
  ON CONFLICT (perfil_id) DO UPDATE SET puntos_lealtad = 250;


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 2: CATÁLOGO DE SERVICIOS
-- ══════════════════════════════════════════════════════════════════════════════

  INSERT INTO public.servicios (id, nombre, descripcion, duracion_base_minutos, precio_base, categoria, icon_name) VALUES
    (svc_banio_basico,  'Baño Básico',
     'Baño con shampoo estándar, secado con pistola de aire, corte de uñas y revisión de pulgas.',
     45, 60, 'Baño', 'Droplets'),

    (svc_banio_premium, 'Baño Premium',
     'Baño profundo con shampoo medicado y acondicionador desenredante, revisión de piel y pulgas, secado completo, limpieza de oídos, corte de uñas y perfume hipoalergénico.',
     75, 100, 'Baño', 'Sparkles'),

    (svc_corte_raza,    'Corte de Raza',
     'Baño + corte estándar según el estándar de la raza del paciente, usando tijeras profesionales y máquina de corte. Incluye limpieza de oídos y uñas.',
     90, 130, 'Corte', 'Scissors'),

    (svc_banio_corte,   'Baño + Corte Completo',
     'Servicio combinado premium: baño profundo medicado + corte de raza completo con tijeras y máquina. El favorito de los dueños exigentes.',
     120, 180, 'Completo', 'Zap'),

    (svc_spa_vip,       'Spa VIP Completo',
     'Nuestro servicio estrella: revisión clínica de ingreso, baño spa con productos de gama alta, corte de raza personalizado, limpieza facial, perfume exclusivo, foto profesional de entrega y recomendaciones post-servicio.',
     150, 220, 'Spa', 'Heart');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 3: MODIFICADORES DE PRECIO Y TIEMPO (aplican a todos los servicios)
-- Estos ajustan automáticamente duración y precio según las características del perro
-- ══════════════════════════════════════════════════════════════════════════════

  -- servicio_id = NULL → aplica a cualquier servicio
  INSERT INTO public.modificadores_servicio
    (id, servicio_id, criterio, valor, tiempo_extra_minutos, precio_adicional,
     precio_es_porcentaje, tiempo_es_porcentaje, icon_name) VALUES

    (mod_grande,       NULL, 'Grande',         'Tamaño',
      30,  45.00, false, false, 'Ruler'),
    --  +30 min de trabajo extra por volumen / peso
    --  +45 Bs por consumo adicional de productos

    (mod_pequeno,      NULL, 'Pequeño',         'Tamaño',
     -10, -15.00, false, false, 'Minimize2'),
    --  -10 min (menor superficie)
    --  -15 Bs descuento

    (mod_nervioso,     NULL, 'Nervioso',         'Temperamento',
      25,  30.00, false, false, 'ShieldAlert'),
    --  +25 min por pausas y manejo especial
    --  +30 Bs por complejidad

    (mod_alergias,     NULL, 'Piel Sensible',    'Alergias',
      15,  20.00, false, false, 'AlertTriangle'),
    --  +15 min para enjuague doble y cuidado de zona irritada
    --  +20 Bs por shampoo hipoalergénico especial

    (mod_pelaje_largo, NULL, 'Pelaje Largo',     'Pelaje',
      20,  25.00, false, false, 'Wind'),
    --  +20 min para desenredar y secar
    --  +25 Bs por esfuerzo adicional

    (mod_nudos,        NULL, 'Pelaje con Nudos', 'Estado Pelaje',
      30,  30.00, false, false, 'Bug');
    --  +30 min para desanudar manualmente
    --  +30 Bs por trabajo intensivo


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 4: TAREAS DISPONIBLES (catálogo del checklist)
-- ══════════════════════════════════════════════════════════════════════════════

  INSERT INTO public.tareas_disponibles (id, nombre) VALUES
    (t_rev_pulgas,    'Revisión de pulgas y parásitos'),
    (t_rev_piel,      'Revisión de piel y lesiones'),
    (t_banio,         'Baño con shampoo'),
    (t_enjuague,      'Enjuague profundo'),
    (t_secado,        'Secado con pistola de aire'),
    (t_cepillado,     'Cepillado y desenredado'),
    (t_corte_maquina, 'Corte con máquina'),
    (t_corte_tijera,  'Corte y perfilado con tijeras'),
    (t_unas,          'Corte de uñas'),
    (t_oidos,         'Limpieza de oídos'),
    (t_perfume,       'Aplicación de perfume'),
    (t_foto_entrega,  'Foto final y entrega al cliente');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 5: PASOS DE SERVICIO (secuencia de tareas por servicio)
-- Cada paso tiene un orden estricto — el Groomer Workspace los bloquea en cadena
-- ══════════════════════════════════════════════════════════════════════════════

  -- Baño Básico (45 min base): 6 pasos
  INSERT INTO public.pasos_servicio (servicio_id, tarea_id, orden) VALUES
    (svc_banio_basico, t_rev_pulgas,    1),
    (svc_banio_basico, t_banio,         2),
    (svc_banio_basico, t_enjuague,      3),
    (svc_banio_basico, t_secado,        4),
    (svc_banio_basico, t_unas,          5),
    (svc_banio_basico, t_foto_entrega,  6);

  -- Baño Premium (75 min base): 10 pasos
  INSERT INTO public.pasos_servicio (servicio_id, tarea_id, orden) VALUES
    (svc_banio_premium, t_rev_pulgas,   1),
    (svc_banio_premium, t_rev_piel,     2),
    (svc_banio_premium, t_banio,        3),
    (svc_banio_premium, t_enjuague,     4),
    (svc_banio_premium, t_secado,       5),
    (svc_banio_premium, t_cepillado,    6),
    (svc_banio_premium, t_unas,         7),
    (svc_banio_premium, t_oidos,        8),
    (svc_banio_premium, t_perfume,      9),
    (svc_banio_premium, t_foto_entrega, 10);

  -- Corte de Raza (90 min base): 10 pasos
  INSERT INTO public.pasos_servicio (servicio_id, tarea_id, orden) VALUES
    (svc_corte_raza, t_rev_pulgas,    1),
    (svc_corte_raza, t_banio,         2),
    (svc_corte_raza, t_enjuague,      3),
    (svc_corte_raza, t_secado,        4),
    (svc_corte_raza, t_cepillado,     5),
    (svc_corte_raza, t_corte_maquina, 6),
    (svc_corte_raza, t_corte_tijera,  7),
    (svc_corte_raza, t_unas,          8),
    (svc_corte_raza, t_oidos,         9),
    (svc_corte_raza, t_foto_entrega,  10);

  -- Baño + Corte Completo (120 min base): 11 pasos
  INSERT INTO public.pasos_servicio (servicio_id, tarea_id, orden) VALUES
    (svc_banio_corte, t_rev_pulgas,    1),
    (svc_banio_corte, t_rev_piel,      2),
    (svc_banio_corte, t_banio,         3),
    (svc_banio_corte, t_enjuague,      4),
    (svc_banio_corte, t_secado,        5),
    (svc_banio_corte, t_cepillado,     6),
    (svc_banio_corte, t_corte_maquina, 7),
    (svc_banio_corte, t_corte_tijera,  8),
    (svc_banio_corte, t_unas,          9),
    (svc_banio_corte, t_oidos,         10),
    (svc_banio_corte, t_foto_entrega,  11);

  -- Spa VIP Completo (150 min base): 12 pasos
  INSERT INTO public.pasos_servicio (servicio_id, tarea_id, orden) VALUES
    (svc_spa_vip, t_rev_pulgas,    1),
    (svc_spa_vip, t_rev_piel,      2),
    (svc_spa_vip, t_banio,         3),
    (svc_spa_vip, t_enjuague,      4),
    (svc_spa_vip, t_secado,        5),
    (svc_spa_vip, t_cepillado,     6),
    (svc_spa_vip, t_corte_maquina, 7),
    (svc_spa_vip, t_corte_tijera,  8),
    (svc_spa_vip, t_unas,          9),
    (svc_spa_vip, t_oidos,         10),
    (svc_spa_vip, t_perfume,       11),
    (svc_spa_vip, t_foto_entrega,  12);


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 6: HORARIOS BASE GROOMERS (Viernes = dia_semana 5)
-- Basado en EXTRACT(DOW FROM '2026-05-29') = 5
-- ══════════════════════════════════════════════════════════════════════════════

  -- Juan Flores: jornada completa 08:00-19:00 con corte de almuerzo 13:00-14:00
  INSERT INTO public.horarios_base_groomer (groomer_id, dia_semana, hora_inicio, hora_fin) VALUES
    (uid_groomer_juan, 5, '08:00', '13:00'),
    (uid_groomer_juan, 5, '14:00', '19:00');

  -- Carlos Mamani: jornada más corta 09:00-18:00 con corte de almuerzo 13:00-14:00
  INSERT INTO public.horarios_base_groomer (groomer_id, dia_semana, hora_inicio, hora_fin) VALUES
    (uid_groomer_carlos, 5, '09:00', '13:00'),
    (uid_groomer_carlos, 5, '14:00', '18:00');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 7: EXCEPCIONES / BLOQUEOS DE AGENDA — 29 Mayo 2026
-- ══════════════════════════════════════════════════════════════════════════════

  -- BLOQUEO GENERAL: Almuerzo del local (nadie atiende)
  INSERT INTO public.excepciones_agenda
    (tipo, groomer_id, fecha_efectiva, todo_el_dia, hora_inicio, hora_fin, motivo, detalle_opcional)
  VALUES
    ('general', NULL, '2026-05-29', false, '13:00', '14:00',
     'Receso de almuerzo — local cerrado',
     'Bloqueo obligatorio. Ningún groomer atiende. No agendar citas en este intervalo.');

  -- BLOQUEO STAFF: Carlos tiene cita médica en la tarde
  INSERT INTO public.excepciones_agenda
    (tipo, groomer_id, fecha_efectiva, todo_el_dia, hora_inicio, hora_fin, motivo, detalle_opcional)
  VALUES
    ('staff', uid_groomer_carlos, '2026-05-29', false, '16:30', '17:30',
     'Cita médica personal',
     'Carlos Mamani tiene control médico programado de 16:30 a 17:30. Solo afecta su agenda.');

  -- BLOQUEO STAFF: Juan tiene una reunión de capacitación a primera hora del día siguiente
  -- (anotamos como excepción informativa para el 29)
  INSERT INTO public.excepciones_agenda
    (tipo, groomer_id, fecha_efectiva, todo_el_dia, hora_inicio, hora_fin, motivo, detalle_opcional)
  VALUES
    ('staff', uid_groomer_juan, '2026-05-29', false, '18:30', '19:00',
     'Cierre anticipado — preparación capacitación',
     'Juan Flores sale 30 min antes para preparar materiales de la capacitación del sábado.');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 8: MASCOTAS
-- Diseñadas específicamente para activar diferentes modificadores de precio/tiempo
-- ══════════════════════════════════════════════════════════════════════════════

  -- Mascotas de Marcelo (cliente registrado en el sistema)
  INSERT INTO public.mascotas (id, dueno_id, nombre, especie, raza, tamano, temperamento, alergias, foto_perfil_url) VALUES
    -- Grande + Pelaje Largo → activa mod_grande + mod_pelaje_largo
    (pet_max,   uid_cliente, 'Max',   'Perro', 'Golden Retriever', 'Grande',   'Tranquilo', 'Ninguna',       NULL),
    -- Pequeño + Nervioso → activa mod_pequeno + mod_nervioso
    (pet_luna,  uid_cliente, 'Luna',  'Perro', 'Caniche',          'Pequeño',  'Nervioso',  'Ninguna',       NULL),
    -- Mediano + Piel Sensible → activa mod_alergias
    (pet_simba, uid_cliente, 'Simba', 'Gato',  'Persa',            'Mediano',  'Dócil',     'Piel Sensible', NULL);

  -- Mascotas presenciales (clientes sin cuenta — invitados)
  INSERT INTO public.mascotas (id, dueno_id, nombre, especie, raza, tamano, temperamento, alergias, foto_perfil_url) VALUES
    -- Grande + Nervioso → mod_grande + mod_nervioso (el más intenso)
    (pet_bruno, NULL, 'Bruno',  'Perro', 'Rottweiler',   'Grande',  'Nervioso',  'Ninguna',       NULL),
    -- Pequeño + Piel Sensible → mod_pequeno + mod_alergias
    (pet_kira,  NULL, 'Kira',   'Perro', 'Shih Tzu',     'Pequeño', 'Tranquilo', 'Piel Sensible', NULL),
    -- Mediano + Normal → sin modificadores extra (caso base para comparar)
    (pet_rocky, NULL, 'Rocky',  'Perro', 'Labrador Mix', 'Mediano', 'Tranquilo', 'Ninguna',       NULL);


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 9: RESERVAS
-- ══════════════════════════════════════════════════════════════════════════════

  -- Reserva web de Marcelo: 3 mascotas agendadas online el día anterior
  INSERT INTO public.reservas (id, cliente_id, fecha_creacion, estado_general, total_reserva, origen) VALUES
    (res_web, uid_cliente, '2026-05-28 20:00:00-04', 'confirmada', 620.00, 'web');

  -- Reserva presencial mañana: Bruno y Kira (familia Rodríguez, sin cuenta)
  INSERT INTO public.reservas (id, cliente_id, fecha_creacion, estado_general, total_reserva,
    nombre_invitado, telefono_invitado, ci_invitado, origen) VALUES
    (res_presencial_1, NULL, '2026-05-29 08:15:00-04', 'confirmada', 340.00,
     'Familia Rodríguez', '77834512', '4512987', 'presencial');

  -- Reserva presencial tarde: Rocky (Sr. Gutiérrez, sin cuenta)
  INSERT INTO public.reservas (id, cliente_id, fecha_creacion, estado_general, total_reserva,
    nombre_invitado, telefono_invitado, ci_invitado, origen) VALUES
    (res_presencial_2, NULL, '2026-05-29 13:45:00-04', 'confirmada', 130.00,
     'Eduardo Gutiérrez', '76291834', '6718234', 'whatsapp');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 10: CITAS DEL DÍA — 29 Mayo 2026
--
-- CRONOGRAMA REAL:
--
-- JUAN FLORES          CARLOS MAMANI
-- 08:00 Max  [completada]  09:00 Luna  [completada]
-- 11:00 Kira [completada]  11:00 Simba [en_espera]
-- 14:00 Bruno[en_proceso]  14:30 Rocky [programada]
--                          BLOQUEO 16:30-17:30 (cita médica)
--
-- Cada cita tiene fecha_hora_fin calculada = inicio + (base + modificadores)
-- ══════════════════════════════════════════════════════════════════════════════

  -- JUAN — Cita 1: MAX (Golden, Grande + Pelaje Largo)
  -- Servicio: Baño + Corte Completo (120 min base)
  -- Modificadores: Grande (+30) + Pelaje Largo (+20) = 170 min totales
  -- Precio: 180 + 45 + 25 = 250 Bs
  -- 08:00 → 10:50 (redondeado 11:00 en agendamiento)
  INSERT INTO public.citas
    (id, reserva_id, mascota_id, groomer_id, servicio_id,
     fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente)
  VALUES
    (cita_max, res_web, pet_max, uid_groomer_juan, svc_banio_corte,
     '2026-05-29 08:00:00-04', '2026-05-29 10:50:00-04', 'completada',
     'Max tiene el pelaje largo y algo enredado. Solicitar deslanado especial. Es muy tranquilo, no da problemas durante el secado.');

  -- JUAN — Cita 2: KIRA (Shih Tzu, Pequeño + Piel Sensible)
  -- Servicio: Baño Premium (75 min base)
  -- Modificadores: Pequeño (-10) + Alergias (+15) = 80 min totales
  -- Precio: 100 - 15 + 20 = 105 Bs
  -- 11:00 → 12:20
  INSERT INTO public.citas
    (id, reserva_id, mascota_id, groomer_id, servicio_id,
     fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente)
  VALUES
    (cita_kira, res_presencial_1, pet_kira, uid_groomer_juan, svc_banio_premium,
     '2026-05-29 11:00:00-04', '2026-05-29 12:20:00-04', 'completada',
     'Piel muy sensible. OBLIGATORIO usar solo shampoo hipoalergénico Dermavet. La Familia Rodríguez espera en recepción. No usar perfume fuerte.');

  -- JUAN — Cita 3: BRUNO (Rottweiler, Grande + Nervioso + Nudos detectados)
  -- Servicio: Spa VIP Completo (150 min base)
  -- Modificadores: Grande (+30) + Nervioso (+25) + Nudos detectados al ingreso (+30) = 235 min
  -- Precio: 220 + 45 + 30 + 30 = 325 Bs (mod_nudos pendiente de aprobación)
  -- 14:00 → 17:55
  INSERT INTO public.citas
    (id, reserva_id, mascota_id, groomer_id, servicio_id,
     fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente)
  VALUES
    (cita_bruno, res_presencial_1, pet_bruno, uid_groomer_juan, svc_spa_vip,
     '2026-05-29 14:00:00-04', '2026-05-29 17:55:00-04', 'en_espera',
     'Bruno es un Rottweiler de 45kg. MUY nervioso — requiere manejo con calma y pausas frecuentes. El dueño autorizó tiempo y costo adicional por complejidad. NO usar perfume fuerte, le molesta.');

  -- CARLOS — Cita 1: LUNA (Caniche, Pequeño + Nervioso)
  -- Servicio: Corte de Raza (90 min base)
  -- Modificadores: Pequeño (-10) + Nervioso (+25) = 105 min totales
  -- Precio: 130 - 15 + 30 = 145 Bs
  -- 09:00 → 10:45
  INSERT INTO public.citas
    (id, reserva_id, mascota_id, groomer_id, servicio_id,
     fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente)
  VALUES
    (cita_luna, res_web, pet_luna, uid_groomer_carlos, svc_corte_raza,
     '2026-05-29 09:00:00-04', '2026-05-29 10:45:00-04', 'completada',
     'Luna es muy nerviosa y llora durante el secado. Requiere mucha paciencia. IMPORTANTE: dejar el copete largo según instrucción del dueño (Marcelo).');

  -- CARLOS — Cita 2: SIMBA (Persa, Mediano + Piel Sensible)
  -- Servicio: Baño Básico (45 min base)
  -- Modificadores: Alergias (+15) = 60 min totales
  -- Precio: 60 + 20 = 80 Bs
  -- 11:00 → 12:00
  INSERT INTO public.citas
    (id, reserva_id, mascota_id, groomer_id, servicio_id,
     fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente)
  VALUES
    (cita_simba, res_web, pet_simba, uid_groomer_carlos, svc_banio_basico,
     '2026-05-29 11:00:00-04', '2026-05-29 12:00:00-04', 'en_espera',
     'Simba es un gato Persa. Piel sensible. Usar guantes de látex obligatorio. No agua muy caliente. Es dócil pero se incomoda si se prolonga el baño.');

  -- CARLOS — Cita 3: ROCKY (Labrador Mix, Mediano, sin modificadores)
  -- Servicio: Corte de Raza (90 min base)
  -- Sin modificadores activados = 90 min / 130 Bs
  -- 14:30 → 16:00 (termina antes del bloqueo médico de Carlos a las 16:30 ✓)
  INSERT INTO public.citas
    (id, reserva_id, mascota_id, groomer_id, servicio_id,
     fecha_hora_inicio, fecha_hora_fin, estado, notas_cliente)
  VALUES
    (cita_rocky, res_presencial_2, pet_rocky, uid_groomer_carlos, svc_corte_raza,
     '2026-05-29 14:30:00-04', '2026-05-29 16:00:00-04', 'programada',
     'Rocky es un Labrador mezcla, muy tranquilo. Primera vez en Booblepet. El Sr. Gutiérrez contactó por WhatsApp.');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 11: MODIFICADORES APLICADOS A CADA CITA
-- ══════════════════════════════════════════════════════════════════════════════

  -- MAX: Grande + Pelaje Largo (ambos aprobados)
  INSERT INTO public.cita_modificadores_aplicados
    (cita_id, modificador_id, precio_aplicado, concepto_snap, estado_aprobacion)
  VALUES
    (cita_max, mod_grande,       45.00, 'Tamaño Grande — más volumen y tiempo de trabajo (+30 min / +45 Bs)', 'aprobado'),
    (cita_max, mod_pelaje_largo, 25.00, 'Pelaje Largo — desenredado extra y más tiempo de secado (+20 min / +25 Bs)', 'aprobado');

  -- KIRA: Pequeño + Piel Sensible (ambos aprobados)
  INSERT INTO public.cita_modificadores_aplicados
    (cita_id, modificador_id, precio_aplicado, concepto_snap, estado_aprobacion)
  VALUES
    (cita_kira, mod_pequeno,  -15.00, 'Tamaño Pequeño — descuento por menor trabajo (-10 min / -15 Bs)', 'aprobado'),
    (cita_kira, mod_alergias,  20.00, 'Piel Sensible — shampoo Dermavet hipoalergénico (+15 min / +20 Bs)', 'aprobado');

  -- BRUNO: Grande + Nervioso + Nudos (los primeros dos aprobados, nudos pendiente de aprobación del cliente)
  INSERT INTO public.cita_modificadores_aplicados
    (cita_id, modificador_id, precio_aplicado, concepto_snap, estado_aprobacion)
  VALUES
    (cita_bruno, mod_grande,    45.00, 'Tamaño Grande — Rottweiler de 45kg (+30 min / +45 Bs)', 'aprobado'),
    (cita_bruno, mod_nervioso,  30.00, 'Temperamento Nervioso — pausas y manejo especial (+25 min / +30 Bs)', 'aprobado'),
    (cita_bruno, mod_nudos,     30.00, 'Nudos detectados al ingreso — trabajo de desenredado manual (+30 min / +30 Bs)', 'pendiente');
    -- ↑ El groomer detectó nudos AL INICIAR y lo reportó. El cliente (la familia) debe aprobarlo.

  -- LUNA: Pequeño + Nervioso (ambos aprobados)
  INSERT INTO public.cita_modificadores_aplicados
    (cita_id, modificador_id, precio_aplicado, concepto_snap, estado_aprobacion)
  VALUES
    (cita_luna, mod_pequeno,  -15.00, 'Tamaño Pequeño — descuento (-10 min / -15 Bs)', 'aprobado'),
    (cita_luna, mod_nervioso,  30.00, 'Temperamento Nervioso — Luna llora y requiere pausas (+25 min / +30 Bs)', 'aprobado');

  -- SIMBA: Piel Sensible (aprobado) + Nudos (pendiente de aprobación del cliente Marcelo)
  INSERT INTO public.cita_modificadores_aplicados
    (cita_id, modificador_id, precio_aplicado, concepto_snap, estado_aprobacion, url_evidencia)
  VALUES
    (cita_simba, mod_alergias, 20.00, 'Piel Sensible — protocolo hipoalergénico para gato Persa (+15 min / +20 Bs)', 'aprobado', NULL),
    (cita_simba, mod_nudos,     30.00, 'Nudos detectados en la base de la cola — requiere desanudado manual (+30 min / +30 Bs)', 'pendiente', 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=500');

  -- ROCKY: sin modificadores (caso base ideal)


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 12: FICHAS GROOMING (solo para citas ya COMPLETADAS)
-- ══════════════════════════════════════════════════════════════════════════════

  -- Ficha de MAX (completada a las 10:48)
  INSERT INTO public.fichas_grooming
    (id, cita_id, nivel_suciedad, estado_ingreso_nudos, estado_ingreso_pulgas,
     estado_ingreso_heridas, temperamento_actual, peso_actual,
     observaciones_groomer, recomendaciones_post, finalizado_at)
  VALUES
    (ficha_max, cita_max,
     'Medio',           -- nivel_suciedad
     true,              -- estado_ingreso_nudos: SÍ tenía nudos (en el lomo)
     false,             -- estado_ingreso_pulgas: limpio
     false,             -- estado_ingreso_heridas: sin heridas
     'Tranquilo',       -- temperamento_actual
     32.5,              -- peso_actual (kg)
     'Max llegó con nudos en el lomo y costados, probablemente acumulados por rolarse en el jardín. Se desenredó sin mayores problemas. Pelaje en buen estado general, sin signos de irritación cutánea.',
     'Recomendar deslanado especializado cada 4 semanas. Usar cepillo de doble cara para pelaje grueso en casa. Próxima cita en 6 semanas para mantenimiento completo.',
     '2026-05-29 10:48:00-04');

  -- Ficha de KIRA (completada a las 12:17)
  INSERT INTO public.fichas_grooming
    (id, cita_id, nivel_suciedad, estado_ingreso_nudos, estado_ingreso_pulgas,
     estado_ingreso_heridas, temperamento_actual, peso_actual,
     observaciones_groomer, recomendaciones_post, finalizado_at)
  VALUES
    (ficha_kira, cita_kira,
     'Alto',
     false,             -- sin nudos
     false,             -- sin pulgas
     false,             -- sin heridas
     'Tranquilo',
     5.8,
     'Kira llegó bastante sucia, pelo apelmazado. Piel sensible confirmada — zona abdominal con leve eritema. Se aplicó shampoo Dermavet y doble enjuague. Toleró muy bien todo el proceso pese al nivel de suciedad.',
     'Usar EXCLUSIVAMENTE shampoo hipoalergénico para baños en casa. Evitar colonia o perfume fuerte. Programar próximo baño en máximo 3 semanas para evitar acumulación. Revisar la zona abdominal con el veterinario.',
     '2026-05-29 12:17:00-04');

  -- Ficha de LUNA (completada a las 10:41)
  INSERT INTO public.fichas_grooming
    (id, cita_id, nivel_suciedad, estado_ingreso_nudos, estado_ingreso_pulgas,
     estado_ingreso_heridas, temperamento_actual, peso_actual,
     observaciones_groomer, recomendaciones_post, finalizado_at)
  VALUES
    (ficha_luna, cita_luna,
     'Bajo',
     false,
     false,
     false,
     'Muy Nervioso',   -- el temperamento real observado durante el servicio
     4.2,
     'Luna estuvo extremadamente nerviosa durante todo el corte — lloró y se agitó en el secado. Se realizaron 3 pausas de 5 minutos para calmarla. Copete dejado largo según instrucción del dueño Marcelo. Corte del cuerpo ejecutado con máquina N°7.',
     'Programar citas a primera hora (menos estímulos en el local). Considerar hablar con el veterinario sobre ansiolítico natural previo al servicio (tipo Zylkène). Próximo turno no mayor a 4 semanas.',
     '2026-05-29 10:41:00-04');

  -- Ficha de SIMBA (en proceso)
  INSERT INTO public.fichas_grooming
    (id, cita_id, nivel_suciedad, estado_ingreso_nudos, estado_ingreso_pulgas,
     estado_ingreso_heridas, temperamento_actual, peso_actual,
     observaciones_groomer, recomendaciones_post, finalizado_at)
  VALUES
    (ficha_simba, cita_simba,
     'Medio',
     false,             -- sin nudos
     false,             -- sin pulgas
     false,             -- sin heridas
     'Dócil',
     4.5,
     'Simba ingresó tranquilo. Se está procediendo con el baño con cuidado por su piel sensible.',
     NULL,
     NULL);


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 13: CHECKLIST SEGUIMIENTO — MARCAR COMO COMPLETADO
-- El trigger `trg_generar_checklist` ya creó las filas con completado=false
-- cuando insertamos las fichas en el paso anterior.
-- Ahora solo actualizamos para marcar cada tarea como completada con sus notas.
-- ══════════════════════════════════════════════════════════════════════════════

  -- ─── CHECKLIST DE MAX (Baño+Corte → 11 pasos) ───────────────────────────────
  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Sin pulgas ni parásitos detectados'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_rev_pulgas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Piel saludable. Pequeña zona seca en el lomo (zona de nudos desanudados)'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_rev_piel;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Shampoo volumizador para pelaje grueso de doble capa'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_banio;

  UPDATE public.checklist_seguimiento cs
     SET completado = true
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_enjuague;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Secado completo. Max tranquilo durante todo el proceso'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_secado;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Nudos del lomo trabajados con guante desenredador. 15 min adicionales'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_cepillado;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Máquina N°4 para cuerpo y costados'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_corte_maquina;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Tijeras para patas, orejas y zona facial'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_corte_tijera;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Uñas cortadas y lijadas correctamente'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_unas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Orejas limpias, sin signos de infección'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_oidos;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Foto de entrega tomada. Max quedó espectacular'
   WHERE cs.ficha_id = ficha_max
     AND cs.tarea_id = t_foto_entrega;

  -- ─── CHECKLIST DE KIRA (Baño Premium → 10 pasos) ────────────────────────────
  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Sin pulgas'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_rev_pulgas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Eritema leve en zona abdominal — documentado para recomendación al veterinario'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_rev_piel;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Shampoo Dermavet concentración suave'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_banio;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Doble enjuague para eliminar cualquier residuo (piel sensible)'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_enjuague;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Temperatura baja por precaución con la piel sensible'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_secado;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Cepillado suave, sin jalones'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_cepillado;

  UPDATE public.checklist_seguimiento cs
     SET completado = true
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_unas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Orejas limpias'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_oidos;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Perfume hipoalergénico Petuxe — una aplicación suave'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_perfume;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Foto enviada por WhatsApp a la Familia Rodríguez'
   WHERE cs.ficha_id = ficha_kira AND cs.tarea_id = t_foto_entrega;

  -- ─── CHECKLIST DE LUNA (Corte de Raza → 10 pasos) ───────────────────────────
  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Sin pulgas'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_rev_pulgas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Shampoo estándar para Caniche'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_banio;

  UPDATE public.checklist_seguimiento cs
     SET completado = true
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_enjuague;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Luna se agitó con la pistola. Temperatura baja, 3 pausas de 5 min'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_secado;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Cepillado completo tras el secado'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_cepillado;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Máquina N°7 para el cuerpo, N°10 para el hocico'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_corte_maquina;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Copete dejado LARGO por instrucción del dueño Marcelo'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_corte_tijera;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Uñas cortadas'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_unas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Oídos limpios'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_oidos;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Foto enviada a Marcelo por la app'
   WHERE cs.ficha_id = ficha_luna AND cs.tarea_id = t_foto_entrega;

  -- ─── CHECKLIST DE SIMBA (en proceso → 3 de 6 completados) ───────────────────
  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Sin ectoparásitos'
   WHERE cs.ficha_id = ficha_simba AND cs.tarea_id = t_rev_pulgas;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Baño con shampoo neutro diluido al 10%'
   WHERE cs.ficha_id = ficha_simba AND cs.tarea_id = t_banio;

  UPDATE public.checklist_seguimiento cs
     SET completado = true, observacion_item = 'Enjuague completo con agua tibia'
   WHERE cs.ficha_id = ficha_simba AND cs.tarea_id = t_enjuague;



-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 14: ENCUESTAS DE SATISFACCIÓN (para los servicios completados)
-- Simula que los clientes ya calificaron desde la app
-- ══════════════════════════════════════════════════════════════════════════════

  INSERT INTO public.encuestas_satisfaccion (cita_id, puntuacion_nps, comentario) VALUES
    (cita_max,  10, 'Max quedó impecable. Juan es un profesional excelente. 100% recomendado.'),
    (cita_kira,  9, 'Muy cuidadosos con la piel de Kira. Se notó la dedicación con el shampoo especial.'),
    (cita_luna,  8, 'Luna siempre es difícil pero Carlos tuvo mucha paciencia. El copete quedó exactamente como pedimos.');


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 15: INSUMOS DEL INVENTARIO (para que el Groomer Workspace tenga stock)
-- ══════════════════════════════════════════════════════════════════════════════

  -- Categoria de insumos
  INSERT INTO public.categorias_productos (id, nombre)
  VALUES ('ca000001-0000-0000-0000-000000000000', 'Insumos de Estética')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.productos (id, categoria_id, nombre, precio_base, stock_actual, stock_minimo_alerta, es_insumo)
  VALUES
    ('99000001-0000-0000-0000-000000000000', 'ca000001-0000-0000-0000-000000000000',
     'Shampoo Neutro Premium (1L)', 35.00, 8, 3, true),

    ('99000002-0000-0000-0000-000000000000', 'ca000001-0000-0000-0000-000000000000',
     'Shampoo Dermavet Hipoalergénico (500ml)', 55.00, 4, 3, true),
     -- ↑ Stock en nivel de alerta — aparecerá en rojo en InsumosStockModal

    ('99000003-0000-0000-0000-000000000000', 'ca000001-0000-0000-0000-000000000000',
     'Acondicionador Desenredante (750ml)', 42.00, 6, 2, true),

    ('99000004-0000-0000-0000-000000000000', 'ca000001-0000-0000-0000-000000000000',
     'Perfume Hipoalergénico Petuxe (200ml)', 48.00, 2, 3, true),
     -- ↑ Bajo stock crítico — alerta inmediata

    ('99000005-0000-0000-0000-000000000000', 'ca000001-0000-0000-0000-000000000000',
     'Toallas de Microfibra (pack 5)', 28.00, 12, 5, true),

    ('99000006-0000-0000-0000-000000000000', 'ca000001-0000-0000-0000-000000000000',
     'Guantes de Látex (caja 50u)', 15.00, 3, 5, true)
     -- ↑ También en alerta
  ON CONFLICT (id) DO UPDATE SET
    stock_actual = EXCLUDED.stock_actual,
    stock_minimo_alerta = EXCLUDED.stock_minimo_alerta;

  -- Registrar retiros que ya hicieron los groomers esta mañana
  INSERT INTO public.retiros_insumo (producto_id, groomer_id, cantidad, fecha_retiro, motivo) VALUES
    ('99000001-0000-0000-0000-000000000000', uid_groomer_juan,   1, '2026-05-29 08:05:00-04', 'Uso en baño de Max (cita f0000001)'),
    ('99000003-0000-0000-0000-000000000000', uid_groomer_juan,   1, '2026-05-29 08:05:00-04', 'Acondicionador para Max - pelaje denso'),
    ('99000002-0000-0000-0000-000000000000', uid_groomer_juan,   1, '2026-05-29 11:05:00-04', 'Shampoo hipoalergénico para Kira (cita f0000002)'),
    ('99000004-0000-0000-0000-000000000000', uid_groomer_juan,   1, '2026-05-29 12:10:00-04', 'Perfume para Kira - post baño'),
    ('99000001-0000-0000-0000-000000000000', uid_groomer_carlos, 1, '2026-05-29 09:05:00-04', 'Shampoo para Luna (cita f0000004)'),
    ('99000002-0000-0000-0000-000000000000', uid_groomer_carlos, 1, '2026-05-29 11:05:00-04', 'Dermavet para Simba (cita f0000005)'),
    ('99000006-0000-0000-0000-000000000000', uid_groomer_carlos, 1, '2026-05-29 11:04:00-04', 'Guantes de látex para manipular a Simba');


END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN RÁPIDA (ejecutar por separado después del DO block)
-- ══════════════════════════════════════════════════════════════════════════════

-- Ver resumen del día:
-- SELECT
--   c.id,
--   m.nombre AS mascota,
--   m.tamano,
--   m.temperamento,
--   m.alergias,
--   p.nombre_completo AS groomer,
--   s.nombre AS servicio,
--   s.duracion_base_minutos AS duracion_base,
--   c.fecha_hora_inicio::time AS inicio,
--   c.fecha_hora_fin::time AS fin,
--   c.estado,
--   EXTRACT(EPOCH FROM (c.fecha_hora_fin - c.fecha_hora_inicio))/60 AS minutos_reales
-- FROM citas c
-- JOIN mascotas m ON c.mascota_id = m.id
-- JOIN perfiles p ON c.groomer_id = p.id
-- JOIN servicios s ON c.servicio_id = s.id
-- WHERE c.fecha_hora_inicio::date = '2026-05-29'
-- ORDER BY p.nombre_completo, c.fecha_hora_inicio;

-- Ver modificadores aplicados por cita:
-- SELECT
--   m.nombre AS mascota,
--   cm.concepto_snap,
--   cm.precio_aplicado,
--   cm.estado_aprobacion
-- FROM cita_modificadores_aplicados cm
-- JOIN citas c ON cm.cita_id = c.id
-- JOIN mascotas m ON c.mascota_id = m.id
-- WHERE c.fecha_hora_inicio::date = '2026-05-29'
-- ORDER BY m.nombre, cm.concepto_snap;

-- Ver bloqueos del día:
-- SELECT tipo, groomer_id, hora_inicio, hora_fin, motivo
-- FROM excepciones_agenda
-- WHERE fecha_efectiva = '2026-05-29'
-- ORDER BY hora_inicio;

-- Ver insumos en alerta baja:
-- SELECT nombre, stock_actual, stock_minimo_alerta
-- FROM productos
-- WHERE es_insumo = true AND stock_actual <= stock_minimo_alerta
-- ORDER BY stock_actual;
