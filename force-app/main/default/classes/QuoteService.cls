public with sharing class QuoteService { 
    
    @AuraEnabled
    public static void updateQuoteStatusAndOpportunityDescription(Id opportunityId, String quoteStatus, String reason) {
        // Récupérer le dernier devis lié à l'opportunité
        List<Quote> quotes = [SELECT Id, Status FROM Quote WHERE OpportunityId = :opportunityId ORDER BY CreatedDate DESC LIMIT 1];
        if (quotes.isEmpty()) return;

        Quote q = quotes[0];
        q.Status = quoteStatus;

        // Mettre à jour l'opportunité
        Opportunity opp = [SELECT Id, Description FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        if (!String.isBlank(reason)) {
            opp.Description = reason;
        }

// Mise à jour du stage en fonction du statut du devis
    if (quoteStatus == 'Accepted') {
        opp.StageName = 'Preparing contract';
    } else if (quoteStatus == 'Rejected') {
        opp.StageName = 'Closed Lost';
        if (!String.isBlank(reason)) {
            opp.Description = 'Devis refusé : '+ reason;
        }
    } else if (quoteStatus == 'Needs Review') {
        opp.StageName = 'Negotiation/Review';
        if (!String.isBlank(reason)) {
            opp.Description = 'Devis nécessite révision : '+ reason;
        }
    }
        update q;
        update opp;
    }
}
