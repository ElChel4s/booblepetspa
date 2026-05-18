import React, { useState } from 'react';
import { User, Mail, Phone, IdCard, MapPin, Lock, UserPlus, Loader2 } from 'lucide-react';
import PopInput from './PopInput';
import PopButton from './PopButton';
import * as authService from '../services/authService';

const RegisterForm = ({ setView, setEmailForVerification }) => {

  const [passStrength, setPassStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    idCard: '',
    address: '',
    password: ''
  });

  const calculateStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setPassStrength(score);
  };

  const barClass = (level) => {
    if (passStrength < level) return 'bg-slate-100';
    if (passStrength < 2) return 'bg-rose-500';
    if (passStrength < 4) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') calculateStrength(value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: regError } = await authService.register(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        id_card: formData.idCard,
        address: formData.address,
        role: 'cliente'
      });
      
      if (regError) {
        setError(regError.message);
      } else {
        setEmailForVerification(formData.email);
        setView('verify_email');
      }

    } catch (err) {
      setError('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:col-span-8">
      <div className="bg-white border-[5px] border-black p-10 rounded-[4rem] shadow-[15px_15px_0px_0px_black]">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10">Crear <span className="text-[var(--primary)]">Nueva Cuenta</span></h2>
        
        {error && (
          <div className="bg-rose-100 border-2 border-black p-3 rounded-2xl mb-6 text-[10px] font-black uppercase text-rose-600 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div className="md:col-span-2">
            <PopInput 
              label="Nombre y Apellidos" 
              icon={User} 
              placeholder="Carlos Roberto..." 
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)} 
            />
          </div>
          <PopInput 
            label="Correo Electrónico" 
            icon={Mail} 
            placeholder="ejemplo@mail.com" 
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)} 
          />
          <PopInput 
            label="Teléfono / WhatsApp" 
            icon={Phone} 
            placeholder="+591 7..." 
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)} 
          />
          <PopInput 
            label="Cédula / NIT" 
            icon={IdCard} 
            placeholder="1234567 LP" 
            value={formData.idCard}
            onChange={(e) => handleInputChange('idCard', e.target.value)} 
          />
          <PopInput 
            label="Dirección / Ciudad" 
            icon={MapPin} 
            placeholder="Equipetrol, Calle 5..." 
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)} 
          />

          <div className="md:col-span-2 mt-4 relative">
            <PopInput 
              label="Elige una Contraseña" 
              icon={Lock} 
              type="password" 
              placeholder="Mínimo 8 caracteres" 
              containerClassName="mb-3" 
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)} 
            />
            <div className="flex gap-2 px-2 mb-6">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className={`h-2.5 flex-1 rounded-full border-2 border-black transition-colors duration-300 ${barClass(level)}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <PopButton 
            onClick={handleSubmit} 
            icon={loading ? Loader2 : UserPlus} 
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Creando Cuenta...' : 'Completar Registro'}
          </PopButton>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
