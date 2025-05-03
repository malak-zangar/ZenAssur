public with sharing class RemboursementController {

    public class RemboursementData {
        @AuraEnabled public List<Remboursement__c> remboursements;
        @AuraEnabled public Decimal reimbursementCap;
        @AuraEnabled public Decimal soldeRestant;
    }

    @AuraEnabled
    public static void deleteContentDocumentLink(Id contentDocumentId) {    
    List<ContentDocumentLink> anciensLiens = [
        SELECT Id FROM ContentDocumentLink 
        WHERE ContentDocumentId = :contentDocumentId 
        AND LinkedEntityId IN (SELECT Id FROM Contact)
     ];
    try {
        delete anciensLiens;
     } catch (Exception e) {
        System.debug('Erreur suppression anciens liens : ' + e.getMessage());
        throw new AuraHandledException('Erreur suppression anciens liens : ' + e.getMessage());
    }
    }

    @AuraEnabled
    public static String getJustificatifDownloadUrl(Id remboursementId) {
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId 
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :remboursementId
            LIMIT 1
        ];
    
        if (links.isEmpty()) {
            throw new AuraHandledException('Aucun justificatif trouvé pour ce remboursement.');
        }
    
        List<ContentVersion> versions = [
            SELECT Id 
            FROM ContentVersion 
            WHERE ContentDocumentId = :links[0].ContentDocumentId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
    
        if (!versions.isEmpty()) {
      //     return '/sfc/servlet.shepherd/version/download/' + versions[0].Id;
            return '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=' + versions[0].Id;

        }
    
        throw new AuraHandledException('Version de fichier introuvable.');
    }
    

    @AuraEnabled
    public static void attacherFichierRemboursement(Id remboursementId, Id contentDocumentId) {
        // Supprimer les anciens liens avec un Contact
        List<ContentDocumentLink> anciensLiens = [
            SELECT Id 
            FROM ContentDocumentLink 
            WHERE ContentDocumentId = :contentDocumentId 
            AND LinkedEntityId IN (SELECT Id FROM Contact)
        ];
        try {
            delete anciensLiens;
        } catch (Exception e) {
            System.debug('Erreur suppression anciens liens : ' + e.getMessage());
            throw new AuraHandledException('Erreur suppression anciens liens : ' + e.getMessage());
        }
            
        // Créer un nouveau lien avec le remboursement
        ContentDocumentLink link = new ContentDocumentLink();
        link.ContentDocumentId = contentDocumentId;
        link.LinkedEntityId = remboursementId;
        link.ShareType = 'V';
        link.Visibility = 'AllUsers';
        insert link;
    }
    
    
    @AuraEnabled
public static Id getContactIdForUser() {
    User u = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()];
    if (u.ContactId == null) throw new AuraHandledException('Aucun contact lié');
    return u.ContactId;
}

    @AuraEnabled
    public static Id creerRemboursement(Decimal montant, String typeSoins, Date dateSoins) {
        User currentUser = [SELECT Id, ContactId FROM User WHERE Id = :UserInfo.getUserId()];
        if (currentUser.ContactId == null) {
            throw new AuraHandledException('Utilisateur non lié à un contact.');
        }
    
        Contact contact = [SELECT Id, FirstName, LastName FROM Contact WHERE Id = :currentUser.ContactId];
        Integer count = [SELECT COUNT() FROM Remboursement__c WHERE Contact__c = :contact.Id];
        String uid = String.valueOf(Crypto.getRandomInteger()).substring(0,5);
        
        Remboursement__c remboursement = new Remboursement__c();
        remboursement.Contact__c = contact.Id;
        remboursement.Date_demande__c = Date.today();
        remboursement.Date_des_soins__c = dateSoins;
        remboursement.Montant_demande__c = montant;
       // remboursement.Montant_rembourse__c = 0;
        remboursement.Type_de_soins__c = typeSoins;
        remboursement.Statut__c = 'En attente';
        remboursement.Name = 'Remb-' + contact.FirstName.substring(0,2) + '-' + contact.LastName.substring(0,2) + ' #' + uid;
    
        insert remboursement;
        return remboursement.Id;
    }
    
    @AuraEnabled(cacheable=true)
    public static Product2 getProduct() {
          // 1. Récupérer le contact lié à l'utilisateur connecté
        User currentUser = [SELECT Id, ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
    
        if (currentUser.ContactId == null) {
            throw new AuraHandledException('Aucun contact lié à cet utilisateur.');
        }

        Contact contact = [SELECT Id, AccountId FROM Contact WHERE Id = :currentUser.ContactId];

        // 2. Trouver la dernière opportunité du compte (ex : la dernière Closed Won)
        Opportunity opp = [
            SELECT Id FROM Opportunity 
            WHERE AccountId = :contact.AccountId 
            AND StageName = 'Closed Won'
            ORDER BY CloseDate DESC
            LIMIT 1
        ];

        // 3. Récupérer le produit lié via OpportunityLineItem
        OpportunityLineItem oli = [
            SELECT Product2.Id, Product2.Name, Product2.ProductCode,Product2.Description, Product2.Price__c, Product2.Coverage_Duration__c, 
            Product2.Reimbursement_Cap__c, Product2.Reimbursement_Percentage__c, 
            Product2.Deductible__c, Product2.Dental_and_Optical_Coverage__c, 
            Product2.Hospitalization_Coverage__c, Product2.Image_URL__c,Product2.Exclusions__c,Product2.Main_Benefits__c
            FROM OpportunityLineItem
            WHERE OpportunityId = :opp.Id
            LIMIT 1
        ];
    
        return oli.Product2;

    }


    @AuraEnabled(cacheable=true)
    public static RemboursementData getRemboursementsEtSolde() {
          // 1. Récupérer le contact lié à l'utilisateur connecté
    User currentUser = [SELECT Id, ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
    
    if (currentUser.ContactId == null) {
        throw new AuraHandledException('Aucun contact lié à cet utilisateur.');
    }

    Contact contact = [SELECT Id, AccountId FROM Contact WHERE Id = :currentUser.ContactId];

        // 2. Trouver la dernière opportunité du compte (ex : la dernière Closed Won)
        Opportunity opp = [
            SELECT Id FROM Opportunity 
            WHERE AccountId = :contact.AccountId 
            AND StageName = 'Closed Won'
            ORDER BY CloseDate DESC
            LIMIT 1
        ];

        // 3. Récupérer le produit lié via OpportunityLineItem
        OpportunityLineItem oli = [
            SELECT Id, Product2.Reimbursement_Cap__c
            FROM OpportunityLineItem
            WHERE OpportunityId = :opp.Id
            LIMIT 1
        ];

        Decimal cap = oli.Product2.Reimbursement_Cap__c;

        // 4. Récupérer les remboursements liés au contact
        List<Remboursement__c> remboursements = [
            SELECT Id,Name,Statut__c,Date_de_finalisation__c,Cause_de_refus__c, Montant_rembourse__c,Type_de_soins__c,Montant_demande__c, Date_des_soins__c,Date_demande__c
            FROM Remboursement__c
            WHERE Contact__c = :contact.Id
            ORDER BY Date_de_finalisation__c DESC, Date_demande__c DESC
        ];

        // 5. Calcul du total remboursé
        Decimal totalRembourse = 0;
        for (Remboursement__c r : remboursements) {
            totalRembourse += (r.Montant_rembourse__c != null) ? r.Montant_rembourse__c : 0;
        }

        // 6. Calcul du solde restant
        Decimal solde = cap - totalRembourse;
        if (solde <= 0) {
        solde = 0;
        }
        // 7. Retourner les données
        RemboursementData result = new RemboursementData();
        result.remboursements = remboursements;
        result.reimbursementCap = cap;
        result.soldeRestant = solde;

        return result;


    }

    @AuraEnabled(cacheable=true)
    public static List<Remboursement__c> getAllRemboursements() {
        return [
            SELECT Id, Name, Statut__c, Date_de_finalisation__c, 
                   Contact__c, Contact__r.Name,  // récupération du nom du contact lié
                   Cause_de_refus__c, Montant_rembourse__c, 
                   Type_de_soins__c, Montant_demande__c, 
                   Date_des_soins__c, Date_demande__c
            FROM Remboursement__c
            ORDER BY Date_demande__c DESC
        ];
    }
    

}
