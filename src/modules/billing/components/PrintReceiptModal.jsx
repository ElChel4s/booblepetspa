import React from 'react';
import PropTypes from 'prop-types';
import { X, Printer, Check, Receipt, CreditCard, Landmark, QrCode } from 'lucide-react';

const PrintReceiptModal = ({ isOpen, onClose, invoiceData }) => {
  if (!isOpen || !invoiceData) return null;

  const {
    id = 'FAC-' + Math.floor(100000 + Math.random() * 900000),
    fecha = new Date().toLocaleString(),
    cliente = 'Cliente General',
    nitCi = '7777777',
    razonSocial = 'Sin Nombre',
    mascota = 'N/A',
    servicios = [],
    productos = [],
    subtotal = 0,
    descuento = 0,
    total = 0,
    metodoPago = 'efectivo',
    montoRecibido = 0,
    cambio = 0,
  } = invoiceData;

  const handlePrint = () => {
    // En un entorno real llamaría a la API de impresión, aquí gatillamos la nativa
    window.print();
  };

  const getPayMethodIcon = () => {
    switch (metodoPago) {
      case 'tarjeta':
        return <CreditCard size={16} className="inline mr-1" />;
      case 'qr':
        return <QrCode size={16} className="inline mr-1" />;
      case 'transferencia':
        return <Landmark size={16} className="inline mr-1" />;
      default:
        return <Receipt size={16} className="inline mr-1" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Contenedor del Modal */}
      <div className="bg-white border-[4px] border-black rounded-[2rem] shadow-[8px_8px_0px_0px_black] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera Modal */}
        <div className="bg-[var(--primary)] text-white border-b-[4px] border-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="stroke-white" size={24} strokeWidth={3} />
            <h3 className="text-xl font-black uppercase tracking-tight">Comprobante Generado</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white transition-colors cursor-pointer"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Cuerpo del Modal (Scrollable para tickets largos) */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 flex flex-col items-center">
          
          {/* El Ticket Estilo Térmico */}
          <div className="bg-white border-[3px] border-black p-6 w-full shadow-[4px_4px_0px_0px_black] relative font-mono text-xs text-slate-800 flex flex-col gap-4">
            
            {/* Adorno de corte de papel (serrated edge mockup) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-slate-50 rotate-45 -translate-y-2 shrink-0 border border-black/20" />
              ))}
            </div>
            
            {/* Info de la Empresa */}
            <div className="text-center pt-2">
              <h4 className="text-base font-black uppercase tracking-tight mb-1 text-black">BUBBLE PET SPA</h4>
              <p>NIT: 983274029</p>
              <p>Av. Circunvalación #452</p>
              <p>Tel: 4299831 - 77298312</p>
              <div className="border-b-2 border-dashed border-black/40 my-3" />
            </div>

            {/* Encabezado Factura */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-bold text-black">
                <span>COMPROBANTE:</span>
                <span>{id}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{fecha}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="uppercase text-right max-w-[180px] truncate">{razonSocial}</span>
              </div>
              <div className="flex justify-between">
                <span>NIT/CI:</span>
                <span>{nitCi}</span>
              </div>
              {mascota && mascota !== 'N/A' && (
                <div className="flex justify-between">
                  <span>MASCOTA:</span>
                  <span className="uppercase">{mascota}</span>
                </div>
              )}
              <div className="border-b-2 border-dashed border-black/40 my-3" />
            </div>

            {/* Detalle de Items */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-12 font-bold text-black border-b border-black pb-1 mb-1">
                <span className="col-span-6 text-left">CONCEPTO</span>
                <span className="col-span-2 text-center">CANT</span>
                <span className="col-span-4 text-right">SUBTOT</span>
              </div>

              {/* Servicios */}
              {servicios.map((s, i) => (
                <div key={'s-' + i} className="grid grid-cols-12 text-slate-700">
                  <span className="col-span-6 text-left truncate uppercase" title={s.nombre}>
                    [S] {s.nombre}
                  </span>
                  <span className="col-span-2 text-center">1</span>
                  <span className="col-span-4 text-right">Bs. {Number(s.precio).toFixed(2)}</span>
                </div>
              ))}

              {/* Productos */}
              {productos.map((p, i) => (
                <div key={'p-' + i} className="grid grid-cols-12 text-slate-700">
                  <span className="col-span-6 text-left truncate uppercase" title={p.nombre}>
                    [P] {p.nombre}
                  </span>
                  <span className="col-span-2 text-center">{p.cantidad}</span>
                  <span className="col-span-4 text-right">
                    Bs. {(Number(p.precio_base) * p.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="border-b-2 border-dashed border-black/40 my-3" />
            </div>

            {/* Totales */}
            <div className="flex flex-col gap-1 align-bottom">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>Bs. {Number(subtotal).toFixed(2)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>DESCUENTO:</span>
                  <span>-Bs. {Number(descuento).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-black mt-1">
                <span>TOTAL:</span>
                <span>Bs. {Number(total).toFixed(2)}</span>
              </div>
              <div className="border-b-2 border-dashed border-black/40 my-3" />
            </div>

            {/* Pago y Vueltos */}
            <div className="flex flex-col gap-1 text-slate-600">
              <div className="flex justify-between text-black font-bold">
                <span>METODO PAGO:</span>
                <span className="uppercase flex items-center">
                  {getPayMethodIcon()}
                  {metodoPago}
                </span>
              </div>
              {metodoPago === 'efectivo' && (
                <>
                  <div className="flex justify-between">
                    <span>MONTO RECIBIDO:</span>
                    <span>Bs. {Number(montoRecibido).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-black font-bold">
                    <span>CAMBIO ENTREGADO:</span>
                    <span>Bs. {Number(cambio).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* QR de Validación / Código de barras simulado */}
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-black/20 mt-2">
              {/* Código de barras falso */}
              <div className="w-full h-8 flex justify-center items-center overflow-hidden gap-[2px]">
                {Array.from({ length: 35 }).map((_, i) => {
                  const widths = ['w-[1px]', 'w-[2px]', 'w-[3px]', 'w-[1px]'];
                  const width = widths[Math.floor(Math.random() * widths.length)];
                  const bg = Math.random() > 0.3 ? 'bg-black' : 'bg-transparent';
                  return <div key={i} className={`h-full ${width} ${bg} shrink-0`} />;
                })}
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                Valida en: bubblepetspa.com/valida
              </p>
              
              <div className="mt-2 text-center text-[10px] font-black text-black">
                <p>¡GRACIAS POR TU VISITA! 🐾</p>
                <p className="font-normal text-slate-500 mt-0.5">Controla tu reserva con el ticket</p>
              </div>
            </div>
            
            {/* Adorno de corte inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 flex overflow-hidden translate-y-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-slate-50 rotate-45 translate-y-1 shrink-0 border border-black/20" />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Modal con Botones */}
        <div className="bg-slate-100 border-t-[4px] border-black p-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-black border-[3px] border-black px-4 py-3 rounded-[1rem] shadow-[4px_4px_0px_0px_black] font-black uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_black]"
          >
            <Printer size={16} strokeWidth={3} />
            Imprimir Ticket
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-teal-400 hover:bg-teal-300 text-black border-[3px] border-black px-4 py-3 rounded-[1rem] shadow-[4px_4px_0px_0px_black] font-black uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_black]"
          >
            <Check size={16} strokeWidth={3} />
            Cerrar Caja
          </button>
        </div>

      </div>
    </div>
  );
};

PrintReceiptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoiceData: PropTypes.shape({
    id: PropTypes.string,
    fecha: PropTypes.string,
    cliente: PropTypes.string,
    nitCi: PropTypes.string,
    razonSocial: PropTypes.string,
    mascota: PropTypes.string,
    servicios: PropTypes.arrayOf(
      PropTypes.shape({
        nombre: PropTypes.string,
        precio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        nombre: PropTypes.string,
        cantidad: PropTypes.number,
        precio_base: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    subtotal: PropTypes.number,
    descuento: PropTypes.number,
    total: PropTypes.number,
    metodoPago: PropTypes.string,
    montoRecibido: PropTypes.number,
    cambio: PropTypes.number,
  }),
};

export default PrintReceiptModal;
