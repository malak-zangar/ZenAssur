import { LightningElement, wire,track } from 'lwc';
import getReclamations from '@salesforce/apex/ReclamationController.getReclamations';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

export default class ReclamationManagerComponent extends NavigationMixin(LightningElement)  {
    wiredResult;

  reclamations = [];
    soldeRestant = 0;
    currentPage = 1;
    itemsPerPage = 5;
    totalPages = 1;

    selectedReclamation;
isModalOpen = false;
    
@track sortedBy;
@track sortedDirection = 'asc';

    columns = [
        { label: 'Numéro', fieldName: 'CaseNumber', type: 'text' },
        { label: 'Sujet', fieldName: 'Subject', type: 'text',sortable: true },
        { 
            label: 'Date de la demande', 
            fieldName: 'CreatedDate', 
            type: 'date', 
            sortable: true,
            typeAttributes: {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false, // format 24h
                timeZone: 'Europe/Paris'
            }
        },
        { label: 'Statut', fieldName: 'Status', type: 'text', sortable: true,
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
    return this.getStatusColor(this.selectedReclamation?.Status);
}


async handleRowAction(event) {
    const row = event.detail.row;
    const actionName = event.detail.action.name;

    if (actionName === 'view_details') {
            this.selectedReclamation = {
                ...row,
            };

            this.isModalOpen = true;
    }
}
    
    closeModal() {
        this.isModalOpen = false;
    }
    
    getStatusColor(status) {
        switch (status) {
            case 'Fermée-traitée':
                return 'color:rgb(87, 196, 24); border: 1px solid rgb(87, 196, 24); border-radius: 0.5rem; padding: 0.2rem 0.5rem; margin: 0.5rem;';
            case 'Fermée-non traitée':
                return 'color:rgb(226, 25, 25); border: 1px solid  rgb(226, 25, 25); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'En cours de traitement':
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'Nouvelle' :
                return 'color:rgb(114, 124, 126); border: 1px solid rgb(114, 124, 126); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            default:
                return '';
            }
    }

            @wire(getReclamations)
wiredData(result) {
    this.wiredResult = result; // <--- on stocke
    const { data, error } = result;
    if (data) {
        console.log(data);
        this.allReclamations = data;
        this.reclamations = this.allReclamations; // copie pour affichage
        this.totalPages = Math.ceil(this.reclamations.length / this.itemsPerPage);
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
    
        this.paginatedReclamations = this.reclamations.slice(start, end).map(rec => {
            return {
                ...rec,
                statutColor: this.getStatusColor(rec.Status),
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

        // Méthode de tri
handleSort(event) {
    const { fieldName, sortDirection } = event.detail;

    this.sortedBy = fieldName;
    this.sortedDirection = sortDirection;

    const cloneData = [...this.reclamations];

    cloneData.sort((a, b) => {
        let valA = a[fieldName];
        let valB = b[fieldName];

        if (fieldName === 'CreatedDate') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        return sortDirection === 'asc'
            ? (valA > valB ? 1 : valA < valB ? -1 : 0)
            : (valA < valB ? 1 : valA > valB ? -1 : 0);
    });

    this.reclamations = cloneData;
    this.updatePageData(); // Important !
}

handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();

    if (!searchTerm) {
        // Si la barre de recherche est vide → réinitialiser la liste
        this.reclamations = [...this.allReclamations];
    } else {
        // Sinon, filtrer à partir de la liste complète
        this.reclamations = this.allReclamations.filter(item =>
            (item.Subject && item.Subject.toLowerCase().includes(searchTerm)) ||
            (item.Description && item.Description.toLowerCase().includes(searchTerm)) ||
            (item.Status && item.Status.toLowerCase().includes(searchTerm)) ||
            (item.CreatedDate && item.CreatedDate.toLowerCase().includes(searchTerm))
        );
    }

    this.currentPage = 1;
    this.totalPages = Math.ceil(this.reclamations.length / this.itemsPerPage);
    this.updatePageData();
}

formatDate(dateStr) {
    if (!dateStr) return '';
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false, 
        timeZone: 'Europe/Paris'
    };
    return new Intl.DateTimeFormat('fr-FR', options).format(new Date(dateStr));
}
get formattedCreatedDate() {
    return this.formatDate(this.selectedReclamation?.CreatedDate);
}

get formattedClosedDate() {
    return this.formatDate(this.selectedReclamation?.ClosedDate);
}
}