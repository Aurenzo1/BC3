import { useState } from 'react';
import './SignupForm.css';
const baseURI = import.meta.env.VITE_API_BASE_URL

const SignupForm = () => {
  const [formData, setFormData] = useState({
    lastname: '',
    firstname: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(baseURI + 'api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('Inscription réussie');
      } else {
        alert('Erreur lors de l\'inscription');
      }
    } catch (error) {
      alert('Erreur réseau');
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h2>Inscription</h2>
      <input type="text" name="lastname" placeholder="Nom" value={formData.lastname} onChange={handleChange} required />
      <input type="text" name="firstname" placeholder="Prénom" value={formData.firstname} onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required />
      <button type="submit">S'inscrire</button>
    </form>
  );
};

export default SignupForm;