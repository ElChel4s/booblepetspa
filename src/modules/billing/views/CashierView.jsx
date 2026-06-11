import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import CashierPosTab from '../components/CashierPosTab';
import CashierWebOrdersTab from '../components/CashierWebOrdersTab';
import CashierDeliveriesTab from '../components/CashierDeliveriesTab';
import CashierTillTab from '../components/CashierTillTab';
import PrintReceiptModal from '../components/PrintReceiptModal';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useToast } from '../../../store/ToastContext';

const CashierView = () => {
  const [activeTab, setActiveTab] = useState('arqueo');
  
  // Modales de Recibo (POS)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // Hook Global de Finanzas
  const { 
    pendingOrders, 
    isLoadingOrders, 
    loadPendingOrders, 
    validateOrder,
    
    pendingPosBookings,
    posProducts,
    isLoadingPos,
    loadPosData,
    handlePosPayment,

    allOrders,
    isLoadingAllOrders,
    loadAllOrders,
    handleDeliverOrder
  } = useFinanceStore();
  
  const { addToast } = useToast();

  useEffect(() => {
    // Cargar pedidos web pendientes, citas del POS y entregas al montar
    loadPendingOrders();
    loadPosData();
    loadAllOrders();
  }, [loadPendingOrders, loadPosData, loadAllOrders]);

  const handleShowReceipt = (invoice) => {
    setGeneratedInvoice(invoice);
    setIsReceiptModalOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setGeneratedInvoice(null);
  };

  const handleValidateOrder = (comprobanteId, pedidoId, action) => {
    validateOrder(comprobanteId, pedidoId, action, addToast);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 animate-in fade-in duration-500">
      
      {/* Cabecera de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-black flex items-center gap-3">
            💸 Caja Registradora
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Recepción · Cobro de servicios finalizados y venta de productos al paso
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-emerald-300 border-[3.5px] border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_0px_black] text-xs font-black uppercase">
            <span>Pendientes (POS): </span>
            <span className="text-black bg-white/60 px-2 py-0.5 rounded-full ml-1">{pendingPosBookings.length} citas</span>
          </div>
          <button 
            onClick={loadPosData}
            className="bg-sky-300 hover:bg-sky-200 border-[3.5px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_black] active:scale-95 transition-all cursor-pointer"
            title="Recargar Citas"
            disabled={isLoadingPos}
          >
            <RefreshCw size={18} strokeWidth={3} className={isLoadingPos ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b-4 border-black pb-4 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('arqueo')}
          className={`px-6 py-3 border-[3.5px] border-black rounded-2xl font-black uppercase text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'arqueo' ? 'bg-indigo-400 text-white shadow-[4px_4px_0px_0px_black]' : 'bg-white hover:bg-slate-100'
          }`}
        >
          Arqueo de Caja
        </button>
        <button 
          onClick={() => setActiveTab('citas')}
          className={`px-6 py-3 border-[3.5px] border-black rounded-2xl font-black uppercase text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'citas' ? 'bg-[var(--primary)] text-white shadow-[4px_4px_0px_0px_black]' : 'bg-white hover:bg-slate-100'
          }`}
        >
          Cobrar Citas Presenciales
        </button>
        <button 
          onClick={() => setActiveTab('pedidos')}
          className={`px-6 py-3 border-[3.5px] border-black rounded-2xl font-black uppercase text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pedidos' ? 'bg-amber-400 text-black shadow-[4px_4px_0px_0px_black]' : 'bg-white hover:bg-slate-100'
          }`}
        >
          Validar Pedidos Web
          {pendingOrders.length > 0 && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] border-2 border-black animate-pulse">
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('entregas')}
          className={`px-6 py-3 border-[3.5px] border-black rounded-2xl font-black uppercase text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'entregas' ? 'bg-emerald-400 text-black shadow-[4px_4px_0px_0px_black]' : 'bg-white hover:bg-slate-100'
          }`}
        >
          📦 Entregar Pedidos
          {allOrders.filter(o => o.estado_pago === 'completado' && o.estado_pedido !== 'entregado').length > 0 && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] border-2 border-black animate-pulse">
              {allOrders.filter(o => o.estado_pago === 'completado' && o.estado_pedido !== 'entregado').length}
            </span>
          )}
        </button>
      </div>

      {/* RENDERIZADO DEL TAB ACTIVO */}
      {activeTab === 'arqueo' ? (
        <CashierTillTab />
      ) : activeTab === 'citas' ? (
        <CashierPosTab 
          pendingBookings={pendingPosBookings}
          productsCatalog={posProducts}
          isLoading={isLoadingPos}
          onShowReceipt={handleShowReceipt}
          onProcessPayment={handlePosPayment}
        />
      ) : activeTab === 'pedidos' ? (
        <CashierWebOrdersTab 
          webOrders={pendingOrders}
          isLoading={isLoadingOrders}
          onValidateOrder={handleValidateOrder}
          onRefresh={loadPendingOrders}
        />
      ) : (
        <CashierDeliveriesTab 
          orders={allOrders}
          isLoading={isLoadingAllOrders}
          onDeliverOrder={(id) => handleDeliverOrder(id, addToast)}
          onRefresh={loadAllOrders}
        />
      )}

      {/* Modal Factura / Recibo para el POS */}
      {generatedInvoice && (
        <PrintReceiptModal 
          isOpen={isReceiptModalOpen}
          onClose={handleCloseReceipt}
          invoiceData={generatedInvoice}
        />
      )}

    </div>
  );
};

export default CashierView;
