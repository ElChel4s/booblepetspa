import { useState, useEffect, useCallback } from 'react';
import { getPosProducts, getPosCategories, procesarVentaMostrador } from '../services/receptionPosService';
import { registrarMovimiento } from '../services/adminInventoryService';

export const useReceptionPos = (recepcionistaId) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [carritoVenta, setCarritoVenta] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodData, catData] = await Promise.all([
        getPosProducts(),
        getPosCategories()
      ]);
      setProductos(prodData);
      setCategorias(catData);
    } catch (err) {
      console.error("Error cargando TPV:", err);
      setError(err.message || 'Error al cargar los datos del TPV.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addToCarrito = (prod, onToast) => {
    if (prod.stock_actual === 0) return;
    
    setCarritoVenta(prev => {
      const exists = prev.find(item => item.id === prod.id);
      if (exists) {
        if (exists.qty + 1 > prod.stock_actual) {
          onToast(`❌ Error: Solo hay ${prod.stock_actual} en stock.`, true);
          return prev;
        }
        return prev.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const updateCarritoQty = (prodId, change, onToast) => {
    setCarritoVenta(prev => {
      return prev.map(item => {
        if (item.id === prodId) {
          const newQty = item.qty + change;
          const originalProd = productos.find(p => p.id === prodId);
          if (newQty > originalProd.stock_actual) {
            onToast(`❌ Error: Stock límite alcanzado.`, true);
            return item;
          }
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const calcularTotal = () => carritoVenta.reduce((acc, item) => acc + (item.precio_base * item.qty), 0);

  const handleCheckout = async (clienteId, onToast) => {
    if (carritoVenta.length === 0) return false;

    const totalVenta = calcularTotal();
    
    try {
      await procesarVentaMostrador({
        items: carritoVenta,
        metodoPago,
        clienteId,
        total: totalVenta,
        recepcionistaId
      });

      // Actualizar estado local
      let nuevosProductos = [...productos];
      carritoVenta.forEach(item => {
        const idx = nuevosProductos.findIndex(p => p.id === item.id);
        if (idx !== -1) {
          nuevosProductos[idx].stock_actual -= item.qty;
          if (nuevosProductos[idx].stock_actual <= nuevosProductos[idx].stock_minimo_alerta && nuevosProductos[idx].stock_actual > 0) {
            onToast(`⚠️ Alerta: ${nuevosProductos[idx].nombre} entró en stock crítico.`, true);
          }
        }
      });

      setProductos(nuevosProductos);
      setCarritoVenta([]);
      onToast(`💰 Factura emitida. Cobro en ${metodoPago.toUpperCase()} procesado.`);
      return true;
    } catch (err) {
      onToast(`❌ Error procesando venta: ${err.message}`, true);
      return false;
    }
  };

  const handleManualAjuste = async (ajusteForm, onToast) => {
    try {
      // Reutilizamos el registro de movimiento del adminInventoryService 
      // pero actualizando el estado local del TPV.
      const payload = {
        producto_id: ajusteForm.producto.id,
        usuario_id: recepcionistaId,
        tipo: ajusteForm.tipo,
        categoria_motivo: ajusteForm.motivo,
        cantidad: ajusteForm.cantidad,
        detalle: ajusteForm.notas
      };

      const result = await registrarMovimiento(payload, ajusteForm.producto);
      
      if (result.mov) {
        setProductos(prev => prev.map(p => p.id === ajusteForm.producto.id ? { ...p, stock_actual: result.nuevoStock } : p));
        onToast(ajusteForm.tipo === 'ingreso' ? `📦 Ingreso: +${ajusteForm.cantidad} unidades.` : `📉 Salida: -${ajusteForm.cantidad} unidades.`);
        return true;
      }
    } catch (err) {
      onToast(`❌ Error: ${err.message}`, true);
      return false;
    }
  };

  return {
    productos,
    categorias,
    isLoading,
    error,
    carritoVenta,
    metodoPago,
    setMetodoPago,
    addToCarrito,
    updateCarritoQty,
    calcularTotal,
    handleCheckout,
    handleManualAjuste
  };
};
