import { LightningElement, track, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class AccountsList extends NavigationMixin(LightningElement) {
    wireResult;
    accounts = [];
    currentPage = 1;
    itemsPerPage = 7;
    totalPages = 1;

    @track sortedBy;
    @track sortedDirection = 'asc';

    columns = [
        { label: 'Nom', fieldName: 'Name',sortable: true },
        { label: 'Téléphone', fieldName: 'Phone',sortable: true},
        { label: 'Industrie', fieldName: 'Industry',sortable: true },
        {
            type: "button", label: '', initialWidth: 75, typeAttributes: {
                name: 'View',
                title: 'Voir',
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

    @wire(getAccounts)
    wiredData(result) {
        this.wiredResult = result; // <--- on stocke
        const { data, error } = result;
        if (data) {
            console.log(data);
            this.allAccounts = data;
            this.accounts = this.allAccounts; // copie pour affichage
            this.totalPages = Math.ceil(this.accounts.length / this.itemsPerPage);
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

    handleAction(recordId, mode) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Account',
                actionName: mode
            }
        });
    }

    
    handleDeleteRow(recordIdToDelete) {
        if (confirm('Etes-vous sur de vouloir supprimer ce compte?')) {
            deleteRecord(recordIdToDelete)
                .then(result => {
                    this.showToast('Succès', 'Compte supprimé avec succès!', 'success', 'dismissable');
                    handleRefreshPage();
                    return refreshApex(this.wireResult);
                }).catch(error => {
                    this.error = error;
                });
        }
    }

 
    updateContactHandler(event){
        this.visibleDatas=[...event.detail.records];
        console.log(event.detail.records);
    }

    handleCreateRecord() {
        // Navigate to the record creation page for the desired object
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Account',
                actionName: 'new'
            }
        });
    }


 // Pagination: mettre à jour les données pour la page actuelle
 updatePageData() {

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedAccounts = this.accounts.slice(start, end).map(rec => {
        return {
            ...rec,
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

const cloneData = [...this.accounts];

cloneData.sort((a, b) => {
    let valA = a[fieldName];
    let valB = b[fieldName];

    return sortDirection === 'asc'
        ? (valA > valB ? 1 : valA < valB ? -1 : 0)
        : (valA < valB ? 1 : valA > valB ? -1 : 0);
});

this.accounts = cloneData;
this.updatePageData(); // Important !
}

handleSearch(event) {
const searchTerm = event.target.value.toLowerCase();

if (!searchTerm) {
    // Si la barre de recherche est vide → réinitialiser la liste
    this.accounts = [...this.allAccounts];
} else {
    // Sinon, filtrer à partir de la liste complète
    this.accounts = this.allAccounts.filter(item =>
        (item.Name && item.Name.toLowerCase().includes(searchTerm)) ||
        (item.Industry && item.Industry.toLowerCase().includes(searchTerm)) ||
        (item.Phone && item.Phone.toString().includes(searchTerm)) 
    );
}

this.currentPage = 1;
this.totalPages = Math.ceil(this.accounts.length / this.itemsPerPage);
this.updatePageData();
}

    handleDownloadCSV() {
        const csvData = this.data.map(account => ({
            'Name': account.Name,
            'Industry': account.Industry,
            'Phone': account.Phone
        }));
 
        exportCSV(this.columns, csvData, 'AccountList');
    }

    /* downloadCSV() est une méthode asynchrone utilisée pour générer et télécharger le fichier CSV. */
    async downloadCSV() {
        const data = this.accounts;
        if (!data || data.length === 0) {
            this.showToast('Error', 'No data to download', 'error');
            return;
        }
    
        const csvContent = this.convertArrayOfObjectsToCSV(data);
        this.downloadCSVFile(csvContent, 'accountsList.csv');
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