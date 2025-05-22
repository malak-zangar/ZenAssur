import { LightningElement, track, wire } from 'lwc';
import getQuotes from '@salesforce/apex/QuoteService.getQuotes';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class QuotesList extends NavigationMixin(LightningElement) {
    wireResult;
    quotes = [];
    currentPage = 1;
    itemsPerPage = 7;
    totalPages = 1;

    @track sortedBy;
    @track sortedDirection = 'asc';

    columns = [
        { label: 'Nom', fieldName: 'Name',sortable: true },
        { label: 'Compte lié', fieldName: 'AccountName',sortable: true },
       // { label: 'Prix total (DT)', fieldName: 'TotalPrice_formatted',sortable: true},
       {
        label: 'Prix total (DT)',
        fieldName: 'TotalPrice',
        type: 'currency',
        typeAttributes: { currencyCode: 'TND', minimumFractionDigits: 3 },
        sortable: true
    },
    
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

      @wire(getQuotes)
    wiredData(result) {
        this.wiredResult = result; // <--- on stocke
        const { data, error } = result;
        if (data) {
            console.log(data);
            this.allQuotes = data;
            this.quotes = this.allQuotes; // copie pour affichage
            this.totalPages = Math.ceil(this.quotes.length / this.itemsPerPage);
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
            case 'Accepted':
                return 'color:rgb(87, 196, 24); border: 1px solid rgb(87, 196, 24); border-radius: 0.5rem; padding: 0.2rem 0.5rem; margin: 0.5rem;';
            case 'Rejected':
                return 'color:rgb(226, 25, 25); border: 1px solid  rgb(226, 25, 25); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'In Review':
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'Needs Review':
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'Draft' :
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
                objectApiName: 'Quote',
                actionName: mode
            }
        });
    }

    
    handleDeleteRow(recordIdToDelete) {
        if (confirm('Etes-vous sur de vouloir supprimer ce devis?')) {
            deleteRecord(recordIdToDelete)
                .then(result => {
                    this.showToast('Succès', 'Devis supprimé avec succès!', 'success', 'dismissable');
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
                objectApiName: 'Quote',
                actionName: 'new'
            }
        });
    }


 // Pagination: mettre à jour les données pour la page actuelle
 updatePageData() {

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedQuotes = this.quotes.slice(start, end).map(rec => {
        return {
            ...rec,
            statutColor: this.getStatusColor(rec.Status),
            AccountName: rec.Account ? rec.Account.Name : '',
            TotalPrice_formatted: this.formatNumber(rec.TotalPrice)

        };
    });
}

formatNumber(value) {
    if (value == null) return '';
    return Number(value).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
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

const cloneData = [...this.quotes];

cloneData.sort((a, b) => {
    let valA = a[fieldName];
    let valB = b[fieldName];

    return sortDirection === 'asc'
        ? (valA > valB ? 1 : valA < valB ? -1 : 0)
        : (valA < valB ? 1 : valA > valB ? -1 : 0);
});

this.quotes = cloneData;
this.updatePageData(); // Important !
}

handleSearch(event) {
const searchTerm = event.target.value.toLowerCase();

if (!searchTerm) {
    // Si la barre de recherche est vide → réinitialiser la liste
    this.quotes = [...this.allQuotes];
} else {
    // Sinon, filtrer à partir de la liste complète
    this.quotes = this.allQuotes.filter(item =>
        (item.Name && item.Name.toLowerCase().includes(searchTerm)) ||
        (item.AccountName && item.AccountName.toLowerCase().includes(searchTerm)) ||
        (item.Account.Name && item.Account.Name.toLowerCase().includes(searchTerm)) ||
        (item.Status && item.Status.toLowerCase().includes(searchTerm)) ||
        (item.QuoteNumber && item.QuoteNumber.toString().toLowerCase().includes(searchTerm)) ||
        (item.TotalPrice && item.TotalPrice.toString().toLowerCase().includes(searchTerm))
    );
}

this.currentPage = 1;
this.totalPages = Math.ceil(this.quotes.length / this.itemsPerPage);
this.updatePageData();
}

    handleDownloadCSV() {
        const csvData = this.data.map(quote => ({
            'quote Name': quote.Name,
            'Prix total': quote.TotalPrice,
            'Status': quote.Status
        }));
 
        exportCSV(this.columns, csvData, 'quotesList');
    }

    /* downloadCSV() est une méthode asynchrone utilisée pour générer et télécharger le fichier CSV. */
    async downloadCSV() {
        const data = this.quotes;
        if (!data || data.length === 0) {
            this.showToast('Error', 'No data to download', 'error');
            return;
        }
    
        const csvContent = this.convertArrayOfObjectsToCSV(data);
        this.downloadCSVFile(csvContent, 'quotesList.csv');
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