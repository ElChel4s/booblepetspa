import { useState, useEffect, useCallback } from 'react';
import { getStoreCatalog, getUserPets, procesarOrdenWeb } from '../services/clientStoreService';

export const useClientStore = (userId = null) => {
  const [catalog, setCatalog] = useState([]);
  const [modificadores, setModificadores] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { productos, servicios, modificadores: mods } = await getStoreCatalog();
      setCatalog([...productos, ...servicios]);
      setModificadores(mods);

      if (userId) {
        const pets = await getUserPets(userId);
        setUserPets(pets);
      }
    } catch (err) {
      console.error(err);
      setError('No pudimos cargar la tienda.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const calcularPrecio = (item) => {
    if (item.tipo === 'producto') return item.precio_base;
    if (!selectedPet || modificadores.length === 0) return item.precio_base;
    
    let extra = 0;
    const modTamano = modificadores.find(m => m.criterio === 'tamano' && m.valor === selectedPet.tamano);
    if (modTamano) extra += modTamano.precio_adicional;

    const modTemp = modificadores.find(m => m.criterio === 'temperamento' && m.valor === selectedPet.temperamento);
    if (modTemp) extra += modTemp.precio_adicional;

    return item.precio_base + extra;
  };

  const addToCart = (item, onToast) => {
    if (item.tipo === 'producto' && item.stock === 0) {
      if (onToast) onToast('❌ Sin stock disponible.', true);
      return;
    }

    const precioCalculado = calcularPrecio(item);
    
    setCart(prev => {
      const cartItemId = item.tipo === 'servicio' && selectedPet ? `${item.id}-${selectedPet.id}` : item.id;
      const exists = prev.find(i => i.cartItemId === cartItemId);
      
      if (exists && item.tipo === 'producto') {
        if (exists.qty + 1 > item.stock) {
          if (onToast) onToast(`❌ Solo hay ${item.stock} en stock.`, true);
          return prev;
        }
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i);
      } else if (!exists) {
        return [...prev, { ...item, cartItemId, precio_final: precioCalculado, pet_asignado: selectedPet, qty: 1 }];
      }
      return prev;
    });
  };

  const updateCartQty = (cartItemId, change, onToast) => {
    setCart(prev => prev.map(i => {
      if (i.cartItemId === cartItemId) {
        const newQty = i.qty + change;
        if (i.tipo === 'producto' && newQty > i.stock) {
          if (onToast) onToast(`❌ Límite de stock.`, true);
          return i;
        }
        return newQty > 0 ? { ...i, qty: newQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const handleCheckout = async (guestData, scheduleData, comprobanteFile = null) => {
    try {
      const result = await procesarOrdenWeb(cart, guestData, scheduleData, userId, comprobanteFile);
      if (result.success) {
        return result.orderCode;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const clearCart = () => setCart([]);

  return {
    catalog,
    userPets,
    selectedPet,
    setSelectedPet,
    isLoading,
    error,
    cart,
    favorites,
    toggleFavorite,
    addToCart,
    updateCartQty,
    calcularPrecio,
    handleCheckout,
    clearCart
  };
};
