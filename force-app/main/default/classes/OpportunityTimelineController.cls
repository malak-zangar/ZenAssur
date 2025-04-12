public without sharing class OpportunityTimelineController {
    @AuraEnabled(cacheable=true)
    public static Opportunity getOpportunityForUser() {
        User currentUser = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()];
        System.debug('currentuserid : ' + UserInfo.getUserId());
        System.debug('currentuser : ' + currentUser);


        System.debug('Current Contact ID: ' + currentUser.ContactId);

        if (currentUser.ContactId == null) {
            return null;
        }

        List<Opportunity> opps = [
            SELECT Id, Name, StageName
            FROM Opportunity
            WHERE AccountId IN (
                SELECT AccountId FROM Contact WHERE Id = :currentUser.ContactId
            )
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];

        System.debug('Found Opportunities: ' + opps);

        return opps.isEmpty() ? null : opps[0];
    }

 // 🆕 Méthode pour récupérer juste l'ID de l'opportunité
 @AuraEnabled(cacheable=true)
 public static Id getOpportunityIdForUser() {
     Opportunity opp = getOpportunityForUser();
     return opp != null ? opp.Id : null;
 }


@AuraEnabled
public static void linkFileToOpportunity(Id contentDocumentId, Id opportunityId, String fileType) {
    // Créer un ContentDocumentLink pour lier le fichier à l'Opportunité
    ContentDocumentLink cdl = new ContentDocumentLink(
        ContentDocumentId = contentDocumentId,
        LinkedEntityId = opportunityId,
        ShareType = 'V', // Visible to the Opportunity
        Visibility = 'AllUsers'
    );
    insert cdl;

    // Récupérer la version du fichier
    ContentVersion contentVersion = [
        SELECT Title FROM ContentVersion WHERE ContentDocumentId = :contentDocumentId LIMIT 1
    ];

    // Assigner un nom spécifique en fonction du fichier téléchargé
    if (fileType == 'file1') {
        contentVersion.Title = 'Liste des employés';  // Pour le premier fichier (File1)
    } else if (fileType == 'file2') {
        contentVersion.Title = 'Attestation CA';  // Pour le deuxième fichier (File2)
    } else if (fileType == 'file3') {
        contentVersion.Title = 'Registre de commerce';  // Pour le troisième fichier (File3)
    }

    update contentVersion;  // Met à jour le titre du fichier
}

@AuraEnabled
public static void deleteContentDocumentLink(Id contentDocumentId, Id opportunityId) {
    List<ContentDocumentLink> links = [
        SELECT Id FROM ContentDocumentLink
        WHERE ContentDocumentId = :contentDocumentId AND LinkedEntityId = :opportunityId
    ];
    delete links;
}

@AuraEnabled
public static Boolean moveToQualificationStage(Id opportunityId) {
    try {
        Opportunity opp = [SELECT Id, StageName FROM Opportunity WHERE Id = :opportunityId];
        opp.StageName = 'Qualification';
        update opp;
        return true;
    } catch (Exception e) {
        throw new AuraHandledException('Erreur : ' + e.getMessage());
    }
}

}