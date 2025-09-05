import './HomePage.css';
import Header from './Header';

const HomePage = () => {
  return (
    <>
      <Header />
    <div className="home-container">
      <header className="header">
        <h1>Bienvenue chez Garage Auto</h1>
        <p>Votre satisfaction, notre priorité</p>
      </header>
      <section className="services">
        <h2>Nos Services</h2>
        <ul>
          <li>Réparations</li>
          <li>Entretien</li>
          <li>Diagnostic</li>
          <li>Vente de véhicules</li>
        </ul>
      </section>
      <section className="contact">
        <h2>Contactez-nous</h2>
        <p>Adresse: 123 Rue de la vroum vroum, Paris</p>
        <p>Téléphone: +33 6 23 45 67 89</p>
        <p>Email: contact@garageauto.fr</p>
      </section>
    </div>
    </>
  );
};

export default HomePage