import { LightningElement, api } from 'lwc';
import LightningModal from 'lightning/modal';
export default class OfferModal extends LightningModal {
    @api offer;

connectedCallback() {
    console.log("Offer reçu dans offerModal:", JSON.stringify(this.offer));
}


    // Handler for closing the modal
    handleClose() {
        // Fermeture du modal : appel du callback passé depuis le parent
        this.dispatchEvent(new CustomEvent('close'));
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


