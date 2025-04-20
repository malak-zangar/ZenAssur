import { LightningElement, api , track} from 'lwc';
import updateQuoteStatusAndOpportunityDescription from '@salesforce/apex/QuoteService.updateQuoteStatusAndOpportunityDescription';
import quotePreviewImage from '@salesforce/resourceUrl/quote_preview_img';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';

export default class QuoteReviewActions extends LightningElement {
    @api opportunityId;
    selectedAction = '';
    showReasonField = false;
    actionType = ''; // 'refuse' ou 'revise'
    reason = '';
    disableButtons = false;
    image = quotePreviewImage;


    async handleAccept() {
        console.log("hey");
        const confirmed = await LightningConfirm.open({
            message: 'Êtes-vous sûr de vouloir accepter ce devis ?',
            variant: 'header',
            label: 'Confirmation',
        });
        console.log("hey1");

        if (confirmed) {
            this.disableButtons = true;
            this.selectedAction = 'accept';
            updateQuoteStatusAndOpportunityDescription({ opportunityId: this.opportunityId, quoteStatus: 'Accepted', reason: '' })
                .then(() => {
                    this.showToast('Succès', 'Votre devis a été accepté et le contrat est en cours de création.', 'success');
                    this.refreshTimeline();
                });
        }
    }

    handleAskRevision() {
        this.showReasonField = true;
        this.actionType = 'revise';
        this.selectedAction = 'revise';

    }

    handleRefuse() {
        this.showReasonField = true;
        this.actionType = 'refuse';
        this.selectedAction = 'refuse';

    }

    handleReasonChange(event) {
        this.reason = event.target.value;
    }

    submitReason() {
        if (!this.reason.trim()) return;

        const status = this.actionType === 'refuse' ? 'Rejected' : 'Needs Review';

        this.disableButtons = true;
        updateQuoteStatusAndOpportunityDescription({
            opportunityId: this.opportunityId,
            quoteStatus: status,
            reason: this.reason
        }).then(() => {
            this.showToast('Envoyé', 'Votre réponse a bien été prise en compte.', 'success');

            this.refreshTimeline();
        });
    }

    get isSubmitDisabled() {
        return !this.reason || this.reason.trim() === '';
    }

    refreshTimeline() {
        this.dispatchEvent(new CustomEvent('quoterefresh'));
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    get acceptButtonClass() {
        return this.selectedAction === 'accept' ? 'selected slds-m-right_small' : 'slds-m-right_small';
    }
    get reviseButtonClass() {
        return this.selectedAction === 'revise' ? 'selected slds-m-right_small' : 'slds-m-right_small';
    }

    get refuseButtonClass() {
        return this.selectedAction === 'refuse' ? 'selected slds-m-right_small' : 'slds-m-right_small';
    }    
    
}
