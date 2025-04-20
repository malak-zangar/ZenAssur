trigger ImportContactsFromCSV on Opportunity (after update) {
    // ID du profil ZenAssur Community (par exemple)
    Id profileId = '00ed2000004y7dp';
//assuré login 00ed2000004wLg5
    for (Opportunity opp : Trigger.new) {
        Opportunity oldOpp = Trigger.oldMap.get(opp.Id);

        // Vérifie si le statut est passé à Closed Won
        if (opp.StageName == 'Closed Won' && oldOpp.StageName != 'Closed Won') {
            // Appelle la méthode en passant dynamiquement l'Id de l'opportunité
            ContactImportHandler.processContactsFromContentVersion(opp.Id, profileId);
        }
    }
}
