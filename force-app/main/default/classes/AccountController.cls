public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Id, Name, Industry, Phone
            FROM Account
            ORDER BY Id DESC

        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [
            SELECT Id, Name, Email, Phone
            FROM Contact
            ORDER BY Id DESC

        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Contract> getContracts() {
        return [
            SELECT Id,AccountId,Account.Name,status,StartDate,EndDate,ContractNumber 
            FROM Contract
            ORDER BY ContractNumber DESC

        ];
    }
}