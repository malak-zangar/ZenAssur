import { LightningElement, api } from 'lwc';
import closedlost from '@salesforce/resourceUrl/closedlost';

export default class ClosedLostInfo extends LightningElement {
    @api isQuoteRejected = false;
    @api opportunityReason = '';
    image=closedlost;
}
