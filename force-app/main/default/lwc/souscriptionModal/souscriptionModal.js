
import { LightningElement, api, wire, track } from 'lwc';
import getProductById from '@salesforce/apex/ProductController.getProductById';

export default class SubscriptionModal extends LightningElement {
    @track offer;
    @track offerId;
    @track isSubmitted = false;
    @track showConfirmation = false;
    @track isFormValid = false;

    @wire(getProductById, { productId: '$offerId' })
    wiredOffer({ error, data }) {
        if (data) {
            this.offer = data;
        } else if (error) {
            console.error('Erreur lors de la récupération de l’offre : ', error);
            alert('Erreur lors de la récupération de l\'offre. Veuillez vérifier l\'ID ou contacter l\'administrateur.');
        }
    }
    
    get offerName() {
        return this.offer ? this.offer.Name : ''; 
    }

    get offerPrice() {
        return this.offer ? this.offer.Price__c : ''; 
    }
    
    get offerId() {
        return this.offer ? this.offer.Id : null;
    }
    
  handleConfirm() {
        const allValid = [...this.template.querySelectorAll('lightning-input-field')]
        .every(field => field.reportValidity());

    if (allValid) {
        this.showConfirmation = true;
    }        
    }

    validateForm() {
        let isValid = true;
        const fields = this.template.querySelectorAll('lightning-input-field, lightning-input');
        
        fields.forEach(field => {
            if (!field.reportValidity()) {
                isValid = false;
            }
        });
    
        return isValid;
    }


    handleError(event) {
        console.error('Erreur lors de la soumission :', event.detail);
        alert('Une erreur est survenue : ' + JSON.stringify(event.detail));
    }


    confirmSubmission() {
        if (!this.offerId) {
            alert("Erreur : L'ID de l'offre est introuvable.");
            return;
        }
        this.showConfirmation = false;
        this.template.querySelector('lightning-record-edit-form').submit();
    }
    
    
    handleCancel() {

        this.showConfirmation = false;
    }

    handleSuccess(event) {
        this.isSubmitted = true;
       
    }
    
    connectedCallback() {
        this.offerId = sessionStorage.getItem('offerId');
    }
}