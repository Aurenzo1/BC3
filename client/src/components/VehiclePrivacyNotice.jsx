import React, { useState } from 'react';
import './VehiclePrivacyNotice.css';

const VehiclePrivacyNotice = ({ isVisible, onAccept, onDecline }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="privacy-notice-overlay" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div className="privacy-notice">
        <div className="privacy-header">
          <h2 id="privacy-title">Protection des données personnelles</h2>
        </div>
        
        <div className="privacy-content">
          <div className="privacy-summary">
            <p>
              Nous collectons et traitons vos données de véhicules dans le cadre de la gestion 
              de notre service de garage automobile, conformément au Règlement Général sur la 
              Protection des Données (RGPD).
            </p>
          </div>

          {!showDetails && (
            <button 
              className="privacy-details-btn"
              onClick={() => setShowDetails(true)}
              aria-expanded="false"
              aria-controls="privacy-details"
            >
              Voir les détails
            </button>
          )}

          {showDetails && (
            <div id="privacy-details" className="privacy-details" aria-expanded="true">
              <h3>Données collectées</h3>
              <ul>
                <li><strong>Informations du véhicule :</strong> Marque, modèle, année, plaque d'immatriculation, type</li>
                <li><strong>Association client :</strong> Lien avec le propriétaire du véhicule (optionnel)</li>
                <li><strong>Données techniques :</strong> Date d'enregistrement, historique des modifications</li>
              </ul>

              <h3>Finalités du traitement</h3>
              <ul>
                <li>Gestion et suivi des véhicules confiés au garage</li>
                <li>Planification des interventions et maintenance</li>
                <li>Facturation et suivi administratif</li>
                <li>Respect des obligations légales et réglementaires</li>
              </ul>

              <h3>Base légale</h3>
              <p>
                Le traitement de vos données est fondé sur :
              </p>
              <ul>
                <li><strong>Exécution d'un contrat :</strong> Prestation de services automobiles</li>
                <li><strong>Intérêt légitime :</strong> Gestion efficace de notre activité</li>
                <li><strong>Obligation légale :</strong> Conservation de documents comptables</li>
              </ul>

              <h3>Durée de conservation</h3>
              <p>
                Vos données sont conservées pendant <strong>7 ans</strong> après la dernière 
                intervention, conformément aux obligations comptables.
              </p>

              <h3>Vos droits (RGPD)</h3>
              <ul>
                <li><strong>Droit d'accès :</strong> Consulter vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> Corriger les données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> Supprimer vos données sous certaines conditions</li>
                <li><strong>Droit de portabilité :</strong> Récupérer vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement</li>
                <li><strong>Droit de limitation :</strong> Limiter le traitement de vos données</li>
              </ul>

              <h3>Contact</h3>
              <p>
                Pour exercer vos droits ou pour toute question concernant le traitement de vos données :
                <br />
                <strong>Email :</strong> rgpd@garage-vroumvroum.fr
                <br />
                <strong>Téléphone :</strong> 01 23 45 67 89
              </p>

              <p>
                Vous avez également le droit d'introduire une réclamation auprès de la 
                <strong> Commission Nationale de l'Informatique et des Libertés (CNIL)</strong>.
              </p>

              <button 
                className="privacy-details-btn"
                onClick={() => setShowDetails(false)}
                aria-expanded="true"
                aria-controls="privacy-details"
              >
                Masquer les détails
              </button>
            </div>
          )}
        </div>

        <div className="privacy-actions" role="group" aria-label="Actions concernant la politique de confidentialité">
          <button 
            className="privacy-btn privacy-decline" 
            onClick={onDecline}
            aria-label="Refuser le traitement des données et quitter"
          >
            Refuser
          </button>
          <button 
            className="privacy-btn privacy-accept" 
            onClick={onAccept}
            aria-label="Accepter le traitement des données et continuer"
          >
            J'accepte et je continue
          </button>
        </div>

        <div className="privacy-footer">
          <p>
            <small>
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')} | 
              Conforme au RGPD (UE) 2016/679
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehiclePrivacyNotice;