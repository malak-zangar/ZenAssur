import { LightningElement, track, wire } from 'lwc';
import getLeads from '@salesforce/apex/LeadController.getLeads';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class LeadsList extends NavigationMixin(LightningElement) {
    wireResult;
    leads = [];
    currentPage = 1;
    itemsPerPage = 7;
    totalPages = 1;
    @track showNoResults = false;
    @track isEnCours = true;
    @track isArchives = false;
    @track sortedBy;
    @track sortedDirection = 'asc';

    columns = [
        { label: 'Nom', fieldName: 'Name',sortable: true },
        { label: 'Entreprise', fieldName: 'Company',sortable: true },
        { label: 'Téléphone', fieldName: 'Phone',sortable: true},
        { label: 'Email', fieldName: 'Email',sortable: true},
        { label: 'Statut', fieldName: 'Status', type: 'text', sortable: true,
            cellAttributes: {
                class: 'slds-text-align_center',
                style: { fieldName: 'statutColor' }
            }
        },  
        {
            type: "button", label: '', initialWidth: 75, typeAttributes: {
             //   label: 'Détails',
                name: 'View',
                title: 'Détails',
                disabled: false,
                value: 'view',
           //     iconPosition: 'left',
                iconName:'utility:preview',
                variant:'brand-outline'
            }
        },
        {
            type: "button", label: 'Actions',initialWidth: 75, typeAttributes: {
            //    label: 'Modifier',
                name: 'Edit',
                title: 'Modifier',
                disabled: false,
                value: 'edit',
              //  iconPosition: 'left',
                iconName:'utility:edit',
                variant:'brand-outline'
            }
        },
        {
            type: "button", label: '',initialWidth: 75, typeAttributes: {
              //  label: 'Supprimer',
                name: 'Delete',
                title: 'Supprimer',
                disabled: false,
                value: 'delete',
              //  iconPosition: 'left',
                iconName:'utility:delete',
                variant:'destructive'
            }
        }
    ];

   /* @wire(getLeads)
    wiredLeads(result) {
        this.wireResult = result;
        if (result.data) {
            this.data = result.data;
            //this.filterData(); // Call filter method after data is loaded
        } else if (result.error) {
            this.error = result.error;
        }
    }*/
showPending() {
    this.filteredLeads = this.allLeads.filter(r => 
        r.Status != 'Closed - Converted' && r.Status != 'Closed - Not converted'
    );
        this.leads = [...this.filteredLeads]; // utilisée dans la recherche

    this.currentPage = 1;
    this.totalPages = Math.ceil(this.leads.length / this.itemsPerPage);

    this.updatePageData();

        this.isEnCours = true;
        this.isArchives = false;
}

showProcessed() {
    this.filteredLeads = this.allLeads.filter(r => 
        r.Status === 'Closed - Converted' || r.Status === 'Closed - Not converted'
    );
            this.leads = [...this.filteredLeads]; // utilisée dans la recherche

    this.currentPage = 1;
    this.totalPages = Math.ceil(this.leads.length / this.itemsPerPage);
    this.isEnCours = false;
    this.isArchives = true;
    this.updatePageData();
}
      @wire(getLeads)
    wiredData(result) {
        this.wiredResult = result; // <--- on stocke
        const { data, error } = result;
        if (data) {
            console.log(data);
            this.allLeads = data;
            this.leads = this.allLeads; // copie pour affichage
            this.showPending(); // affichage par défaut
            this.totalPages = Math.ceil(this.leads.length / this.itemsPerPage);
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
            case 'Closed - Converted':
                return 'color:rgb(87, 196, 24); border: 1px solid rgb(87, 196, 24); border-radius: 0.5rem; padding: 0.2rem 0.5rem; margin: 0.5rem;';
            case 'Closed - Not Converted':
                return 'color:rgb(226, 25, 25); border: 1px solid  rgb(226, 25, 25); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'Working - Contacted':
                return 'color:rgb(241, 174, 28); border: 1px solid rgb(241, 174, 28); border-radius: 0.5rem; padding: 0.2rem 0.5rem;';
            case 'Open - Not Contacted' :
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
                objectApiName: 'Lead',
                actionName: mode
            }
        });
    }

    
    handleDeleteRow(recordIdToDelete) {
        if (confirm('Etes-vous sur de vouloir supprimer cette piste?')) {
            deleteRecord(recordIdToDelete)
                .then(result => {
                    this.showToast('Succès', 'Piste supprimée avec succès!', 'success', 'dismissable');
                    handleRefreshPage();
                    return refreshApex(this.wireResult);
                }).catch(error => {
                    this.error = error;
                });
        }
    }

    //Create new Lead
    handleCreateRecord() {
        // Navigate to the record creation page for the desired object
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Lead',
                actionName: 'new'
            }
        });
    }


 // Pagination: mettre à jour les données pour la page actuelle
 updatePageData() {

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedLeads = this.leads.slice(start, end).map(rec => {
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

const cloneData = [...this.leads];

cloneData.sort((a, b) => {
    let valA = a[fieldName];
    let valB = b[fieldName];

    return sortDirection === 'asc'
        ? (valA > valB ? 1 : valA < valB ? -1 : 0)
        : (valA < valB ? 1 : valA > valB ? -1 : 0);
});

this.leads = cloneData;
this.updatePageData(); // Important !
}

handleSearch(event) {
const searchTerm = event.target.value.toLowerCase();

if (!searchTerm) {
    // Si la barre de recherche est vide → réinitialiser la liste
    this.leads = [...this.filteredLeads];
} else {
    // Sinon, filtrer à partir de la liste complète
    this.leads = this.filteredLeads.filter(item =>
        (item.Name && item.Name.toLowerCase().includes(searchTerm)) ||
        (item.Company && item.Company.toLowerCase().includes(searchTerm)) ||
        (item.Status && item.Status.toLowerCase().includes(searchTerm)) ||
        (item.Phone && item.Phone.toLowerCase().includes(searchTerm)) ||
        (item.Email && item.Email.toLowerCase().includes(searchTerm))
    );
}

this.currentPage = 1;
this.totalPages = Math.ceil(this.leads.length / this.itemsPerPage);
this.updatePageData();
}

    handleDownloadCSV() {
        const csvData = this.data.map(lead => ({
            'Lead Name': lead.Name,
            'Phone': lead.Phone,
            'Email': lead.Email
        }));
 
        exportCSV(this.columns, csvData, 'LeadList');
    }

    /* downloadCSV() est une méthode asynchrone utilisée pour générer et télécharger le fichier CSV. */
    async downloadCSV() {
        const data = this.leads;
        if (!data || data.length === 0) {
            this.showToast('Error', 'No data to download', 'error');
            return;
        }
    
        const csvContent = this.convertArrayOfObjectsToCSV(data);
        this.downloadCSVFile(csvContent, 'LeadsList.csv');
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
                url: 'https://creative-impala-eeikd9-dev-ed.trailblaze.lightning.force.com/lightning/r/Dashboard/01Zd2000001tWGPEA2/view?queryScope=userFolders'
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