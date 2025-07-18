import { LightningElement, wire,track } from 'lwc';
import getRemboursementsEtSolde from '@salesforce/apex/RemboursementController.getRemboursementsEtSolde';
import { NavigationMixin } from 'lightning/navigation';
import getJustificatifDownloadUrl from '@salesforce/apex/RemboursementController.getJustificatifDownloadUrl';
import { refreshApex } from '@salesforce/apex';

export default class RemboursementManagerComponent extends NavigationMixin(LightningElement) {
    remboursements = [];
    soldeRestant = 0;
    currentPage = 1;
    itemsPerPage = 7;
    totalPages = 1;
    wiredResult;
    @track showNoResults = false;
    selectedRemboursement;
    isModalOpen = false;

    @track isEnCours = true;
    @track isArchives = false;
    
    @track sortedBy;
    @track sortedDirection = 'asc';

  get currentTitle() {
        return this.isEnCours ? 'Mes demandes de remboursement en cours' : 'Mes remboursements archivés';
    }
    
handleOpenPreviewInNewWindow() {
    if (this.selectedRemboursement?.FileUrl) {
        window.open(this.selectedRemboursement.FileUrl, '_blank');
    } else {
        console.error('Pas de lien de fichier disponible');
    }
}

    columns = [
        { label: 'Nom', fieldName: 'Name', type: 'text' },
        { label: 'Date de la Demande', fieldName: 'Date_demande__c', type: 'date',sortable: true },
        { label: 'Type de Soins', fieldName: 'Type_de_soins__c', type: 'text',sortable: true },
        { label: 'Statut', fieldName: 'Statut__c', type: 'text', sortable: true,
            cellAttributes: {
                class: 'slds-text-align_center',
                style: { fieldName: 'statutColor' }
            }
        },
        { label: 'Actions', type: 'button', typeAttributes: {
                    label: 'Voir les détails',  iconName: 'utility:info',
                    name: 'view_details', title: 'Voir les détails',
                    variant: 'brand', iconPosition: 'left' }
            }
            
    ];

get selectedStatusStyle() {
    return this.getStatusColor(this.selectedRemboursement?.Statut__c);
}


async handleRowAction(event) {
    const row = event.detail.row;
    const actionName = event.detail.action.name;

    if (actionName === 'view_details') {
        try {
            console.log('Appel Apex pour getJustificatifDownloadUrl avec id:', row.Id);
            const fileUrl = await getJustificatifDownloadUrl({ remboursementId: row.Id }); // <- await + params sous forme d'objet
            console.log('Réponse Apex (fileUrl):', fileUrl);

            this.selectedRemboursement = {
                ...row,
                FileUrl: fileUrl, 
            };

            this.isModalOpen = true;
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', JSON.stringify(error));
            this.selectedRemboursement = { ...row, FileUrl: null };
            this.isModalOpen = true;
        }
    }
}
    
    closeModal() {
        this.isModalOpen = false;
    }
    
    getStatusColor(status) {
        switch (status) {
            case 'Validé remboursé':
                return 'color:rgb(87, 196, 24); border: 1px solid rgb(87, 196, 24); border-radius: 0.5rem; padding: 0.2rem 0.5rem; margin: 0.5rem;';
            case 'Refusé non remboursé':
                return 'color:rgb(226, 25, 25); border: 1px solid  rgb(226, 25, 25); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'En cours de traitement':
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'En attente' :
                return 'color:rgb(114, 124, 126); border: 1px solid rgb(114, 124, 126); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            default:
                return '';
            }
    }
showPending() {
    this.filteredRemboursements = this.allRemboursements.filter(r => 
        r.Statut__c === 'En cours de traitement' || r.Statut__c === 'En attente'
    );
        this.remboursements = [...this.filteredRemboursements]; // utilisée dans la recherche

    this.currentPage = 1;
    this.totalPages = Math.ceil(this.remboursements.length / this.itemsPerPage);

    this.updatePageData();

        this.isEnCours = true;
        this.isArchives = false;
}

showProcessed() {
    this.filteredRemboursements = this.allRemboursements.filter(r => 
        r.Statut__c === 'Validé remboursé' || r.Statut__c === 'Refusé non remboursé'
    );
            this.remboursements = [...this.filteredRemboursements]; // utilisée dans la recherche

    this.currentPage = 1;
    this.totalPages = Math.ceil(this.remboursements.length / this.itemsPerPage);
    this.isEnCours = false;
    this.isArchives = true;
    this.updatePageData();
}

             @wire(getRemboursementsEtSolde)
            wiredData(result) {
                this.wiredResult = result; // <--- on stocke
                const { data, error } = result;
                if (data) {
                    this.allRemboursements = data.remboursements;
                    this.remboursements = [...data.remboursements]; // copie pour affichage
                    this.showPending(); // affichage par défaut
                    this.soldeRestant = data.soldeRestant;
                    this.totalPages = Math.ceil(this.remboursements.length / this.itemsPerPage);
                    this.updatePageData();
                    refreshApex(this.wiredResult);

                 } else if (error) {
                    console.log(error);
                }
            }
            handleRefreshPage() {
                refreshApex(this.wiredResult);
            }
    // Pagination: mettre à jour les données pour la page actuelle
    updatePageData() {

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
    
        this.paginatedRemboursements = this.remboursements.slice(start, end).map(remb => {
            return {
                ...remb,
                statutColor: this.getStatusColor(remb.Statut__c),
                FileUrl: `/sfc/servlet.shepherd/document/download/${remb.ContentDocumentId}` 
            };
        });
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePageData();
        }
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePageData();
        }
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    // Affichage du formulaire
    handleShowForm() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/nouveau-remboursement' // Assurez-vous que l'URL de souscription est correcte
            }
        });
    }

        // Méthode de tri
handleSort(event) {
    const { fieldName, sortDirection } = event.detail;

    this.sortedBy = fieldName;
    this.sortedDirection = sortDirection;

    const cloneData = [...this.remboursements];

    cloneData.sort((a, b) => {
        let valA = a[fieldName];
        let valB = b[fieldName];

        if (fieldName === 'Date_demande__c') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        return sortDirection === 'asc'
            ? (valA > valB ? 1 : valA < valB ? -1 : 0)
            : (valA < valB ? 1 : valA > valB ? -1 : 0);
    });

    this.remboursements = cloneData;
    this.updatePageData(); // Important !
}

handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();

    if (!searchTerm) {
        // Si la barre de recherche est vide → réinitialiser la liste
        this.remboursements = [...this.filteredRemboursements ];
    } else {
        // Sinon, filtrer à partir de la liste complète
        this.remboursements = this.filteredRemboursements .filter(item =>
            (item.Name && item.Name.toLowerCase().includes(searchTerm)) ||
            (item.Type_de_soins__c && item.Type_de_soins__c.toLowerCase().includes(searchTerm)) ||
            (item.Statut__c && item.Statut__c.toLowerCase().includes(searchTerm)) ||
            (item.Date_demande__c && item.Date_demande__c.toLowerCase().includes(searchTerm))
        );
    }

    this.currentPage = 1;
    this.totalPages = Math.ceil(this.remboursements.length / this.itemsPerPage);
    this.updatePageData();
}

get isFraud() {
        console.log('isFraud VALUE:', this.selectedRemboursement?.isFraud__c);
    return this.selectedRemboursement?.isFraud__c === true;
}

get isRefusedNotRefunded() {
    return (
        this.selectedRemboursement?.Statut__c === 'Refusé non remboursé' &&
        !this.selectedRemboursement?.isFraud__c
    );
}


get formattedFraudReasons() {
            console.log(this.selectedRemboursement?.FraudReason__c);

    if (this.selectedRemboursement?.FraudReason__c) {
        return this.selectedRemboursement.FraudReason__c
            .split(/(?:^|\n|\r|\r\n)\s*-\s*/g) // prend chaque ligne qui commence par "- "
            .map(reason => {
                const trimmed = reason.trim();
                if (!trimmed) return null; // filtre les vides

                const match = trimmed.match(/\(impact\s*:\s*([-+]?\d*\.?\d+)\)/i);
                let impactValue = 0;
                if (match) {
                    impactValue = parseFloat(match[1]);
                }

                return {
                    text: trimmed,
                    impact: impactValue,
                    colorClass:
                        impactValue > 0
                            ? 'impact-red'
                            : impactValue < 0
                            ? 'impact-green'
                            : 'impact-neutral'
                };
            })
            .filter(Boolean); // enlève les null
    }
    return [];
}

get formattedFraudReasonss() {
    const raw = this.selectedRemboursement?.FraudReason__c;
    console.log('FraudReason brut:', raw);

    if (raw) {
        return raw
            .split(/-\s(?=[^\-])/g) 
            .map(reason => {
                const trimmed = reason.trim();
                if (!trimmed) return null;

                const match = trimmed.match(/\(impact\s*:\s*([-+]?\d*\.?\d+)\)/i);
                let impactValue = 0;
                if (match) {
                    impactValue = parseFloat(match[1]);
                }

                return {
                    text: trimmed,
                    impact: impactValue,
                    colorClass:
                        impactValue > 0
                            ? 'impact-red'
                            : impactValue < 0
                            ? 'impact-green'
                            : 'impact-neutral'
                };
            })
            .filter(Boolean);
    }

    return [];
}



get isDisabled() {
    return this.soldeRestant === 0;
}


}
