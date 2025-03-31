import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class AboutUsPage extends NavigationMixin(LightningElement) {

    handleSubscribe() {
        // Rediriger vers la page des offres d'assurance
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/nos-offres'
            }
        });
    }
}
