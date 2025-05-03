import { LightningElement, track, wire } from 'lwc';
import getAllReclamations from '@salesforce/apex/ReclamationController.getAllReclamations';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class ReclamationsList extends NavigationMixin(LightningElement) {
    wireResult;
    reclamations = [];
    currentPage = 1;
    itemsPerPage = 7;
    totalPages = 1;

    @track sortedBy;
    @track sortedDirection = 'asc';

    columns = [
        { label: 'Numéro', fieldName: 'CaseNumber',sortable: true },
        { label: 'Sujet', fieldName: 'Subject',sortable: true},
        { label: 'Date de réclamation', fieldName: 'CreatedDate',sortable: true,
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
        { label: 'Contact lié', fieldName: 'ContactName',sortable: true},
        { label: 'Statut', fieldName: 'Status', type: 'text', sortable: true,
            cellAttributes: {
                class: 'slds-text-align_center',
                style: { fieldName: 'statutColor' }
            }
        },  
        {
            type: "button", label: '', initialWidth: 75, typeAttributes: {
                name: 'View',
                title: 'Détails',
                disabled: false,
                value: 'view',
                iconName:'utility:preview',
                variant:'brand-outline'
            }
        },
        {
            type: "button", label: 'Actions',initialWidth: 75, typeAttributes: {
                name: 'Edit',
                title: 'Modifier',
                disabled: false,
                value: 'edit',
                iconName:'utility:edit',
                variant:'brand-outline'
            }
        },
        {
            type: "button", label: '',initialWidth: 75, typeAttributes: {
                name: 'Delete',
                title: 'Supprimer',
                disabled: false,
                value: 'delete',
                iconName:'utility:delete',
                variant:'destructive'
            }
        }
    ];

      @wire(getAllReclamations)
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

    async handleRowAction(event) {
        const recId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if (actionName === 'Edit') {
            this.handleAction(recId, 'edit');
        } else if (actionName === 'Delete') {
            this.handleDeleteRow(recId);
        } else if (actionName === 'View') {
            this.handleAction(recId, 'view');
        }
    }


    getStatusColor(status) {
        switch (status) {
            case 'Fermée-traitée':
                return 'color:rgb(87, 196, 24); border: 1px solid rgb(87, 196, 24); border-radius: 0.5rem; padding: 0.2rem 0.5rem; margin: 0.5rem;';
            case 'Fermée-non traitée':
                return 'color:rgb(226, 25, 25); border: 1px solid  rgb(226, 25, 25); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case  'En cours de traitement' :
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'Nouvelle' :
                return 'color:rgb(114, 124, 126); border: 1px solid rgb(114, 124, 126); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            default:
                return '';
            }
    }

    handleAction(recordId, mode) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Case',
                actionName: mode
            }
        });
    }

    
    handleDeleteRow(recordIdToDelete) {
        if (confirm('Etes-vous sur de vouloir supprimer cette réclamation?')) {
            deleteRecord(recordIdToDelete)
                .then(result => {
                    this.showToast('Succès', 'Réclamation supprimée avec succès!', 'success', 'dismissable');
                    handleRefreshPage();
                    return refreshApex(this.wireResult);
                }).catch(error => {
                    this.error = error;
                });
        }
    }

    handleCreateRecord() {
        // Navigate to the record creation page for the desired object
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Case',
                actionName: 'new'
            }
        });
    }


 // Pagination: mettre à jour les données pour la page actuelle
 updatePageData() {

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedReclamations = this.reclamations.slice(start, end).map(rec => {
        return {
            ...rec,
            statutColor: this.getStatusColor(rec.Status),
            //ContactName: rec.ContactId__r ? rec.ContactId__r.Name : ''  // créer un champ plat
            ContactName: rec.Contact ? rec.Contact.Name : ''

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
        (item.CaseNumber && item.CaseNumber.toString().toLowerCase().includes(searchTerm)) ||
        (item.Contact.Name && item.Contact.Name.toLowerCase().includes(searchTerm)) ||
        (item.Status && item.Status.toLowerCase().includes(searchTerm)) ||
        (item.Subject && item.Subject.toLowerCase().includes(searchTerm)) ||
        (item.CreatedDate && item.CreatedDate.toLowerCase().includes(searchTerm)) 
    );
}

this.currentPage = 1;
this.totalPages = Math.ceil(this.reclamations.length / this.itemsPerPage);
this.updatePageData();
}

    handleDownloadCSV() {
        const csvData = this.data.map(reclamation => ({
            'Nom': reclamation.Name,
            'Date demande': reclamation.Date_demande__c,
            'Status': reclamation.Status
        }));
 
        exportCSV(this.columns, csvData, 'reclamationsList');
    }

    /* downloadCSV() est une méthode asynchrone utilisée pour générer et télécharger le fichier CSV. */
    async downloadCSV() {
        const data = this.reclamations;
        if (!data || data.length === 0) {
            this.showToast('Error', 'No data to download', 'error');
            return;
        }
    
        const csvContent = this.convertArrayOfObjectsToCSV(data);
        this.downloadCSVFile(csvContent, 'reclamationsList.csv');
    }
    

    /* convertArrayOfObjectsToCSV(data) convertit les données des prospects en une chaîne CSV. */
    convertArrayOfObjectsToCSV(data) {
        const csvHeader = Object.keys(data[0]).join(',');
        const csvRows = data.map(row => Object.values(row).join(','));
        return csvHeader + '\n' + csvRows.join('\n');
    }

    /* downloadCSVFile(csvContent, fileName) télécharge le fichier CSV généré en utilisant l'élément <a> caché. */
    downloadCSVFile(csvContent, fileName) {
        const hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent);
        hiddenElement.setAttribute('download', fileName); // Use setAttribute to set the download attribute
        hiddenElement.style.display = 'none';
        document.body.appendChild(hiddenElement);
        hiddenElement.click();
        document.body.removeChild(hiddenElement);
    }

    /* Dashboard redirection */
    handleClickDashboard(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: 'https://talan104-dev-ed.develop.lightning.force.com/lightning/r/Dashboard/01ZWU000000IQg52AG/view?queryScope=userFolders'
            }
        });
 
    }

    showToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
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
}