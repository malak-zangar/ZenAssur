public with sharing class ReclamationController {
 
    @AuraEnabled(cacheable=true)
    public static List<Case> getReclamations() {
          // 1. Récupérer le contact lié à l'utilisateur connecté
    User currentUser = [SELECT Id, ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
    
    if (currentUser.ContactId == null) {
        throw new AuraHandledException('Aucun contact lié à cet utilisateur.');
    }

        List<Case> reclamations = [
            SELECT Id,CaseNumber,Status,CreatedDate,ClosedDate, Origin,Subject,Description
            FROM Case
            WHERE ContactId = :currentUser.ContactId
            ORDER BY ClosedDate DESC, CreatedDate DESC
        ];

        return reclamations ;


    }
}