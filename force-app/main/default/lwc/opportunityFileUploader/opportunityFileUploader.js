import { LightningElement, track } from 'lwc';
import getOpportunityIdForUser from '@salesforce/apex/OpportunityTimelineController.getOpportunityIdForUser';
import deleteContentDocumentLink from '@salesforce/apex/OpportunityTimelineController.deleteContentDocumentLink';
import linkFileToOpportunity from '@salesforce/apex/OpportunityTimelineController.linkFileToOpportunity';
import moveToQualificationStage from '@salesforce/apex/OpportunityTimelineController.moveToQualificationStage';

export default class OpportunityFileUploader extends LightningElement {
    @track opportunityId;
    @track uploadedFilesMap = {
        file1: null,
        file2: null,
        file3: null
    };
    @track isFile1Disabled = false;
    @track isFile2Disabled = false;
    @track isFile3Disabled = false;

    connectedCallback() {
        getOpportunityIdForUser()
            .then(id => {
                this.opportunityId = id;
            })
            .catch(error => {
                console.error('Erreur récupération opportunité :', error);
            });
    }

        async handleUpload(event) {
            const uploadedFile = event.detail.files[0];
            const docId = uploadedFile.documentId;
        
            // Détection du type de fichier pour personnaliser le nom
            let fileType = '';
            if (this.uploadedFilesMap.file1 === null) {
                fileType = 'file1';
            } else if (this.uploadedFilesMap.file2 === null) {
                fileType = 'file2';
            } else if (this.uploadedFilesMap.file3 === null) {
                fileType = 'file3';
            }
        
            // Associer le document à l'opportunité
            if (this.opportunityId && docId && fileType) {
                linkFileToOpportunity({ contentDocumentId: docId, opportunityId: this.opportunityId, fileType })
                    .then(() => {
                        console.log('Fichier lié avec succès à l’opportunité');
                    })
                    .catch(error => {
                        console.error('Erreur lors du lien du fichier à l’opportunité :', error);
                    });
            }
        
            // Mettre à jour les fichiers téléchargés et désactiver l'uploader si nécessaire
            const fileInfo = {
                title: uploadedFile.name,
                documentId: docId,
                downloadUrl: `/sfc/servlet.shepherd/document/download/${docId}`
            };
        
            // Ajouter le fichier à la bonne position dans uploadedFilesMap
            if (fileType === 'file1') {
                this.uploadedFilesMap.file1 = fileInfo;
                this.isFile1Disabled = true;
            } else if (fileType === 'file2') {
                this.uploadedFilesMap.file2 = fileInfo;
                this.isFile2Disabled = true;
            } else if (fileType === 'file3') {
                this.uploadedFilesMap.file3 = fileInfo;
                this.isFile3Disabled = true;
            }
        }
        



    deleteFile(slot) {
        const docId = this.uploadedFilesMap[slot].documentId;
        deleteContentDocumentLink({ contentDocumentId: docId, opportunityId: this.opportunityId })
            .then(() => {
                this.uploadedFilesMap[slot] = null;
                // Réactiver l'uploader après suppression
                if (slot === 'file1') {
                    this.isFile1Disabled = false;
                } else if (slot === 'file2') {
                    this.isFile2Disabled = false;
                } else if (slot === 'file3') {
                    this.isFile3Disabled = false;
                }
            })
            .catch(error => {
                console.error('Erreur suppression fichier', error);
            });
    }

    deleteFile1() { this.deleteFile('file1'); }
    deleteFile2() { this.deleteFile('file2'); }
    deleteFile3() { this.deleteFile('file3'); }

    async goToQualification() {
        console.log('Début goToQualification avec opportunityId = ', this.opportunityId);
        moveToQualificationStage({ opportunityId: this.opportunityId })
            .then(() => {
                console.log('Changement d\'étape réussi pour ', this.opportunityId);
    
                const stageChangedEvent = new CustomEvent('stagechanged');
                this.dispatchEvent(stageChangedEvent);
            })
            .catch(error => {
                console.error('Erreur attrapée : ', JSON.stringify(error));
            });
    }
    
    get isButtonDisabled() {
        return !(this.isFile1Disabled && this.isFile2Disabled && this.isFile3Disabled);
    }

}