import { LightningElement, track, wire } from 'lwc';
import getOpportunityForUser from '@salesforce/apex/OpportunityTimelineController.getOpportunityForUser';
import getOpportunityStages from '@salesforce/apex/OpportunityStageService.getOpportunityStages';
import getCurrentStage from '@salesforce/apex/OpportunityStageService.getCurrentStage';

export default class OpportunityTimeline extends LightningElement {
    @track currentStage;
    @track styledStages = [];
    rawStages = [];
    opportunityId;

    iconsMap = {
        'Prospecting': '📩',
        'Qualification': '🔎',
        'Proposal/Price Quote': '💰',
        'Negotiation/Review': '🔁',
        'Preparing contract': '🤝',
        'Closed Won': '✅',
        'Closed Lost': '❌'
    };

    descriptionsMap = {
        "Prospecting": "Nous avons reçu votre demande. En attente de documents.",
        "Qualification": "Vos documents sont en cours de vérification.",
        "Proposal/Price Quote": "Un devis est généré pour vous.",
        "Negotiation/Review": "Vous avez demandé une modification du devis.",
        "Preparing contract": "Contrat en cours de préparation.",
        "Closed Won": "Votre contrat est signé. Bienvenue !",
        "Closed Lost": "Votre souscription a été annulée ou non finalisée."
    };

    @wire(getOpportunityForUser)
    wiredOpportunity({ data, error }) {
        if (data) {
            this.opportunityId = data.Id;
            getCurrentStage({ opportunityId: this.opportunityId })
                .then(stage => {
                    this.currentStage = stage;
                    this.updateStyledStages();
                });
        }
    }

    @wire(getOpportunityStages)
    wiredStages({ data }) {
        if (data) {
            this.rawStages = data;
            this.updateStyledStages();
        }
    }

    labelsMap = {
        'Prospecting': 'Demande envoyée',
        'Qualification': 'Documents envoyés',
        'Proposal/Price Quote': 'Devis recu',
        'Negotiation/Review': 'En négociation',
        'Preparing contract': 'Préparation du contrat',
        'Closed Won': 'Souscription finalisée',
        'Closed Lost': 'Souscription annulée'
    };
    
    updateStyledStages() {
        if (!this.rawStages || !this.currentStage) return;
    
        let passed = true;
        this.styledStages = [];
    
        for (let stage of this.rawStages) {
            if (stage.value === 'Closed Won' || stage.value === 'Closed Lost') {
                continue; // On ignore ces deux étapes ici
            }
    
            let statusClass = 'pending';
            if (stage.value === this.currentStage) {
                statusClass = 'current';
                passed = false;
            } else if (passed) {
                statusClass = 'complete';
            }
    
            const labelMap = {
                'Prospecting': 'Demande',
                'Qualification': 'Documents',
                'Proposal/Price Quote': 'Devis',
                'Negotiation/Review': 'Négociation',
                'Preparing contract': 'Contrat',
            };
    
            this.styledStages.push({
                ...stage,
                icon: this.iconsMap[stage.value] || '❓',
                description: this.descriptionsMap[stage.value] || '',
                status: statusClass,
                classList: `timeline-step ${statusClass}`,
                label: labelMap[stage.value] || stage.label
            });
        }
    
        // ➕ On ajoute l'étape "Finalisation" à la fin
        const finalStep = this.getFinalStepDisplay();
        this.styledStages.push(finalStep);
    }
    
   /* updateStyledStages() {
        if (!this.rawStages || !this.currentStage) return;
    
        let passed = true;
        this.styledStages = this.rawStages.map(stage => {
            let statusClass = 'pending';
            if (stage.value === this.currentStage) {
                statusClass = 'current';
                passed = false;
            } else if (passed) {
                statusClass = 'complete';
            }
    
            return {
                ...stage,
                icon: this.iconsMap[stage.value] || '❓',
                description: this.descriptionsMap[stage.value] || '',
                status: statusClass,
                label: this.labelsMap[stage.value] || stage.label, // ✅ label traduit ici
                classList: `timeline-step ${statusClass}` // ✅ utilisé dans le HTML
            };
        });
    }*/
    
    getFinalStepDisplay() {
        if (this.currentStage === 'Closed Won') {
            return {
                value: 'Finalisation',
                icon: '✅',
                label: 'Finalisation',
                description: "Votre contrat est signé. Bienvenue !",
                status: 'current',
                classList: 'timeline-step current'
            };
        } else if (this.currentStage === 'Closed Lost') {
            return {
                value: 'Finalisation',
                icon: '❌',
                label: 'Finalisation',
                description: "Votre souscription n'a pas été finalisée ou est annulée.",
                status: 'current',
                classList: 'timeline-step current'
            };
        } else {
            return {
                value: 'Finalisation',
                icon: '⏳',
                label: 'Finalisation',
                description: 'En attente de finalisation.',
                status: 'pending',
                classList: 'timeline-step pending'
            };
        }
    }

    
    get isProspecting() {
        return this.currentStage === 'Prospecting';
    }
    get isQualification() {
        return this.currentStage === 'Qualification';
    }
    get isProposal() {
        return this.currentStage === 'Proposal/Price Quote';
    }
    get isNegotiation() {
        return this.currentStage === 'Negotiation/Review';
    }
    get isContract() {
        return this.currentStage === 'Preparing contract';
    }
    get isFinalisation() {
        return this.currentStage === 'Closed Won' || this.currentStage === 'Closed Lost';
    }
    get isClosedWon() {
        return this.currentStage === 'Closed Won';
    }
    get isClosedLost() {
        return this.currentStage === 'Closed Lost';
    }
    
    handleStageChanged() {
        console.log('Événement reçu : mise à jour des données');
        // ⚡ Recharge la currentStage depuis Apex

                this.currentStage = "Qualification";
                console.log(this.currentStage);
                this.updateStyledStages(); // Met à jour l'affichage de la timeline
       
    }
    

}
