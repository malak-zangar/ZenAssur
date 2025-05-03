public with sharing class LeadController {
    public LeadController() {

    }
     
    @AuraEnabled(cacheable=true)
    public static List<Lead> getLeads(){
        try {
            return [SELECT id, name, Company, Email, Phone, Status   
                    FROM Lead
                    ORDER BY id DESC];
           
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}