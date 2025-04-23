import { LightningElement, track , wire} from 'lwc';
import creerRemboursement from '@salesforce/apex/RemboursementController.creerRemboursement';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import attacherFichierRemboursement from '@salesforce/apex/RemboursementController.attacherFichierRemboursement';
import getContactIdForUser from '@salesforce/apex/RemboursementController.getContactIdForUser';
import deleteContentDocumentLink from '@salesforce/apex/RemboursementController.deleteContentDocumentLink';

export default class NewRemboursementModal extends LightningElement {
    @track isSubmitted = false;
    @track showConfirmation = false;

    @track isFile1Disabled = false;
    file1= null;

    montant;
    typeSoins;
    dateSoins;

    uploadedFileId; // ID du fichier uploadé

    // nécessaire pour autoriser l’upload
    dummyRecordId = null;
    

    get isFileUploadDisabled() {
        return !this.dummyRecordId;
    }
    
    connectedCallback() {
        getContactIdForUser()
            .then(contactId => {
                this.dummyRecordId = contactId; // record valide et accessible
            })
            .catch(error => {
                console.error('Erreur pour charger contactId:', error);
            });
    }

    handleFileUpload(event) {
     
        const uploadedFile = event.detail.files[0];
        this.uploadedFileId = uploadedFile.documentId;

        const fileInfo = {
            title: uploadedFile.name,
            documentId: this.uploadedFileId,
            downloadUrl: `/sfc/servlet.shepherd/document/download/${this.uploadedFileId}`
        };

        this.file1 = fileInfo;
        this.isFile1Disabled = true;
        console.log(fileInfo);

        console.log(this.file1);
    }

     deleteFile1() {
        if (!this.file1) return;
    
        const docId = this.file1.documentId;
        deleteContentDocumentLink({ contentDocumentId: docId })
            .then(() => {
                this.file1 = null;
                this.isFile1Disabled = false;
            })
            .catch(error => {
                console.error('Erreur suppression fichier', error);
            });
    }
    
    // Lorsqu'on clique sur "Ajouter", on vérifie le formulaire et on affiche la confirmation
    handleAddClick() {
        const fields = this.template.querySelectorAll('lightning-input-field');
        let isValid = true;

        fields.forEach(field => {
            if (!field.reportValidity()) {
                isValid = false;
            }
        });

        if (isValid) {
            // Stocke les valeurs pour soumission après confirmation
            this.montant = this.template.querySelector('[data-field="Montant_demande__c"]').value;
            this.typeSoins = this.template.querySelector('[data-field="Type_de_soins__c"]').value;
            this.dateSoins = this.template.querySelector('[data-field="Date_des_soins__c"]').value;

            this.showConfirmation = true;
        }
    }

    // Soumission réelle après confirmation
    confirmSubmission() {
        this.showConfirmation = false;
    
        creerRemboursement({
            montant: this.montant,
            typeSoins: this.typeSoins,
            dateSoins: this.dateSoins
        })
        .then(remboursementId => {
            console.log('Remboursement ID créé : ', remboursementId);
            let filePromise = Promise.resolve();
    
            if (this.uploadedFileId) {
                console.log('Tentative d’attachement du fichier avec ID : ', this.uploadedFileId);
                filePromise = attacherFichierRemboursement({
                    remboursementId,
                    contentDocumentId: this.uploadedFileId
                });
            }
    
            return filePromise;
        })
        .then(() => {
            this.isSubmitted = true;

        /*    this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Succès',
                    message: 'Remboursement ajouté avec justificatif.',
                    variant: 'success'
                })
            );*/
        })
        .catch(error => {
            const fieldErrors = error?.body?.fieldErrors || {};
            let messages = [];
        
            for (const field in fieldErrors) {
               // messages.push(fieldErrors[field][0].message);
               fieldErrors[field].forEach(err => {
                messages.push(`- ${err.message}`);
            });
            }
        
            const finalMessage = messages.join('\u2003'); // Retour à la ligne entre chaque erreur

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Erreur de validation',
                    message: finalMessage,
                    variant: 'error',
                    mode: 'sticky' // Optionnel : pour que le toast reste visible

                })
            );
        });
/*        
        .catch(error => {
            console.error('Erreur complète : ', error);
            console.error('Stack : ', error?.stack);
            console.error('Body : ', JSON.stringify(error?.body));
        
            const message =
                error?.body?.message ||
                error?.message ||
                (typeof error === 'string' ? error : 'Erreur inconnue');
        
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Erreur',
                    message: JSON.stringify(error?.body),
                    variant: 'error'
                })
            );
        });*/
        
    }
    
    get isButtonDisabled() {
        return !(this.isFile1Disabled);
    }

    handleCancel() {
        this.showConfirmation = false;
    }
}
