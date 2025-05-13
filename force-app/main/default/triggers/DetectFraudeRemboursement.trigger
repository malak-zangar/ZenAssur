trigger DetectFraudeRemboursement on Remboursement__c (after insert) {
    Set<Id> ids = new Set<Id>();
    for (Remboursement__c r : Trigger.new) {
        if (r.Contact__c != null) {
            ids.add(r.Id);
        }
    }
    if (!ids.isEmpty()) {
        RemboursementFraudeService.analyserRemboursementsAsync(ids);
    }
}
