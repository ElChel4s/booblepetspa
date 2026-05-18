import React from 'react';
import PropTypes from 'prop-types';
import RegisterSidebar from '../components/RegisterSidebar';
import RegisterForm from '../components/RegisterForm';

const RegisterView = ({ setView, setEmailForVerification }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[85vh] gap-12 max-w-7xl mx-auto animate-in fade-in duration-500 px-4 py-10">
      <RegisterSidebar onBack={() => setView('login')} />
      <RegisterForm setView={setView} setEmailForVerification={setEmailForVerification} />
    </div>
  );
};


export default RegisterView;

RegisterView.propTypes = {
  setView: PropTypes.func.isRequired,
};
