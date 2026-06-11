import { useState, useCallback } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { 
  getPendingWebOrders, 
  validateWebOrder as validateWebOrderService, 
  getFinanceDashboardData, 
  registerExpense as registerExpenseService,
  getPendingPosBookings,
  getPosProducts,
  processPosPayment,
  getAllOrders,
  deliverOrder
} from '../services/financeService';

export const useFinanceStore = () => {
  const { currentUser } = useAuth();
  
  // Estados para Cashier (Pedidos Web)
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Estados para Cashier (POS Físico)
  const [pendingPosBookings, setPendingPosBookings] = useState([]);
  const [posProducts, setPosProducts] = useState([]);
  const [isLoadingPos, setIsLoadingPos] = useState(false);
  
  // Estados para Dashboard (Finanzas)
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Estados para Entregas / Historial de Pedidos
  const [allOrders, setAllOrders] = useState([]);
  const [isLoadingAllOrders, setIsLoadingAllOrders] = useState(false);

  const [error, setError] = useState(null);

  /**
   * Carga los pedidos web pendientes de validación
   */
  const loadPendingOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setError(null);
    try {
      const orders = await getPendingWebOrders();
      setPendingOrders(orders);
    } catch (err) {
      console.error(err);
      setError('Error al cargar pedidos web pendientes.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  /**
   * Carga datos del POS físico (Reservas por cobrar y productos)
   */
  const loadPosData = useCallback(async () => {
    setIsLoadingPos(true);
    setError(null);
    try {
      const [bookings, products] = await Promise.all([
        getPendingPosBookings(),
        getPosProducts()
      ]);
      setPendingPosBookings(bookings);
      setPosProducts(products);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos del POS.');
    } finally {
      setIsLoadingPos(false);
    }
  }, []);

  /**
   * Procesa un cobro físico en la caja
   */
  const handlePosPayment = async (invoiceData, onToast) => {
    try {
      await processPosPayment(invoiceData, currentUser?.id);
      
      // Removemos la reserva cobrada localmente
      setPendingPosBookings(prev => prev.filter(b => b.id !== invoiceData.reserva_id));
      
      if (onToast) onToast('✅ Cobro procesado y facturado exitosamente.');
      return true;
    } catch (err) {
      console.error(err);
      if (onToast) onToast('❌ Error al procesar el cobro.', true);
      return false;
    }
  };

  /**
   * Valida un comprobante (Aprobar o Rechazar)
   */
  const validateOrder = async (comprobanteId, pedidoId, action, onToast) => {
    try {
      const nuevoEstado = action === 'approve' ? 'aprobado' : 'rechazado';
      await validateWebOrderService(comprobanteId, pedidoId, nuevoEstado, currentUser?.id);
      
      // Actualizamos el estado local removiendo el pedido validado
      setPendingOrders(prev => prev.filter(order => order.id !== comprobanteId));
      
      if (onToast) {
        onToast(`✅ Pedido ${nuevoEstado} exitosamente.`);
      }
    } catch (err) {
      console.error(err);
      if (onToast) {
        onToast(`❌ Error al procesar la validación.`, true);
      }
    }
  };

  /**
   * Carga la data del Dashboard Financiero
   */
  const loadDashboardData = useCallback(async () => {
    setIsLoadingDashboard(true);
    setError(null);
    try {
      const data = await getFinanceDashboardData();
      setIncomes(data.incomes);
      setExpenses(data.expenses);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos financieros.');
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  /**
   * Registra un nuevo egreso operativo
   */
  const registerExpense = async (expenseData, file, onToast) => {
    try {
      await registerExpenseService(expenseData, file, currentUser?.id);
      
      // Recargamos el dashboard para reflejar el nuevo gasto
      await loadDashboardData();
      
      if (onToast) {
        onToast('💸 Egreso registrado correctamente.');
      }
      return true;
    } catch (err) {
      console.error(err);
      if (onToast) {
        onToast('❌ Error al registrar egreso.', true);
      }
      return false;
    }
  };

  /**
   * Carga todos los pedidos (para entregas e historial)
   */
  const loadAllOrders = useCallback(async () => {
    setIsLoadingAllOrders(true);
    setError(null);
    try {
      const orders = await getAllOrders();
      setAllOrders(orders);
    } catch (err) {
      console.error(err);
      setError('Error al cargar todos los pedidos.');
    } finally {
      setIsLoadingAllOrders(false);
    }
  }, []);

  /**
   * Marca un pedido como entregado y actualiza localmente
   */
  const handleDeliverOrder = async (pedidoId, onToast) => {
    try {
      await deliverOrder(pedidoId);
      // Actualizamos el estado local
      setAllOrders(prev => prev.map(o => o.id === pedidoId ? { ...o, estado_pedido: 'entregado' } : o));
      if (onToast) onToast('📦 Pedido marcado como entregado.');
      return true;
    } catch (err) {
      console.error(err);
      if (onToast) onToast('❌ Error al entregar el pedido.', true);
      return false;
    }
  };

  return {
    pendingOrders,
    isLoadingOrders,
    loadPendingOrders,
    validateOrder,
    
    pendingPosBookings,
    posProducts,
    isLoadingPos,
    loadPosData,
    handlePosPayment,

    incomes,
    expenses,
    isLoadingDashboard,
    loadDashboardData,
    registerExpense,

    allOrders,
    isLoadingAllOrders,
    loadAllOrders,
    handleDeliverOrder,
    
    error
  };
};
