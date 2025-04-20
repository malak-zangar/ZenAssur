trigger UpdateContractFromCongaSign on APXT_CongaSign__Transaction__c (after update) {
    Set<Id> transactionIds = new Set<Id>();
    Map<Id, String> transactionToStatus = new Map<Id, String>();
    Map<Id, Id> transactionToContract = new Map<Id, Id>();
    Map<Id, Id> transactionToContact = new Map<Id, Id>(); // 🔥 nouveau : lien Contact

    for (APXT_CongaSign__Transaction__c trans : Trigger.new) {
        APXT_CongaSign__Transaction__c oldTrans = Trigger.oldMap.get(trans.Id);
        if (trans.APXT_CongaSign__Status__c != oldTrans.APXT_CongaSign__Status__c) {
            transactionIds.add(trans.Id);
            transactionToStatus.put(trans.Id, trans.APXT_CongaSign__Status__c);
            transactionToContract.put(trans.Id, trans.Parent_800__c); // Lien vers le Contract
            transactionToContact.put(trans.Id, trans.Parent_003__c);  // Lien vers le Contact
        }
    }

    if (!transactionToContract.isEmpty()) {
        Map<Id, Contract> contracts = new Map<Id, Contract>([
            SELECT Id, Status, CreatedDate, CustomerSignedId, CustomerSignedTitle, CustomerSignedDate
            FROM Contract 
            WHERE Id IN :transactionToContract.values()
        ]);

        Map<Id, List<APXT_CongaSign__Recipient__c>> recipientsMap = new Map<Id, List<APXT_CongaSign__Recipient__c>>();
        for (APXT_CongaSign__Recipient__c r : [
            SELECT APXT_CongaSign__Transaction__c, APXT_CongaSign__Title__c, 
                   APXT_CongaSign__SignedOn__c, APXT_CongaSign__SignerIndex__c
            FROM APXT_CongaSign__Recipient__c 
            WHERE APXT_CongaSign__Transaction__c IN :transactionIds
        ]) {
            if (!recipientsMap.containsKey(r.APXT_CongaSign__Transaction__c)) {
                recipientsMap.put(r.APXT_CongaSign__Transaction__c, new List<APXT_CongaSign__Recipient__c>());
            }
            recipientsMap.get(r.APXT_CongaSign__Transaction__c).add(r);
        }

        List<Contract> contractsToUpdate = new List<Contract>();

        for (Id transId : transactionIds) {
            String status = transactionToStatus.get(transId);
            Id contractId = transactionToContract.get(transId);
            Contract c = contracts.get(contractId);

            if (status == 'Sent') {
                c.Status = 'Sent';
            } else if (status == 'Complete') {
                c.Status = 'Signed';

                if (recipientsMap.containsKey(transId)) {
                    for (APXT_CongaSign__Recipient__c r : recipientsMap.get(transId)) {
                        if (r.APXT_CongaSign__SignerIndex__c == 1) {
                            // Client
                            c.CustomerSignedTitle = r.APXT_CongaSign__Title__c;
                            if (r.APXT_CongaSign__SignedOn__c != null) {
                                c.CustomerSignedDate = r.APXT_CongaSign__SignedOn__c.date();
                            }
                                                        
                            // 🔥 Assignation directe du Contact via le champ Parent_003__c
                            c.CustomerSignedId = transactionToContact.get(transId);
                        }
                    }
                }
            } else if (status == 'Declined' || status == 'Cancelled' || status == 'Expired' || status == 'Pending_Expiration') {
                c.Status = 'Unsigned';
            }

            contractsToUpdate.add(c);
        }

        if (!contractsToUpdate.isEmpty()) {
            update contractsToUpdate;
        }
    }
}
