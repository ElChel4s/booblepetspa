import React, { useState, useMemo, useEffect } from 'react';
import { Plus, RefreshCw, Download } from 'lucide-react';
import RegisterExpenseModal from '../components/RegisterExpenseModal';
import FinanceKpiCards from '../components/FinanceKpiCards';
import FinanceCharts from '../components/FinanceCharts';
import FinanceTransactionsTable from '../components/FinanceTransactionsTable';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useToast } from '../../../store/ToastContext';

const FinanceDashboardView = () => {
  const { 
    incomes, 
    expenses, 
    isLoadingDashboard, 
    loadDashboardData, 
    registerExpense 
  } = useFinanceStore();
  
  const { addToast } = useToast();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('todos'); // todos, ingreso, egreso
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // --- Calculations ---
  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const netProfit = totalIncome - totalExpense;
  const isProfitPositive = netProfit >= 0;

  // Combine and sort transactions for the table
  const allTransactions = useMemo(() => {
    let combined = [...incomes, ...expenses].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (filterType !== 'todos') {
      combined = combined.filter(t => t.tipo === filterType);
    }
    
    if (searchTerm) {
      combined = combined.filter(t => 
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.monto.toString().includes(searchTerm)
      );
    }
    
    return combined;
  }, [incomes, expenses, filterType, searchTerm]);

  // Expense distribution calculation
  const expenseByCategory = useMemo(() => {
    const dist = {};
    expenses.forEach(e => {
      dist[e.categoria] = (dist[e.categoria] || 0) + Number(e.monto);
    });
    return dist;
  }, [expenses]);

  const handleRegisterExpense = async (newExpense, file) => {
    const success = await registerExpense(newExpense, file, addToast);
    if (success) {
      setIsExpenseModalOpen(false);
    }
  };

  const exportToCSV = () => {
    if (allTransactions.length === 0) {
      addToast('No hay datos para exportar', 'warning');
      return;
    }
    
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto (Bs)'];
    const rows = allTransactions.map(t => [
      new Date(t.fecha).toLocaleDateString(),
      t.tipo.toUpperCase(),
      t.categoria || 'N/A',
      `"${t.concepto.replace(/"/g, '""')}"`,
      Number(t.monto).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Finanzas_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('Reporte exportado a CSV', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 animate-in fade-in duration-500">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-black flex items-center gap-3">
            📈 Finanzas
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Dashboard Administrativo · Ingresos, Egresos y Flujo de Caja
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadDashboardData()}
            disabled={isLoadingDashboard}
            className="bg-white border-[3px] border-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_black] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_black] transition-all disabled:opacity-50"
            title="Recargar Datos"
          >
            <RefreshCw size={20} className={isLoadingDashboard ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={exportToCSV}
            className="hidden md:flex bg-emerald-400 hover:bg-emerald-300 text-black border-[4px] border-black px-4 py-3 rounded-2xl shadow-[4px_4px_0px_0px_black] font-black uppercase text-sm items-center gap-2 cursor-pointer transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_black]"
            title="Exportar Reporte a CSV"
          >
            <Download size={20} strokeWidth={3} />
            Exportar
          </button>
          
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-rose-400 hover:bg-rose-300 text-black border-[4px] border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_black] font-black uppercase text-sm flex items-center gap-2 cursor-pointer transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_black]"
          >
            <Plus size={20} strokeWidth={3} />
            Registrar Egreso
          </button>
        </div>
      </div>

      {isLoadingDashboard && incomes.length === 0 && expenses.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin text-slate-400" size={40} />
        </div>
      ) : (
        <>
          {/* KPI Cards (Subcomponente) */}
          <FinanceKpiCards 
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netProfit={netProfit}
            isProfitPositive={isProfitPositive}
            incomesCount={incomes.length}
            expensesCount={expenses.length}
          />

          {/* Gráficos y Desglose (Subcomponente) */}
          <FinanceCharts 
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            expenseByCategory={expenseByCategory}
          />

          {/* Tabla de Auditoría Histórica (Subcomponente) */}
          <FinanceTransactionsTable 
            allTransactions={allTransactions}
            filterType={filterType}
            setFilterType={setFilterType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </>
      )}

      {/* Modal de Registro de Egresos */}
      <RegisterExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onRegister={handleRegisterExpense}
        isSubmitting={isLoadingDashboard} // O un estado separado si se desea
      />
    </div>
  );
};

export default FinanceDashboardView;
