import { useState, useEffect, useCallback, useMemo } from 'react';
import './VehicleManager.css';

const baseURI = import.meta.env.VITE_API_BASE_URL;

const VehicleManager = () => {
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    annee: '',
    client_id: '',
    name: '',
    type: '',
  });

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(baseURI + 'api/vehicules', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      } else {
        alert('Erreur lors de la récupération des véhicules');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(baseURI + 'api/clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        alert('Erreur lors de la récupération des clients');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      const url = editingVehicle
        ? `${baseURI}api/vehicules/${editingVehicle.id}`
        : `${baseURI}api/vehicules`;
      const method = editingVehicle ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          alert(
            result.message ||
              (editingVehicle
                ? 'Véhicule modifié avec succès'
                : 'Véhicule ajouté avec succès')
          );
          resetForm();
          fetchVehicles();
        } else {
          const errorData = await response.json();
          alert(errorData.error || "Erreur lors de l'opération");
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('Erreur réseau');
      }
    },
    [formData, editingVehicle]
  );

  const handleEdit = useCallback(vehicle => {
    setEditingVehicle(vehicle);
    setFormData({
      marque: vehicle.marque,
      modele: vehicle.modele,
      annee: vehicle.annee,
      client_id: vehicle.client_id || '',
      name: vehicle.name,
      type: vehicle.type || '',
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async id => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        const response = await fetch(`${baseURI}api/vehicules/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Véhicule supprimé avec succès');
          // Optimisation: mise à jour locale au lieu de refetch
          setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('Erreur réseau');
      }
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      marque: '',
      modele: '',
      annee: '',
      client_id: '',
      name: '',
      type: '',
    });
    setEditingVehicle(null);
    setShowForm(false);
  }, []);

  // Mémorisation des options de type pour éviter les re-renders
  const vehicleTypes = useMemo(
    () => [
      { value: '', label: 'Sélectionner un type' },
      { value: 'Berline', label: 'Berline' },
      { value: 'Break', label: 'Break' },
      { value: 'SUV', label: 'SUV' },
      { value: 'Citadine', label: 'Citadine' },
      { value: 'Coupé', label: 'Coupé' },
      { value: 'Cabriolet', label: 'Cabriolet' },
      { value: 'Utilitaire', label: 'Utilitaire' },
    ],
    []
  );

  // Mémorisation de la liste des clients
  const clientOptions = useMemo(
    () => [
      { value: '', label: 'Aucun client associé' },
      ...clients.map(client => ({
        value: client.id,
        label: `${client.firstname} ${client.lastname}`,
      })),
    ],
    [clients]
  );

  return (
    <section
      className='vehicle-manager'
      role='main'
      aria-label='Gestion des véhicules'
    >
      <header className='vehicle-header'>
        <h1 id='vehicle-manager-title'>
          Gestion des Véhicules - Garage VroumVroum
        </h1>
        <p className='vehicle-description'>
          Interface d'administration pour la gestion complète du parc
          automobile. Ajoutez, modifiez et supprimez les véhicules de votre
          garage en toute simplicité.
        </p>
        <button
          className='btn-primary'
          onClick={() => setShowForm(true)}
          aria-describedby='vehicle-manager-title'
          aria-label='Ouvrir le formulaire pour ajouter un nouveau véhicule'
          title='Enregistrer un nouveau véhicule dans le système de gestion'
        >
          <span>Ajouter un véhicule</span>
          <span className='btn-icon' aria-hidden='true'>
            +
          </span>
        </button>
      </header>

      {showForm && (
        <div
          className='modal-overlay'
          role='dialog'
          aria-modal='true'
          aria-labelledby='modal-title'
        >
          <div className='modal'>
            <div className='modal-header'>
              <h3 id='modal-title'>
                {editingVehicle
                  ? 'Modifier le véhicule'
                  : 'Ajouter un véhicule'}
              </h3>
              <button
                className='btn-close'
                onClick={resetForm}
                aria-label='Fermer le formulaire'
                autoFocus
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className='vehicle-form' role='form'>
              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='marque-input'>Marque *</label>
                  <input
                    id='marque-input'
                    type='text'
                    name='marque'
                    value={formData.marque}
                    onChange={handleChange}
                    required
                    aria-required='true'
                    aria-describedby='marque-help'
                  />
                  <div id='marque-help' className='sr-only'>
                    Entrez la marque du véhicule (obligatoire)
                  </div>
                </div>
                <div className='form-group'>
                  <label htmlFor='modele-input'>Modèle *</label>
                  <input
                    id='modele-input'
                    type='text'
                    name='modele'
                    value={formData.modele}
                    onChange={handleChange}
                    required
                    aria-required='true'
                    aria-describedby='modele-help'
                  />
                  <div id='modele-help' className='sr-only'>
                    Entrez le modèle du véhicule (obligatoire)
                  </div>
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='annee-input'>Année *</label>
                  <input
                    id='annee-input'
                    type='number'
                    name='annee'
                    value={formData.annee}
                    onChange={handleChange}
                    min='1900'
                    max='2025'
                    required
                    aria-required='true'
                    aria-describedby='annee-help'
                  />
                  <div id='annee-help' className='sr-only'>
                    Entrez l'année du véhicule (entre 1900 et 2025)
                  </div>
                </div>
                <div className='form-group'>
                  <label htmlFor='type-select'>Type</label>
                  <select
                    id='type-select'
                    name='type'
                    value={formData.type}
                    onChange={handleChange}
                    aria-describedby='type-help'
                  >
                    {vehicleTypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div id='type-help' className='sr-only'>
                    Sélectionnez le type de véhicule (optionnel)
                  </div>
                </div>
              </div>

              <div className='form-group'>
                <label htmlFor='name-input'>Plaque d'immatriculation *</label>
                <input
                  id='name-input'
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='AA-123-BB'
                  pattern='[A-Z]{2}-\d{3}-[A-Z]{2}'
                  required
                  aria-required='true'
                  aria-describedby='name-help name-format'
                />
                <div id='name-help' className='sr-only'>
                  Entrez la plaque d'immatriculation (obligatoire)
                </div>
                <div id='name-format' className='form-help'>
                  Format: AA-123-BB (2 lettres, 3 chiffres, 2 lettres)
                </div>
              </div>

              <div className='form-group'>
                <label htmlFor='client-select'>
                  Client associé (optionnel)
                </label>
                <select
                  id='client-select'
                  name='client_id'
                  value={formData.client_id}
                  onChange={handleChange}
                  aria-describedby='client-help'
                >
                  {clientOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div id='client-help' className='sr-only'>
                  Sélectionnez un client à associer au véhicule (optionnel)
                </div>
              </div>

              <div
                className='form-actions'
                role='group'
                aria-label='Actions du formulaire'
              >
                <button
                  type='button'
                  onClick={resetForm}
                  className='btn-secondary'
                  aria-label='Annuler et fermer le formulaire'
                >
                  Annuler
                </button>
                <button
                  type='submit'
                  className='btn-primary'
                  aria-label={
                    editingVehicle
                      ? 'Sauvegarder les modifications du véhicule'
                      : 'Ajouter le nouveau véhicule'
                  }
                >
                  {editingVehicle ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main
        className='vehicle-list'
        role='region'
        aria-label='Liste des véhicules'
      >
        <h2 className='vehicle-list-title'>Véhicules enregistrés</h2>
        <p className='vehicle-list-summary'>
          {vehicles.length === 0
            ? "Aucun véhicule n'est actuellement enregistré dans votre système de gestion."
            : `${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} ${vehicles.length > 1 ? 'sont' : 'est'} actuellement enregistré${vehicles.length > 1 ? 's' : ''} dans votre garage.`}
        </p>
        <table
          className='vehicle-table'
          role='table'
          aria-label='Tableau des véhicules enregistrés avec leurs caractéristiques et propriétaires'
        >
          <thead>
            <tr role='row'>
              <th scope='col' aria-sort='none'>
                Plaque
              </th>
              <th scope='col' aria-sort='none'>
                Marque
              </th>
              <th scope='col' aria-sort='none'>
                Modèle
              </th>
              <th scope='col' aria-sort='none'>
                Année
              </th>
              <th scope='col' aria-sort='none'>
                Type
              </th>
              <th scope='col' aria-sort='none'>
                Client
              </th>
              <th scope='col'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, _index) => (
              <tr key={vehicle.id} role='row'>
                <td className='plate-number' role='gridcell'>
                  <span aria-label={`Plaque d'immatriculation ${vehicle.name}`}>
                    {vehicle.name}
                  </span>
                </td>
                <td role='gridcell'>{vehicle.marque}</td>
                <td role='gridcell'>{vehicle.modele}</td>
                <td role='gridcell'>{vehicle.annee}</td>
                <td role='gridcell'>{vehicle.type || '-'}</td>
                <td role='gridcell'>
                  {vehicle.firstname && vehicle.lastname
                    ? `${vehicle.firstname} ${vehicle.lastname}`
                    : 'Aucun client'}
                </td>
                <td className='actions' role='gridcell'>
                  <button
                    className='btn-edit'
                    onClick={() => handleEdit(vehicle)}
                    aria-label={`Modifier le véhicule ${vehicle.marque} ${vehicle.modele} avec la plaque ${vehicle.name}`}
                    title={`Éditer les informations du ${vehicle.marque} ${vehicle.modele}`}
                  >
                    <span>Modifier</span>
                    <span className='btn-icon' aria-hidden='true'>
                      ✏️
                    </span>
                  </button>
                  <button
                    className='btn-delete'
                    onClick={() => handleDelete(vehicle.id)}
                    aria-label={`Supprimer le véhicule ${vehicle.marque} ${vehicle.modele} avec la plaque ${vehicle.name}`}
                    title={`Supprimer définitivement le ${vehicle.marque} ${vehicle.modele} du système`}
                  >
                    <span>Supprimer</span>
                    <span className='btn-icon' aria-hidden='true'>
                      🗑️
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vehicles.length === 0 && (
          <div className='no-vehicles' role='status' aria-live='polite'>
            <h3>Aucun véhicule enregistré</h3>
            <p>
              Votre garage ne contient aucun véhicule pour le moment. Commencez
              par ajouter le premier véhicule en cliquant sur le bouton "Ajouter
              un véhicule" ci-dessus.
            </p>
            <ul className='empty-state-tips'>
              <li>Enregistrez les véhicules de vos clients</li>
              <li>Suivez l'historique des interventions</li>
              <li>Gérez votre parc automobile efficacement</li>
            </ul>
          </div>
        )}
      </main>

      {/* Structured data for SEO */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Système de Gestion de Véhicules - Garage VroumVroum',
            description:
              "Interface d'administration pour la gestion complète du parc automobile d'un garage. Permet l'ajout, la modification et la suppression de véhicules avec suivi des propriétaires.",
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
            featureList: [
              'Gestion de véhicules',
              'Association clients',
              'Validation des données',
              'Interface accessible',
              'Conformité RGPD',
            ],
          }),
        }}
      />
    </section>
  );
};

export default VehicleManager;
