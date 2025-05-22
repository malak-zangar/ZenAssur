import { LightningElement , wire} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import USER_ID from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = ['User.FirstName', 'User.LastName'];
export default class HomeDashboards extends NavigationMixin(LightningElement){

 userId = USER_ID;
    firstName;
    lastName;

    @wire(getRecord, { recordId: '$userId', fields: FIELDS })
    wiredUser({ error, data }) {
        if (data) {
            this.firstName = data.fields.FirstName.value;
            this.lastName = data.fields.LastName.value;
        } else if (error) {
            console.error('Erreur lors de la récupération de l’utilisateur : ', error);
        }
    }

     get fullGreeting() {
        return `${this.firstName ?? ''} ${this.lastName ?? ''}`;
    }

   handleClickDashboardLeads(){
    this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
        attributes: {
                url: 'https://creative-impala-eeikd9-dev-ed.trailblaze.lightning.force.com/lightning/r/Dashboard/01Zd2000001tWGPEA2/view?queryScope=userFolders'
        }
    });

    }

    handleClickDashboardOpportuinities(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: 'https://creative-impala-eeikd9-dev-ed.trailblaze.lightning.force.com/lightning/r/Dashboard/01Zd2000001tWGPEA2/view?queryScope=userFolders'
            }
        });
 
    }

    handleClickDashboardClaims(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: 'https://creative-impala-eeikd9-dev-ed.trailblaze.lightning.force.com/lightning/r/Dashboard/01Zd2000001u8LhEAI/view?queryScope=userFolders'
            }
        });
 
    }

        handleClickDashboardReimbursements(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url:  'https://creative-impala-eeikd9-dev-ed.trailblaze.lightning.force.com/lightning/r/Dashboard/01Zd2000001tuc5EAA/view?queryScope=userFolders'
            }
        });
 
    }
}