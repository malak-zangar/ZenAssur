import { LightningElement, track } from 'lwc';
import getProduct from '@salesforce/apex/RemboursementController.getProduct';

export default class MyOffer extends LightningElement {
    @track offer;

    connectedCallback() {
        getProduct()
            .then(result => {
                this.offer = result;
                console.log('Offre récupérée pour page dédiée : ', JSON.stringify(result));
            })
            .catch(error => {
                console.error('Erreur lors de la récupération de l\'offre :', error);
            });
    }

    get hospitalizationOptions() {
        // Split les options de couverture d'hospitalisation par , ou ;
        return this.offer.Hospitalization_Coverage__c ? this.offer.Hospitalization_Coverage__c.split(/[,;]\s*/).map(option => option.trim()) : [];
    }
    get Exclusions() {
        // Split les options de couverture d'hospitalisation par , ou ;
        return this.offer.Exclusions__c ? this.offer.Exclusions__c.split(/[,;]\s*/).map(option => option.trim()) : [];
    }
    get benefitsOptions() {
        // Split les principaux avantages par , ou ;
        return this.offer.Main_Benefits__c ? this.offer.Main_Benefits__c.split(/[,;]\s*/).map(option => option.trim()) : [];
    }

    get dentalCoverageIcon() {
        // Si la couverture dentaire et optique est "oui", icône verte de validation, sinon rouge de refus
        return this.offer.DentalAndOpticalCoverageText === 'Oui' ? '✅' : '❌';
    }
}