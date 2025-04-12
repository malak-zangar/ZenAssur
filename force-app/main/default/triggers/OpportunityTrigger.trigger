trigger OpportunityTrigger on Opportunity (after update) {
    List<Quote> quotesToInsert = new List<Quote>();
    Set<Id> oppIds = new Set<Id>();

    for (Opportunity opp : Trigger.new) {
        Opportunity oldOpp = Trigger.oldMap.get(opp.Id);
        if (opp.StageName == 'Qualification' && oldOpp.StageName != 'Qualification') {
            oppIds.add(opp.Id);
        }
    }

    if (oppIds.isEmpty()) return;

    Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>([
        SELECT Id, Name, AccountId, Pricebook2Id
        FROM Opportunity
        WHERE Id IN :oppIds
    ]);

    Map<Id, Id> oppToContactId = new Map<Id, Id>();
    for (OpportunityContactRole ocr : [
        SELECT OpportunityId, ContactId
        FROM OpportunityContactRole
        WHERE OpportunityId IN :oppIds
        AND IsPrimary = true
    ]) {
        oppToContactId.put(ocr.OpportunityId, ocr.ContactId);
    }

    Map<Id, List<OpportunityLineItem>> oppToProducts = new Map<Id, List<OpportunityLineItem>>();
    for (OpportunityLineItem oli : [
        SELECT OpportunityId, Quantity, UnitPrice, PricebookEntryId,
               PricebookEntry.Product2Id
        FROM OpportunityLineItem
        WHERE OpportunityId IN :oppIds
    ]) {
        if (!oppToProducts.containsKey(oli.OpportunityId)) {
            oppToProducts.put(oli.OpportunityId, new List<OpportunityLineItem>());
        }
        oppToProducts.get(oli.OpportunityId).add(oli);
    }

    for (Id oppId : oppIds) {
        Opportunity opp = oppMap.get(oppId);
        Quote q = new Quote(
            Name = 'Devis - ' + opp.Name,
            OpportunityId = opp.Id,
            Pricebook2Id = opp.Pricebook2Id,
            Status = 'Draft',
            ExpirationDate = Date.today().addDays(30),
            ContactId = oppToContactId.get(oppId)
        );
        quotesToInsert.add(q);
    }

    insert quotesToInsert;

    List<QuoteLineItem> qlisToInsert = new List<QuoteLineItem>();

    for (Quote q : quotesToInsert) {
        if (oppToProducts.containsKey(q.OpportunityId)) {
            for (OpportunityLineItem oli : oppToProducts.get(q.OpportunityId)) {
                QuoteLineItem qli = new QuoteLineItem(
                    QuoteId = q.Id,
                    PricebookEntryId = oli.PricebookEntryId,
                    Quantity = oli.Quantity,
                    UnitPrice = oli.UnitPrice
                );
                qlisToInsert.add(qli);
            }
        }
    }

    if (!qlisToInsert.isEmpty()) {
        insert qlisToInsert;
    }

   

}
