import { LightningElement } from 'lwc';

export default class AgencyMap extends LightningElement {
    // Liste des agences avec leurs coordonnées
    agencyLocations = [
        {
            location: { Latitude: 36.8065, Longitude: 10.1815 },
            title: "Agence Tunis",
            description: "📍 Avenue Habib Bourguiba, Tunis, 2050",
            phone: "📞 +216 71 000 000",
            email: "📧 tunis@zenassur.com",
        },
    
        {
            location: { Latitude: 35.8000, Longitude: 10.6392 },
            title: "Agence Sousse",
            description: "📍 Boulevard Hédi Chaker, Sousse, 3012",
            phone: "📞 +216 73 000 000",
            email: "📧 sousse@zenassur.com",

        },
        {
            location: { Latitude: 34.7405, Longitude: 10.7607 },
            title: "Agence Sfax",
            description: "📍 Rue El-Margoub, Sfax, 4050",
            phone: "📞 +216 74 000 000",
            email: "📧 sfax@zenassur.com",

        }
    ];
    agencyLocations1 = [
        {
            location: { Latitude: 36.8065, Longitude: 10.1815 },
            title: "Agence Tunis",
        },
    
        {
            location: { Latitude: 35.8000, Longitude: 10.6392 },
            title: "Agence Sousse",
        },
        {
            location: { Latitude: 34.7405, Longitude: 10.7607 },
            title: "Agence Sfax",
        }
    ];
    
    // Variable pour stocker l'agence sélectionnée
    selectedAgency = this.agencyLocations1[0];

    // Fonction pour gérer le clic sur un marqueur
    handleMarkerSelect(event) {
        const selectedMarkerId = event.detail.selectedMarkerValue;
        
        // Trouver l'agence correspondante au marqueur sélectionné
        this.selectedAgency = this.agencyLocations.find(
            agency => agency.title === selectedMarkerId
        );
    }
}
