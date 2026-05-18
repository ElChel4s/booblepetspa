import React from 'react';
import AuthHero from '../components/AuthHero';
import LoginForm from '../components/LoginForm';

const LoginView = ({ setView }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh] items-center gap-16 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 px-4">
      <AuthHero />
      <LoginForm setView={setView} />
    </div>
  );
};

export default LoginView;
