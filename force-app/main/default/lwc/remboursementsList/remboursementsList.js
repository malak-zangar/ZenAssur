import { LightningElement, track, wire } from 'lwc';
import getAllRemboursements from '@salesforce/apex/RemboursementController.getAllRemboursements';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class RemboursementsList extends NavigationMixin(LightningElement) {
    wireResult;
    remboursements = [];
    currentPage = 1;
    itemsPerPage = 7;
    totalPages = 1;

    @track sortedBy;
    @track sortedDirection = 'asc';

    columns = [
        { label: 'Nom', fieldName: 'Name',sortable: true },
        { label: 'Date de demande', fieldName: 'Date_demande__c',sortable: true},
        { label: 'Contact lié', fieldName: 'ContactName',sortable: true},

    {
    label: 'Score de fraude',
    fieldName: 'ScoreFraude__c',
    sortable: true,
   cellAttributes: {
        style: { fieldName: 'scoreColor' }
    }
}
,
    
    { label: 'Statut', fieldName: 'Statut__c', type: 'text', sortable: true,
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

      @wire(getAllRemboursements)
    wiredData(result) {
        this.wiredResult = result; // <--- on stocke
        const { data, error } = result;
        if (data) {
            console.log(data);
            this.allRemboursements = data;
            this.remboursements = this.allRemboursements; // copie pour affichage
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
            case 'Validé remboursé':
                return 'color:rgb(87, 196, 24); border: 1px solid rgb(87, 196, 24); border-radius: 0.5rem; padding: 0.2rem 0.5rem; margin: 0.5rem;';
            case 'Refusé non remboursé':
                return 'color:rgb(226, 25, 25); border: 1px solid  rgb(226, 25, 25); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case  'En cours de traitement' :
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'En attente' :
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
                objectApiName: 'Remboursement__c',
                actionName: mode
            }
        });
    }

    
    handleDeleteRow(recordIdToDelete) {
        if (confirm('Etes-vous sur de vouloir supprimer ce remboursement?')) {
            deleteRecord(recordIdToDelete)
                .then(result => {
                    this.showToast('Succès', 'Remboursement supprimé avec succès!', 'success', 'dismissable');
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
                objectApiName: 'Remboursement__c',
                actionName: 'new'
            }
        });
    }

 getScoreVisual(score) {
    const level = Math.floor(score / 10);
    return '█'.repeat(level) + '░'.repeat(10 - level) + ` ${score}%`;
}

 // Pagination: mettre à jour les données pour la page actuelle
 updatePageData() {

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedRemboursements = this.remboursements.slice(start, end).map(rec => {
         let scoreColor = 'color: rgb(87, 196, 24);'; // vert

if (rec.ScoreFraude__c >= 70) {
    scoreColor = 'color: rgb(226, 25, 25);'; // rouge
} else if (rec.ScoreFraude__c >= 40) {
    scoreColor = 'color: rgb(241, 174, 28);'; // orange
}

        return {
            ...rec,
        scoreColor: scoreColor,
                    ScoreFraude__c: this.getScoreVisual(rec.ScoreFraude__c),
            statutColor: this.getStatusColor(rec.Statut__c),
            ContactName: rec.Contact__r ? rec.Contact__r.Name : ''  // créer un champ plat

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

const cloneData = [...this.remboursements];

cloneData.sort((a, b) => {
    let valA = a[fieldName];
    let valB = b[fieldName];

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
    this.remboursements = [...this.allRemboursements];
} else {
    // Sinon, filtrer à partir de la liste complète
    this.remboursements = this.allRemboursements.filter(item =>
        (item.Name && item.Name.toLowerCase().includes(searchTerm)) ||
        (item.Contact__r.Name && item.Contact__r.Name.toLowerCase().includes(searchTerm)) ||
        (item.Statut__c && item.Statut__c.toLowerCase().includes(searchTerm)) ||
        (item.Date_demande__c && item.Date_demande__c.toLowerCase().includes(searchTerm)) 
    );
}

this.currentPage = 1;
this.totalPages = Math.ceil(this.remboursements.length / this.itemsPerPage);
this.updatePageData();
}

    handleDownloadCSV() {
        const csvData = this.data.map(remboursement => ({
            'Nom': remboursement.Name,
            'Date demande': remboursement.Date_demande__c,
            'Status': remboursement.Statut__c
        }));
 
        exportCSV(this.columns, csvData, 'remboursementsList');
    }

    /* downloadCSV() est une méthode asynchrone utilisée pour générer et télécharger le fichier CSV. */
    async downloadCSV() {
        const data = this.remboursements;
        if (!data || data.length === 0) {
            this.showToast('Error', 'No data to download', 'error');
            return;
        }
    
        const csvContent = this.convertArrayOfObjectsToCSV(data);
        this.downloadCSVFile(csvContent, 'remboursementsList.csv');
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

}