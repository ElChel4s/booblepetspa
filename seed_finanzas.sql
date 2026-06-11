-- ==============================================================================
-- Script de Seed Data: SIMULACIÓN FINANCIERA COMPLETA
-- ==============================================================================
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de haber ejecutado demo_data.sql
--
-- Genera datos históricos de los últimos 30 días:
--   • 20+ Citas completadas con fichas de grooming
--   • Facturas y pagos asociados (ingresos en caja)
--   • 15+ Egresos de caja con categorías variadas
--   • Comprobantes de pago web aprobados (ingresos digitales)
-- ==============================================================================

DO $$
DECLARE
    -- IDs de usuarios existentes
    v_cliente uuid;
    v_cliente2 uuid;
    v_groomer1 uuid;
    v_groomer2 uuid;
    v_admin uuid;
    v_recepcion uuid;

    -- IDs de servicios existentes
    v_srv_bano uuid;
    v_srv_corte uuid;
    v_srv_unas uuid;
    v_srv_dental uuid;
    v_srv_oidos uuid;

    -- Mascotas
    v_mascota1 uuid;
    v_mascota2 uuid;

    -- Variables temporales para el bucle
    v_reserva_id uuid;
    v_cita_id uuid;
    v_factura_id uuid;
    v_ficha_id uuid;
    v_day integer;
    v_hora_base integer;
    v_servicio_actual uuid;
    v_precio_actual numeric;
    v_groomer_actual uuid;
    v_mascota_actual uuid;
    v_metodo text;
    v_fecha_cita timestamptz;
    v_fecha_fin timestamptz;
    v_duracion integer;

BEGIN
    -- =========================================================================
    -- 0. DESHABILITAR TRIGGERS DE USUARIO (no los de sistema/FK)
    --    fn_notificar_cambio_cita falla en bulk-insert porque mascota_id aún no tiene
    --    un join resuelto → mensaje queda NULL → viola NOT NULL constraint.
    --    DISABLE TRIGGER USER solo afecta triggers definidos por el usuario,
    --    no los RI_ConstraintTrigger del sistema (no requiere superusuario).
    -- =========================================================================
    ALTER TABLE citas DISABLE TRIGGER USER;
    ALTER TABLE fichas_grooming DISABLE TRIGGER USER;

    -- =========================================================================
    -- 1. OBTENER IDS DE USUARIOS Y SERVICIOS EXISTENTES
    -- =========================================================================

    SELECT id INTO v_cliente FROM perfiles WHERE rol = 'cliente' LIMIT 1;
    SELECT id INTO v_admin FROM perfiles WHERE rol = 'admin' LIMIT 1;
    SELECT id INTO v_recepcion FROM perfiles WHERE rol = 'recepcion' LIMIT 1;
    SELECT id INTO v_groomer1 FROM perfiles WHERE rol = 'groomer' LIMIT 1;
    SELECT id INTO v_groomer2 FROM perfiles WHERE rol = 'groomer' AND id != v_groomer1 LIMIT 1;
    IF v_groomer2 IS NULL THEN v_groomer2 := v_groomer1; END IF;

    -- Segundo cliente (si existe)
    SELECT id INTO v_cliente2 FROM perfiles WHERE rol = 'cliente' AND id != v_cliente LIMIT 1;
    IF v_cliente2 IS NULL THEN v_cliente2 := v_cliente; END IF;

    -- Mascotas del cliente principal
    SELECT id INTO v_mascota1 FROM mascotas WHERE dueno_id = v_cliente ORDER BY nombre ASC LIMIT 1;
    SELECT id INTO v_mascota2 FROM mascotas WHERE dueno_id = v_cliente AND id != v_mascota1 LIMIT 1;
    IF v_mascota2 IS NULL THEN v_mascota2 := v_mascota1; END IF;

    -- Servicios
    SELECT id INTO v_srv_bano FROM servicios WHERE nombre ILIKE '%Baño%' LIMIT 1;
    SELECT id INTO v_srv_corte FROM servicios WHERE nombre ILIKE '%Corte%' LIMIT 1;
    SELECT id INTO v_srv_unas FROM servicios WHERE nombre = 'Corte de Uñas' LIMIT 1;
    SELECT id INTO v_srv_dental FROM servicios WHERE nombre = 'Limpieza Dental' LIMIT 1;
    SELECT id INTO v_srv_oidos FROM servicios WHERE nombre = 'Limpieza de Oídos' LIMIT 1;

    -- Defaults si no encontramos servicios
    IF v_srv_bano IS NULL THEN v_srv_bano := v_srv_corte; END IF;
    IF v_srv_unas IS NULL THEN v_srv_unas := v_srv_bano; END IF;
    IF v_srv_dental IS NULL THEN v_srv_dental := v_srv_bano; END IF;
    IF v_srv_oidos IS NULL THEN v_srv_oidos := v_srv_bano; END IF;

    -- =========================================================================
    -- 2. GENERAR 24 CITAS COMPLETADAS (últimos 30 días) CON FACTURAS Y PAGOS
    -- =========================================================================

    FOR v_day IN 1..24 LOOP
        v_reserva_id := gen_random_uuid();
        v_cita_id := gen_random_uuid();
        v_factura_id := gen_random_uuid();
        v_ficha_id := gen_random_uuid();

        -- Variar servicio, precio, groomer y mascota según el día
        CASE (v_day % 5)
            WHEN 0 THEN v_servicio_actual := v_srv_bano;   v_precio_actual := 50.00;  v_duracion := 60;
            WHEN 1 THEN v_servicio_actual := v_srv_corte;  v_precio_actual := 80.00;  v_duracion := 90;
            WHEN 2 THEN v_servicio_actual := v_srv_unas;   v_precio_actual := 15.00;  v_duracion := 15;
            WHEN 3 THEN v_servicio_actual := v_srv_dental;  v_precio_actual := 35.00;  v_duracion := 20;
            WHEN 4 THEN v_servicio_actual := v_srv_oidos;  v_precio_actual := 12.00;  v_duracion := 10;
        END CASE;

        -- Alternar groomers
        IF v_day % 2 = 0 THEN
            v_groomer_actual := v_groomer1;
        ELSE
            v_groomer_actual := v_groomer2;
        END IF;

        -- Alternar mascotas
        IF v_day % 3 = 0 THEN
            v_mascota_actual := v_mascota2;
        ELSE
            v_mascota_actual := v_mascota1;
        END IF;

        -- Método de pago variado
        CASE (v_day % 4)
            WHEN 0 THEN v_metodo := 'efectivo';
            WHEN 1 THEN v_metodo := 'qr';
            WHEN 2 THEN v_metodo := 'tarjeta';
            WHEN 3 THEN v_metodo := 'transferencia';
        END CASE;

        -- Hora variada (entre 9:00 y 17:00)
        v_hora_base := 9 + (v_day % 8);

        -- Fecha de la cita (distribuida en los últimos 30 días)
        v_fecha_cita := (current_date - (v_day + 1) * interval '1 day') + (v_hora_base * interval '1 hour');
        v_fecha_fin := v_fecha_cita + (v_duracion * interval '1 minute');

        -- Insertar reserva completada
        INSERT INTO reservas (id, cliente_id, estado_general, total_reserva, fecha_creacion)
        VALUES (v_reserva_id, v_cliente, 'completada', v_precio_actual, v_fecha_cita - interval '2 days')
        ON CONFLICT DO NOTHING;

        -- Insertar cita completada
        INSERT INTO citas (id, reserva_id, mascota_id, groomer_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado)
        VALUES (v_cita_id, v_reserva_id, v_mascota_actual, v_groomer_actual, v_servicio_actual,
                v_fecha_cita, v_fecha_fin, 'completada')
        ON CONFLICT DO NOTHING;

        -- Insertar ficha de grooming
        INSERT INTO fichas_grooming (id, cita_id, nivel_suciedad, estado_ingreso_nudos, estado_ingreso_pulgas,
                                     observaciones_groomer, recomendaciones_post, finalizado_at)
        VALUES (v_ficha_id, v_cita_id,
                CASE (v_day % 3) WHEN 0 THEN 'baja' WHEN 1 THEN 'media' ELSE 'alta' END,
                (v_day % 4 = 0),
                (v_day % 7 = 0),
                CASE (v_day % 4)
                    WHEN 0 THEN 'Mascota se portó excelente. Servicio sin complicaciones.'
                    WHEN 1 THEN 'Un poco inquieta al principio, se calmó durante el secado.'
                    WHEN 2 THEN 'Piel sensible detectada, se usó shampoo hipoalergénico.'
                    ELSE 'Sesión normal. Recomendable mantener la frecuencia mensual.'
                END,
                CASE (v_day % 3)
                    WHEN 0 THEN 'Próxima visita en 4 semanas.'
                    WHEN 1 THEN 'Aplicar crema hidratante en almohadillas semanalmente.'
                    ELSE 'Mantener cepillado diario para evitar nudos.'
                END,
                v_fecha_fin + interval '5 minutes')
        ON CONFLICT (cita_id) DO NOTHING;

        -- Insertar factura
        INSERT INTO facturas (id, cliente_id, reserva_id, nit_ci, razon_social, monto_total, estado_factura)
        VALUES (v_factura_id,
                CASE WHEN v_day % 3 = 0 THEN v_cliente2 ELSE v_cliente END,
                v_reserva_id,
                CASE (v_day % 3)
                    WHEN 0 THEN '9876543'
                    WHEN 1 THEN '12345678'
                    ELSE '0'
                END,
                CASE (v_day % 3)
                    WHEN 0 THEN 'María González'
                    WHEN 1 THEN 'Marcelo Alejandro'
                    ELSE 'S/N'
                END,
                v_precio_actual, 'emitida')
        ON CONFLICT DO NOTHING;

        -- Insertar pago
        INSERT INTO pagos (factura_id, metodo_pago, monto_pagado, referencia_transaccion)
        VALUES (v_factura_id, v_metodo, v_precio_actual,
                CASE v_metodo
                    WHEN 'efectivo' THEN 'CASH-' || lpad(v_day::text, 4, '0')
                    WHEN 'qr' THEN 'QR-' || lpad((v_day * 1111)::text, 8, '0')
                    WHEN 'tarjeta' THEN 'CARD-****' || lpad((v_day * 37)::text, 4, '0')
                    ELSE 'TRF-' || lpad((v_day * 777)::text, 8, '0')
                END)
        ON CONFLICT DO NOTHING;

    END LOOP;

    -- =========================================================================
    -- 3. GENERAR EGRESOS DE CAJA (gastos operativos variados)
    -- =========================================================================

    -- Gastos de los últimos 30 días con categorías realistas
    INSERT INTO egresos_caja (monto, categoria, descripcion, registrado_por, fecha) VALUES
    -- Semana 1 (recientes)
    (120.00, 'Insumos',    'Compra de shampoo premium 5L x3',               v_admin, now() - interval '1 day'),
    (45.00,  'Insumos',    'Perfumes y acondicionador para mascotas',        v_admin, now() - interval '2 days'),
    (80.00,  'Servicios',  'Servicio de limpieza profunda del local',        v_admin, now() - interval '3 days'),
    (35.00,  'Alimentos',  'Snacks premium para pacientes durante el corte', v_recepcion, now() - interval '3 days'),
    (250.00, 'Alquiler',   'Cuota mensual alquiler local — Junio 2026',      v_admin, now() - interval '5 days'),

    -- Semana 2
    (60.00,  'Insumos',    'Guantes, mascarillas y desinfectante',           v_admin, now() - interval '7 days'),
    (95.00,  'Equipos',    'Afilado de cuchillas y tijeras profesionales',   v_admin, now() - interval '8 days'),
    (40.00,  'Servicios',  'Lavandería de toallas y batas del mes',          v_recepcion, now() - interval '9 days'),
    (28.00,  'Publicidad', 'Impresión de flyers y tarjetas de presentación', v_admin, now() - interval '10 days'),

    -- Semana 3
    (180.00, 'Salarios',   'Bono de productividad — Groomer Carlos',         v_admin, now() - interval '14 days'),
    (180.00, 'Salarios',   'Bono de productividad — Groomer Marcelo',        v_admin, now() - interval '14 days'),
    (50.00,  'Servicios',  'Internet fibra óptica — cuota mensual',          v_admin, now() - interval '15 days'),
    (75.00,  'Insumos',    'Reposición de toallas de microfibra x10',        v_recepcion, now() - interval '16 days'),

    -- Semana 4
    (320.00, 'Equipos',    'Secadora industrial nueva — cuota 2/6',          v_admin, now() - interval '20 days'),
    (55.00,  'Publicidad', 'Campaña Google Ads — semana Mayo',               v_admin, now() - interval '22 days'),
    (42.00,  'Alimentos',  'Premios y galletas gourmet para peluditos',      v_recepcion, now() - interval '25 days'),
    (150.00, 'Alquiler',   'Cuota de servicios básicos (luz/agua) — Mayo',   v_admin, now() - interval '28 days'),
    (85.00,  'Insumos',    'Productos de limpieza y desinfección general',   v_admin, now() - interval '30 days');

    -- =========================================================================
    -- 4. GENERAR COMPROBANTES WEB APROBADOS (ingresos digitales)
    -- =========================================================================
    -- Simular pedidos web ya pagados y aprobados

    DECLARE
        v_pedido_web1 uuid := gen_random_uuid();
        v_pedido_web2 uuid := gen_random_uuid();
        v_pedido_web3 uuid := gen_random_uuid();
        v_pedido_web4 uuid := gen_random_uuid();
        v_pedido_web5 uuid := gen_random_uuid();
        v_producto_tienda uuid;
    BEGIN
        -- Obtener un producto de la tienda (no insumo)
        SELECT id INTO v_producto_tienda FROM productos WHERE es_insumo = false LIMIT 1;
        IF v_producto_tienda IS NULL THEN
            SELECT id INTO v_producto_tienda FROM productos LIMIT 1;
        END IF;

        -- Pedidos web completados
        INSERT INTO pedidos (id, cliente_id, monto_total, estado_pedido, estado_pago, codigo_seguimiento) VALUES
        (v_pedido_web1, v_cliente,  89.00,  'completado', 'completado', 'WEB-' || substr(v_pedido_web1::text, 1, 8)),
        (v_pedido_web2, v_cliente2, 145.00, 'completado', 'completado', 'WEB-' || substr(v_pedido_web2::text, 1, 8)),
        (v_pedido_web3, v_cliente,  62.00,  'completado', 'completado', 'WEB-' || substr(v_pedido_web3::text, 1, 8)),
        (v_pedido_web4, v_cliente2, 210.00, 'completado', 'completado', 'WEB-' || substr(v_pedido_web4::text, 1, 8)),
        (v_pedido_web5, v_cliente,  35.00,  'completado', 'completado', 'WEB-' || substr(v_pedido_web5::text, 1, 8))
        ON CONFLICT DO NOTHING;

        -- Detalles de pedidos (simplificado)
        IF v_producto_tienda IS NOT NULL THEN
            INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario_snap) VALUES
            (v_pedido_web1, v_producto_tienda, 2, 44.50),
            (v_pedido_web2, v_producto_tienda, 3, 48.33),
            (v_pedido_web3, v_producto_tienda, 1, 62.00),
            (v_pedido_web4, v_producto_tienda, 5, 42.00),
            (v_pedido_web5, v_producto_tienda, 1, 35.00)
            ON CONFLICT DO NOTHING;
        END IF;

        -- Comprobantes de pago aprobados
        INSERT INTO comprobantes_pago (pedido_id, cliente_id, monto, url_comprobante, codigo_transaccion, estado, fecha_envio, revisado_por, fecha_revision) VALUES
        (v_pedido_web1, v_cliente,  89.00,  'https://placeholder.co/comprobante1.jpg', 'QR-WEB-001', 'aprobado', now() - interval '4 days',  v_admin, now() - interval '3 days'),
        (v_pedido_web2, v_cliente2, 145.00, 'https://placeholder.co/comprobante2.jpg', 'QR-WEB-002', 'aprobado', now() - interval '8 days',  v_admin, now() - interval '7 days'),
        (v_pedido_web3, v_cliente,  62.00,  'https://placeholder.co/comprobante3.jpg', 'QR-WEB-003', 'aprobado', now() - interval '12 days', v_admin, now() - interval '11 days'),
        (v_pedido_web4, v_cliente2, 210.00, 'https://placeholder.co/comprobante4.jpg', 'QR-WEB-004', 'aprobado', now() - interval '18 days', v_admin, now() - interval '17 days'),
        (v_pedido_web5, v_cliente,  35.00,  'https://placeholder.co/comprobante5.jpg', 'QR-WEB-005', 'aprobado', now() - interval '25 days', v_admin, now() - interval '24 days')
        ON CONFLICT DO NOTHING;
    END;

    -- =========================================================================
    -- 5. MOVIMIENTOS DE INVENTARIO (historial de stock)
    -- =========================================================================

    INSERT INTO movimientos_inventario (producto_id, usuario_id, tipo, categoria_motivo, cantidad, detalle, fecha)
    SELECT 
        p.id,
        v_admin,
        CASE WHEN s.n % 3 = 0 THEN 'salida' ELSE 'ingreso' END,
        CASE WHEN s.n % 3 = 0 THEN 'uso_servicio' ELSE 'compra_proveedor' END,
        CASE WHEN s.n % 3 = 0 THEN 1 ELSE (2 + s.n % 5) END,
        CASE WHEN s.n % 3 = 0 
            THEN 'Usado en servicio de grooming' 
            ELSE 'Reposición de stock mensual' 
        END,
        now() - (s.n * interval '2 days')
    FROM productos p
    CROSS JOIN generate_series(1, 6) AS s(n)
    WHERE p.es_insumo = true
    LIMIT 18;

    -- =========================================================================
    -- 6. ENCUESTAS DE SATISFACCIÓN para algunas citas pasadas
    -- =========================================================================

    INSERT INTO encuestas_satisfaccion (cita_id, puntuacion_nps, comentario)
    SELECT 
        c.id,
        CASE (row_number() OVER (ORDER BY c.fecha_hora_inicio))::integer % 5
            WHEN 0 THEN 10
            WHEN 1 THEN 9
            WHEN 2 THEN 8
            WHEN 3 THEN 7
            ELSE 10
        END,
        CASE (row_number() OVER (ORDER BY c.fecha_hora_inicio))::integer % 5
            WHEN 0 THEN '¡Excelente servicio! Max salió hermoso. 🐾'
            WHEN 1 THEN 'Muy buen trabajo, la atención fue rápida.'
            WHEN 2 THEN 'Bien en general, aunque tardó un poco más de lo esperado.'
            WHEN 3 THEN 'El groomer fue muy profesional y cuidadoso.'
            ELSE '¡Lo mejor para nuestros peluditos! Recomendado al 100%.'
        END
    FROM citas c
    WHERE c.estado = 'completada'
      AND c.fecha_hora_inicio < now()
      AND NOT EXISTS (SELECT 1 FROM encuestas_satisfaccion e WHERE e.cita_id = c.id)
    ORDER BY c.fecha_hora_inicio DESC
    LIMIT 12;

    -- =========================================================================
    -- 7. LOGS DE AUDITORÍA (actividad del sistema)
    -- =========================================================================

    INSERT INTO logs_auditoria (perfil_id, rol, accion, fecha) VALUES
    (v_admin,     'admin',     'Registró egreso: Compra de shampoo premium',     now() - interval '1 day'),
    (v_recepcion, 'recepcion', 'Procesó checkout POS para reserva completada',   now() - interval '2 days'),
    (v_admin,     'admin',     'Aprobó comprobante de pago web QR-WEB-001',      now() - interval '3 days'),
    (v_groomer1,  'groomer',   'Finalizó ficha de grooming — Max',               now() - interval '3 days'),
    (v_cliente,   'cliente',   'Aprobó servicio adicional: Limpieza Dental',      now() - interval '5 days'),
    (v_admin,     'admin',     'Generó reporte financiero mensual',              now() - interval '7 days'),
    (v_recepcion, 'recepcion', 'Realizó arqueo de caja — Cierre vespertino',     now() - interval '8 days'),
    (v_admin,     'admin',     'Actualizó precios de servicios de baño',         now() - interval '10 days'),
    (v_groomer2,  'groomer',   'Sugirió servicio adicional: Corte de Uñas',      now() - interval '12 days'),
    (v_admin,     'admin',     'Aprobó comprobante de pago web QR-WEB-002',      now() - interval '14 days');

    -- =========================================================================
    -- 8. RE-HABILITAR TRIGGERS DE USUARIO
    -- =========================================================================
    ALTER TABLE citas ENABLE TRIGGER USER;
    ALTER TABLE fichas_grooming ENABLE TRIGGER USER;

    RAISE NOTICE '✅ Seed financiero completado exitosamente.';
    RAISE NOTICE '   → 24 citas completadas con fichas de grooming';
    RAISE NOTICE '   → 24 facturas + pagos (ingresos POS)';
    RAISE NOTICE '   → 18 egresos de caja con categorías variadas';
    RAISE NOTICE '   → 5 pedidos web aprobados (ingresos digitales)';
    RAISE NOTICE '   → 18 movimientos de inventario';
    RAISE NOTICE '   → 12 encuestas de satisfacción';
    RAISE NOTICE '   → 10 logs de auditoría';

END $$;
