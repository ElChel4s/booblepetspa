import { useState, useEffect, useCallback } from 'react';
import * as adminInventoryService from '../services/adminInventoryService';

export const useAdminInventory = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catsData, perfData, prodData, movsData] = await Promise.all([
        adminInventoryService.getCategorias(),
        adminInventoryService.getPerfilesAdmin(),
        adminInventoryService.getProductos(),
        adminInventoryService.getMovimientos()
      ]);
      setCategorias(catsData);
      setPerfiles(perfData);
      setProductos(prodData);
      setMovimientos(movsData);
    } catch (err) {
      console.error("Error cargando inventario:", err);
      setError(err.message || 'Error al cargar los datos del inventario.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveProduct = async (abmForm, onToast) => {
    try {
      const savedProd = await adminInventoryService.upsertProducto(abmForm);
      
      if (abmForm.id) {
        setProductos(prev => prev.map(p => p.id === savedProd.id ? savedProd : p));
        onToast(`✏️ Producto actualizado.`);
      } else {
        setProductos(prev => [savedProd, ...prev]);
        // Si se crea con stock inicial > 0, registramos ingreso genérico inicial
        if (savedProd.stock_actual > 0) {
          const result = await adminInventoryService.registrarMovimiento({
            producto_id: savedProd.id,
            usuario_id: perfiles.find(p=>p.rol==='recepcion')?.id || perfiles[0]?.id || null, // Default
            tipo: 'ingreso',
            categoria_motivo: 'compra_proveedor',
            cantidad: savedProd.stock_actual,
            detalle: 'Stock Inicial (Apertura de Sistema)'
          }, savedProd);
          if (result.mov) {
            setMovimientos(prev => [result.mov, ...prev]);
          }
        }
        onToast(`🎉 ¡Producto registrado!`);
      }
      return true;
    } catch (err) {
      onToast(`❌ Error: ${err.message}`);
      return false;
    }
  };

  const registerMovement = async (moveForm, onToast) => {
    try {
      const result = await adminInventoryService.registrarMovimiento(moveForm, moveForm.producto);
      
      if (result.mov) {
        setMovimientos(prev => [result.mov, ...prev]);
        setProductos(prev => prev.map(p => p.id === moveForm.producto.id ? { ...p, stock_actual: result.nuevoStock } : p));
        onToast(`✅ Movimiento registrado exitosamente.`);
        return true;
      }
    } catch (err) {
      onToast(`❌ Error: ${err.message}`);
      return false;
    }
  };

  return {
    productos,
    categorias,
    perfiles,
    movimientos,
    isLoading,
    error,
    saveProduct,
    registerMovement,
    reload: loadData
  };
};
