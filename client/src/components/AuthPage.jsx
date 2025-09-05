import { useState } from 'react';
import SignupForm from './SignupForm';
import SigninForm from './SigninForm';
import './AuthPage.css';

const AuthPage = () => {
  const [isSigningUp, setIsSigningUp] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button onClick={() => setIsSigningUp(true)}>Inscription</button>
        <button onClick={() => setIsSigningUp(false)}>Connexion</button>
      </div>
      {isSigningUp ? <SignupForm /> : <SigninForm />}
    </div>
  );
};

export default AuthPage;
