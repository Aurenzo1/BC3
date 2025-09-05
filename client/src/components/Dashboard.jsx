import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import './Dashboard.css';
import VehicleManager from './VehicleManager';

const baseURI = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientCount = async () => {
      try {
        const response = await fetch(baseURI + 'api/clients/count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setClientCount(data.count);
        } else {
          alert('Erreur lors de la récupération du nombre de clients');
          navigate('/')
        }
      } catch (error) {
        alert('Erreur réseau');
        navigate('/')
      }
    };

    const fetchVehicleCount = async () => {
      try {
        const response = await fetch(baseURI + 'api/vehicules', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setVehicleCount(data.length);
        }
      } catch (error) {
        console.log('Erreur lors de la récupération des véhicules');
      }
    };

    fetchClientCount();
    fetchVehicleCount();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de bord administrateur</h1>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={`tab-button ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          Gestion des véhicules
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Clients inscrits</h3>
              <div className="stat-value">{clientCount}</div>
              <div className="stat-description">Nombre total de clients enregistrés</div>
            </div>
            
            <div className="stat-card">
              <h3>Véhicules</h3>
              <div className="stat-value">{vehicleCount}</div>
              <div className="stat-description">Nombre de véhicules enregistrés</div>
            </div>
            
            <div className="stat-card">
              <h3>État du système</h3>
              <div className="stat-value">Actif</div>
              <div className="stat-description">Tous les services fonctionnent normalement</div>
            </div>
          </div>
          
          <div className="dashboard-actions">
            <button className="action-button" disabled>Gérer les clients</button>
            <button 
              className="action-button"
              onClick={() => setActiveTab('vehicles')}
            >
              Gérer les Véhicules
            </button>
            <button className="action-button" disabled>Rapports</button>
          </div>
        </>
      )}

      {activeTab === 'vehicles' && (
        <VehicleManager />
      )}
    </div>
  );
};

export default AdminDashboard;
