import { useState, useCallback } from 'react';

const baseURI = import.meta.env.VITE_API_BASE_URL;

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
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
        setError('Erreur lors de la récupération des véhicules');
      }
    } catch (error) {
      setError('Erreur réseau');
      console.error('Fetch vehicles error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addVehicle = useCallback(
    async vehicleData => {
      try {
        const response = await fetch(baseURI + 'api/vehicules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicleData),
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          // Optimisation: ajouter localement au lieu de refetch
          await fetchVehicles(); // Pour obtenir les données complètes avec client
          return { success: true, message: result.message };
        } else {
          const errorData = await response.json();
          return { success: false, error: errorData.error };
        }
      } catch (error) {
        console.error('Add vehicle error:', error);
        return { success: false, error: 'Erreur réseau' };
      }
    },
    [fetchVehicles]
  );

  const updateVehicle = useCallback(
    async (id, vehicleData) => {
      try {
        const response = await fetch(`${baseURI}api/vehicules/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vehicleData),
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          // Optimisation: mettre à jour localement
          await fetchVehicles();
          return { success: true, message: result.message };
        } else {
          const errorData = await response.json();
          return { success: false, error: errorData.error };
        }
      } catch (error) {
        console.error('Update vehicle error:', error);
        return { success: false, error: 'Erreur réseau' };
      }
    },
    [fetchVehicles]
  );

  const deleteVehicle = useCallback(async id => {
    try {
      const response = await fetch(`${baseURI}api/vehicules/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        // Optimisation: suppression locale
        setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
        return { success: true, message: result.message };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Delete vehicle error:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }, []);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
};
