import { LightningElement, api, wire } from 'lwc';
import getRemboursement from '@salesforce/apex/RemboursementFraudeService.getRemboursement';

export default class FraudeScoreDisplay extends LightningElement {
    @api recordId;

    remboursement;
    error;

    get score() {
        return this.remboursement?.ScoreFraude__c || 0;
    }

    get progressColor() {
        if (this.score < 40) return '#21cc2e'; // vert
        if (this.score < 70) return '#F39C12'; // orange
        return '#dd1d1d'; // rouge
    }

get formattedFraudReasons() {
    if (this.remboursement?.FraudReason__c) {
        return this.remboursement.FraudReason__c
            .split(/\s*-\s*(?!\d)/) // évite les - devant un chiffre
            .map(reason => {
                const trimmed = reason.trim();
                const match = trimmed.match(/\(impact\s*:\s*([-+]?\d*\.?\d+)\)/i);
                let impactValue = 0;
                if (match) {
                    impactValue = parseFloat(match[1]);
                }

                return {
                    text: trimmed,
                    impact: impactValue,
                    colorClass: impactValue >= 0 ? 'impact-red' : 'impact-green'
                };
            })
            .filter(reason => reason.text.length > 0);
    }
    return [];
}




    get circumference() {
        return 2 * Math.PI * 45;
    }

    get strokeDashoffset() {
        return this.circumference - (this.score / 100) * this.circumference;
    }

    @wire(getRemboursement, { remboursementId: '$recordId' })
    wiredRemboursement({ data, error }) {
        if (data) {
            this.remboursement = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.remboursement = undefined;
        }
    }
}
