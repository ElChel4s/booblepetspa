-- Script de Seed Data para Prueba Completa del Sistema
-- Ejecutar este script desde el SQL Editor de Supabase
-- Rellena datos simulando un "día ocupado" hoy a partir de las 18:00 y mañana.
-- Contempla Citas, Reservas, Excepciones, Fichas de Grooming, Insumos Usados y Finanzas.

DO $$
DECLARE
    v_cliente_marcelo uuid;
    v_groomer_marcelo uuid;
    v_groomer_carlos uuid;
    v_mascota1 uuid := gen_random_uuid();
    v_mascota2 uuid := gen_random_uuid();
    v_reserva1 uuid := gen_random_uuid();
    v_reserva2 uuid := gen_random_uuid();
    v_reserva3 uuid := gen_random_uuid();
    v_reserva4 uuid := gen_random_uuid();
    v_reserva5 uuid := gen_random_uuid();
    v_cita1 uuid := gen_random_uuid();
    v_cita2 uuid := gen_random_uuid();
    v_cita3 uuid := gen_random_uuid();
    v_cita4 uuid := gen_random_uuid();
    v_cita5 uuid := gen_random_uuid();
    v_servicio_bano uuid;
    v_servicio_corte uuid;
    v_insumo_shampoo uuid;
    v_insumo_balsamo uuid;
    v_insumo_perfume uuid;
    v_fecha_hoy date := current_date;
    v_fecha_manana date := current_date + interval '1 day';
BEGIN
    -- 1. Obtener IDs de Usuarios Existentes
    -- Obtener Cliente Marcelo
    SELECT id INTO v_cliente_marcelo FROM perfiles WHERE rol = 'cliente' AND nombre_completo ILIKE '%Marcelo%' LIMIT 1;
    IF v_cliente_marcelo IS NULL THEN
        -- Fallback de seguridad al ID explícito proveido por el usuario
        v_cliente_marcelo := '315a814b-7f0b-4894-8e4e-fb3af098082f'; 
    END IF;

    -- Obtener Groomer Marcelo
    SELECT id INTO v_groomer_marcelo FROM perfiles WHERE rol = 'groomer' AND nombre_completo ILIKE '%Marcelo%' LIMIT 1;
    IF v_groomer_marcelo IS NULL THEN
        -- Si no hay "Marcelo" groomer, tomar el primer groomer disponible
        SELECT id INTO v_groomer_marcelo FROM perfiles WHERE rol = 'groomer' LIMIT 1;
    END IF;

    -- Obtener Groomer Carlos
    SELECT id INTO v_groomer_carlos FROM perfiles WHERE rol = 'groomer' AND nombre_completo ILIKE '%Carlos%' LIMIT 1;
    IF v_groomer_carlos IS NULL THEN
        SELECT id INTO v_groomer_carlos FROM perfiles WHERE rol = 'groomer' AND id != v_groomer_marcelo LIMIT 1;
    END IF;
    
    IF v_groomer_carlos IS NULL THEN
        v_groomer_carlos := v_groomer_marcelo;
    END IF;

    -- 2. Insertar Servicios dummy si no existen
    SELECT id INTO v_servicio_bano FROM servicios WHERE nombre ILIKE '%Baño%' LIMIT 1;
    IF v_servicio_bano IS NULL THEN
        v_servicio_bano := gen_random_uuid();
        INSERT INTO servicios (id, nombre, descripcion, duracion_base_minutos, precio_base, categoria)
        VALUES (v_servicio_bano, 'Baño Spa Básico', 'Baño completo con shampoo premium', 60, 50.00, 'Baños');
    END IF;

    SELECT id INTO v_servicio_corte FROM servicios WHERE nombre ILIKE '%Corte%' LIMIT 1;
    IF v_servicio_corte IS NULL THEN
        v_servicio_corte := gen_random_uuid();
        INSERT INTO servicios (id, nombre, descripcion, duracion_base_minutos, precio_base, categoria)
        VALUES (v_servicio_corte, 'Corte de Raza Especial', 'Corte especializado según la raza', 90, 80.00, 'Cortes');
    END IF;

    -- 3. Insertar Insumos dummy si no existen
    SELECT id INTO v_insumo_shampoo FROM productos WHERE es_insumo = true AND nombre ILIKE '%Shampoo%' LIMIT 1;
    IF v_insumo_shampoo IS NULL THEN
        v_insumo_shampoo := gen_random_uuid();
        INSERT INTO productos (id, nombre, precio_base, stock_actual, es_insumo, descripcion)
        VALUES (v_insumo_shampoo, 'Shampoo Hipoalergénico 5L', 150.00, 5, true, 'Shampoo para uso de groomers');
    END IF;

    SELECT id INTO v_insumo_perfume FROM productos WHERE es_insumo = true AND nombre ILIKE '%Perfume%' LIMIT 1;
    IF v_insumo_perfume IS NULL THEN
        v_insumo_perfume := gen_random_uuid();
        INSERT INTO productos (id, nombre, precio_base, stock_actual, es_insumo, descripcion)
        VALUES (v_insumo_perfume, 'Perfume Frutal 500ml', 40.00, 10, true, 'Perfume finalizador');
    END IF;

    -- 4. Crear Mascotas para el Cliente Marcelo
    IF NOT EXISTS (SELECT 1 FROM mascotas WHERE dueno_id = v_cliente_marcelo) THEN
        INSERT INTO mascotas (id, dueno_id, nombre, especie, raza, tamano, temperamento)
        VALUES 
        (v_mascota1, v_cliente_marcelo, 'Max', 'perro', 'Golden Retriever', 'grande', 'Amigable'),
        (v_mascota2, v_cliente_marcelo, 'Luna', 'gato', 'Siamés', 'pequeno', 'Tranquilo');
    ELSE
        SELECT id INTO v_mascota1 FROM mascotas WHERE dueno_id = v_cliente_marcelo ORDER BY nombre ASC LIMIT 1;
        SELECT id INTO v_mascota2 FROM mascotas WHERE dueno_id = v_cliente_marcelo ORDER BY nombre DESC LIMIT 1;
        IF v_mascota2 IS NULL OR v_mascota1 = v_mascota2 THEN
             v_mascota2 := v_mascota1; -- Reutilizar mascota si solo tiene 1
        END IF;
    END IF;

    -- 5. Crear Excepciones (Bloqueos de Horario)
    -- Bloqueo General hoy a las 15:00 a 16:00
    INSERT INTO excepciones_agenda (tipo, fecha_efectiva, todo_el_dia, hora_inicio, hora_fin, motivo, detalle_opcional)
    VALUES ('general', v_fecha_hoy, false, '15:00:00', '16:00:00', 'Reunión de Staff', 'Alineamiento y limpieza profunda');

    -- Bloqueo Staff mañana a las 09:00 a 10:00 para Marcelo Groomer
    INSERT INTO excepciones_agenda (tipo, groomer_id, fecha_efectiva, todo_el_dia, hora_inicio, hora_fin, motivo, detalle_opcional)
    VALUES ('staff', v_groomer_marcelo, v_fecha_manana, false, '09:00:00', '10:00:00', 'Cita médica personal', 'Control médico');

    -- 6. Crear Reservas y Citas Simuladas (Escenario Ocupado a partir de las 18:00)

    -- Cita 1: HOY COMPLETADA (Groomer Marcelo, Mascota Max, Baño, 16:00 a 17:00) -> Terminada, lista para cobrar
    INSERT INTO reservas (id, cliente_id, estado_general, total_reserva) VALUES (v_reserva1, v_cliente_marcelo, 'completada', 50.00);
    INSERT INTO citas (id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado)
    VALUES (v_cita1, v_reserva1, v_mascota1, v_groomer_marcelo, v_servicio_bano, 
            v_fecha_hoy + time '16:00:00', v_fecha_hoy + time '17:00:00', 'completada');

    -- Cita 2: HOY EN PROCESO (Groomer Marcelo, Mascota Luna, Corte, 18:00 a 19:30) -> Ocurriendo ahora (a partir de las 6)
    INSERT INTO reservas (id, cliente_id, estado_general, total_reserva) VALUES (v_reserva2, v_cliente_marcelo, 'en_proceso', 80.00);
    INSERT INTO citas (id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado)
    VALUES (v_cita2, v_reserva2, v_mascota2, v_groomer_marcelo, v_servicio_corte, 
            v_fecha_hoy + time '18:00:00', v_fecha_hoy + time '19:30:00', 'en_proceso');

    -- Cita 3: HOY PROGRAMADA (Groomer Carlos, Mascota Max, Baño, 18:30 a 19:30) -> Próxima Cita
    INSERT INTO reservas (id, cliente_id, estado_general, total_reserva) VALUES (v_reserva3, v_cliente_marcelo, 'pendiente', 50.00);
    INSERT INTO citas (id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado)
    VALUES (v_cita3, v_reserva3, v_mascota1, v_groomer_carlos, v_servicio_bano, 
            v_fecha_hoy + time '18:30:00', v_fecha_hoy + time '19:30:00', 'programada');

    -- Cita 4: MAÑANA PROGRAMADA (Groomer Marcelo, Mascota Luna, Baño, 10:30 a 11:30) -> Cita Futura
    INSERT INTO reservas (id, cliente_id, estado_general, total_reserva) VALUES (v_reserva4, v_cliente_marcelo, 'pendiente', 50.00);
    INSERT INTO citas (id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado)
    VALUES (v_cita4, v_reserva4, v_mascota2, v_groomer_marcelo, v_servicio_bano, 
            v_fecha_manana + time '10:30:00', v_fecha_manana + time '11:30:00', 'programada');

    -- Cita 5: HOY CANCELADA (Groomer Carlos, Mascota Luna, Corte, 17:00 a 18:30) -> Cancelación de último momento
    INSERT INTO reservas (id, cliente_id, estado_general, total_reserva) VALUES (v_reserva5, v_cliente_marcelo, 'cancelada', 0.00);
    INSERT INTO citas (id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado)
    VALUES (v_cita5, v_reserva5, v_mascota2, v_groomer_carlos, v_servicio_corte, 
            v_fecha_hoy + time '17:00:00', v_fecha_hoy + time '18:30:00', 'cancelada');

    -- 7. Crear Ficha Grooming y Registro de Insumos para Cita 1 (Completada)
    INSERT INTO fichas_grooming (cita_id, nivel_suciedad, estado_ingreso_nudos, observaciones_groomer, finalizado_at)
    VALUES (v_cita1, 'media', false, 'Mascota se portó excelente. Sin complicaciones.', v_fecha_hoy + time '17:05:00');

    -- Registrar que el groomer usó estos insumos y marcó "abrió uno nuevo" en el perfume
    INSERT INTO cita_insumos_usados (cita_id, producto_id, cantidad, abrio_nuevo)
    VALUES 
    (v_cita1, v_insumo_shampoo, 1, false),
    (v_cita1, v_insumo_perfume, 1, true);

    -- Restar stock del insumo porque se abrió uno nuevo
    UPDATE productos SET stock_actual = stock_actual - 1 WHERE id = v_insumo_perfume;

    -- 8. Crear Ficha Grooming para Cita 2 (En Proceso)
    INSERT INTO fichas_grooming (cita_id, nivel_suciedad, estado_ingreso_nudos, observaciones_groomer)
    VALUES (v_cita2, 'alta', true, 'Tiene bastantes nudos, en proceso de desenredo manual.');

    -- 9. Módulo Finanzas - Arqueo y Cobro para Reserva 1
    DECLARE
        v_pedido_id uuid := gen_random_uuid();
        v_factura_id uuid := gen_random_uuid();
        v_arqueo_id uuid;
    BEGIN
        -- Buscar arqueo abierto o crearlo para poder simular el entorno de caja
        SELECT id INTO v_arqueo_id FROM arqueos_caja WHERE estado = 'abierta' LIMIT 1;
        IF v_arqueo_id IS NULL THEN
            INSERT INTO arqueos_caja (usuario_id, monto_inicial)
            SELECT id, 150.00 FROM perfiles WHERE rol IN ('admin', 'recepcion') LIMIT 1
            RETURNING id INTO v_arqueo_id;
        END IF;

        -- Crear Pedido Final
        INSERT INTO pedidos (id, cliente_id, monto_total, estado_pedido, estado_pago)
        VALUES (v_pedido_id, v_cliente_marcelo, 50.00, 'completado', 'pagado');

        INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario_snap)
        VALUES (v_pedido_id, v_insumo_perfume, 1, 0.00); 

        -- Generar Factura/Comprobante
        INSERT INTO facturas (id, cliente_id, reserva_id, pedido_id, nit_ci, razon_social, monto_total, estado_factura)
        VALUES (v_factura_id, v_cliente_marcelo, v_reserva1, v_pedido_id, '12345678', 'Marcelo Alejandro', 50.00, 'emitida');

        -- Registrar Pago
        INSERT INTO pagos (factura_id, metodo_pago, monto_pagado, referencia_transaccion)
        VALUES (v_factura_id, 'qr', 50.00, 'QR-5544332211');
    END;

    -- 10. Crear Notificaciones de Prueba
    INSERT INTO notificaciones (usuario_id, rol_destino, titulo, mensaje, tipo, link_modulo)
    VALUES 
    (v_cliente_marcelo, 'cliente', 'Cita Completada', 'Tu mascota Max ya está lista para recoger', 'cita', '/cliente/citas'),
    (v_groomer_marcelo, 'groomer', 'Nueva Cita Programada', 'Tienes una nueva cita mañana a las 10:30', 'cita', '/groomer/agenda');

    -- 12. Crear Tareas, Servicios y Pasos de los adicionales
    DECLARE
        v_tarea_corte_unas uuid;
        v_tarea_limado_unas uuid;
        v_tarea_gel_dental uuid;
        v_tarea_cepillado_dental uuid;
        v_tarea_limpieza_oidos uuid;
        v_tarea_desodorizacion uuid;
        v_tarea_drenaje uuid;
        v_tarea_lavado_antiseptico uuid;
        v_tarea_bano_hipo uuid;
        v_tarea_masaje uuid;
        
        v_srv_corte_unas uuid;
        v_srv_limpieza_dental uuid;
        v_srv_limpieza_oidos uuid;
        v_srv_drenaje uuid;
        v_srv_shampoo_hipo uuid;
    BEGIN
        -- Tareas
        SELECT id INTO v_tarea_corte_unas FROM tareas_disponibles WHERE nombre = 'Corte de Uñas' LIMIT 1;
        IF v_tarea_corte_unas IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Corte de Uñas') RETURNING id INTO v_tarea_corte_unas;
        END IF;

        SELECT id INTO v_tarea_limado_unas FROM tareas_disponibles WHERE nombre = 'Limado de Uñas' LIMIT 1;
        IF v_tarea_limado_unas IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Limado de Uñas') RETURNING id INTO v_tarea_limado_unas;
        END IF;

        SELECT id INTO v_tarea_gel_dental FROM tareas_disponibles WHERE nombre = 'Aplicación de Gel Enzimático' LIMIT 1;
        IF v_tarea_gel_dental IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Aplicación de Gel Enzimático') RETURNING id INTO v_tarea_gel_dental;
        END IF;

        SELECT id INTO v_tarea_cepillado_dental FROM tareas_disponibles WHERE nombre = 'Cepillado de Dientes' LIMIT 1;
        IF v_tarea_cepillado_dental IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Cepillado de Dientes') RETURNING id INTO v_tarea_cepillado_dental;
        END IF;

        SELECT id INTO v_tarea_limpieza_oidos FROM tareas_disponibles WHERE nombre = 'Limpieza de Oído Externo' LIMIT 1;
        IF v_tarea_limpieza_oidos IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Limpieza de Oído Externo') RETURNING id INTO v_tarea_limpieza_oidos;
        END IF;

        SELECT id INTO v_tarea_desodorizacion FROM tareas_disponibles WHERE nombre = 'Desodorización de Oídos' LIMIT 1;
        IF v_tarea_desodorizacion IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Desodorización de Oídos') RETURNING id INTO v_tarea_desodorizacion;
        END IF;

        SELECT id INTO v_tarea_drenaje FROM tareas_disponibles WHERE nombre = 'Drenaje de Glándulas Anales' LIMIT 1;
        IF v_tarea_drenaje IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Drenaje de Glándulas Anales') RETURNING id INTO v_tarea_drenaje;
        END IF;

        SELECT id INTO v_tarea_lavado_antiseptico FROM tareas_disponibles WHERE nombre = 'Lavado Antiséptico' LIMIT 1;
        IF v_tarea_lavado_antiseptico IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Lavado Antiséptico') RETURNING id INTO v_tarea_lavado_antiseptico;
        END IF;

        SELECT id INTO v_tarea_bano_hipo FROM tareas_disponibles WHERE nombre = 'Baño Especial Hipoalergénico' LIMIT 1;
        IF v_tarea_bano_hipo IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Baño Especial Hipoalergénico') RETURNING id INTO v_tarea_bano_hipo;
        END IF;

        SELECT id INTO v_tarea_masaje FROM tareas_disponibles WHERE nombre = 'Masaje Relajante' LIMIT 1;
        IF v_tarea_masaje IS NULL THEN
            INSERT INTO tareas_disponibles (nombre) VALUES ('Masaje Relajante') RETURNING id INTO v_tarea_masaje;
        END IF;

        -- Servicios
        SELECT id INTO v_srv_corte_unas FROM servicios WHERE nombre = 'Corte de Uñas' LIMIT 1;
        IF v_srv_corte_unas IS NULL THEN
            INSERT INTO servicios (nombre, descripcion, duracion_base_minutos, precio_base, categoria)
            VALUES ('Corte de Uñas', 'Servicio adicional de corte y limado de uñas.', 15, 15.00, 'Adicional')
            RETURNING id INTO v_srv_corte_unas;
        END IF;

        SELECT id INTO v_srv_limpieza_dental FROM servicios WHERE nombre = 'Limpieza Dental' LIMIT 1;
        IF v_srv_limpieza_dental IS NULL THEN
            INSERT INTO servicios (nombre, descripcion, duracion_base_minutos, precio_base, categoria)
            VALUES ('Limpieza Dental', 'Cepillado dental y aplicación de gel enzimático.', 20, 35.00, 'Adicional')
            RETURNING id INTO v_srv_limpieza_dental;
        END IF;

        SELECT id INTO v_srv_limpieza_oidos FROM servicios WHERE nombre = 'Limpieza de Oídos' LIMIT 1;
        IF v_srv_limpieza_oidos IS NULL THEN
            INSERT INTO servicios (nombre, descripcion, duracion_base_minutos, precio_base, categoria)
            VALUES ('Limpieza de Oídos', 'Limpieza profunda de oídos con soluciones seguras.', 10, 12.00, 'Adicional')
            RETURNING id INTO v_srv_limpieza_oidos;
        END IF;

        SELECT id INTO v_srv_drenaje FROM servicios WHERE nombre = 'Drenaje de Glándulas' LIMIT 1;
        IF v_srv_drenaje IS NULL THEN
            INSERT INTO servicios (nombre, descripcion, duracion_base_minutos, precio_base, categoria)
            VALUES ('Drenaje de Glándulas', 'Drenaje higiénico de glándulas anales.', 15, 20.00, 'Adicional')
            RETURNING id INTO v_srv_drenaje;
        END IF;

        SELECT id INTO v_srv_shampoo_hipo FROM servicios WHERE nombre = 'Shampoo Hipoalergénico' LIMIT 1;
        IF v_srv_shampoo_hipo IS NULL THEN
            INSERT INTO servicios (nombre, descripcion, duracion_base_minutos, precio_base, categoria)
            VALUES ('Shampoo Hipoalergénico', 'Baño terapéutico hipoalergénico y masaje.', 25, 25.00, 'Adicional')
            RETURNING id INTO v_srv_shampoo_hipo;
        END IF;

        -- Pasos
        IF NOT EXISTS (SELECT 1 FROM pasos_servicio WHERE servicio_id = v_srv_corte_unas) THEN
            INSERT INTO pasos_servicio (servicio_id, tarea_id, orden) VALUES
            (v_srv_corte_unas, v_tarea_corte_unas, 1),
            (v_srv_corte_unas, v_tarea_limado_unas, 2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pasos_servicio WHERE servicio_id = v_srv_limpieza_dental) THEN
            INSERT INTO pasos_servicio (servicio_id, tarea_id, orden) VALUES
            (v_srv_limpieza_dental, v_tarea_cepillado_dental, 1),
            (v_srv_limpieza_dental, v_tarea_gel_dental, 2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pasos_servicio WHERE servicio_id = v_srv_limpieza_oidos) THEN
            INSERT INTO pasos_servicio (servicio_id, tarea_id, orden) VALUES
            (v_srv_limpieza_oidos, v_tarea_limpieza_oidos, 1),
            (v_srv_limpieza_oidos, v_tarea_desodorizacion, 2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pasos_servicio WHERE servicio_id = v_srv_drenaje) THEN
            INSERT INTO pasos_servicio (servicio_id, tarea_id, orden) VALUES
            (v_srv_drenaje, v_tarea_drenaje, 1),
            (v_srv_drenaje, v_tarea_lavado_antiseptico, 2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pasos_servicio WHERE servicio_id = v_srv_shampoo_hipo) THEN
            INSERT INTO pasos_servicio (servicio_id, tarea_id, orden) VALUES
            (v_srv_shampoo_hipo, v_tarea_bano_hipo, 1),
            (v_srv_shampoo_hipo, v_tarea_masaje, 2);
        END IF;
    END;

    -- 11. Crear modificadores que representen Servicios Adicionales (no reglas)
    IF NOT EXISTS (SELECT 1 FROM modificadores_servicio WHERE criterio = 'Corte de Uñas') THEN
        INSERT INTO modificadores_servicio (criterio, valor, precio_adicional, icon_name)
        VALUES ('Corte de Uñas', 'Servicio Adicional', 15.00, 'Scissors');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM modificadores_servicio WHERE criterio = 'Limpieza Dental') THEN
        INSERT INTO modificadores_servicio (criterio, valor, precio_adicional, icon_name)
        VALUES ('Limpieza Dental', 'Servicio Adicional', 35.00, 'Sparkles');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM modificadores_servicio WHERE criterio = 'Limpieza de Oídos') THEN
        INSERT INTO modificadores_servicio (criterio, valor, precio_adicional, icon_name)
        VALUES ('Limpieza de Oídos', 'Servicio Adicional', 12.00, 'Heart');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM modificadores_servicio WHERE criterio = 'Drenaje de Glándulas') THEN
        INSERT INTO modificadores_servicio (criterio, valor, precio_adicional, icon_name)
        VALUES ('Drenaje de Glándulas', 'Servicio Adicional', 20.00, 'Bug');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM modificadores_servicio WHERE criterio = 'Shampoo Hipoalergénico') THEN
        INSERT INTO modificadores_servicio (criterio, valor, precio_adicional, icon_name)
        VALUES ('Shampoo Hipoalergénico', 'Servicio Adicional', 25.00, 'Zap');
    END IF;

END $$;
