import './Header.css';
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="headerhead">
      <h1>Garage Auto</h1>
      <Link to="/auth">
        <button className="login-button">Connexion</button>
      </Link>
    </header>
  );
};

export default Header;
