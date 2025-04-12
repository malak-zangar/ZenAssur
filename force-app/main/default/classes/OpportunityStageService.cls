public without sharing class OpportunityStageService {
    @AuraEnabled(cacheable=true)
    public static List<StageWrapper> getOpportunityStages() {
        List<StageWrapper> stages = new List<StageWrapper>();
        
        Schema.DescribeFieldResult fieldResult = Opportunity.StageName.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
        
        for (Schema.PicklistEntry entry : picklistEntries) {
            stages.add(new StageWrapper(entry.getValue(), entry.getLabel()));
        }
        
        return stages;
    }

    @AuraEnabled(cacheable=true)
    public static String getCurrentStage(Id opportunityId) {
        Opportunity opp = [SELECT StageName FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
        return opp.StageName;
    }

    public class StageWrapper {
        @AuraEnabled public String value;
        @AuraEnabled public String label;
        
        public StageWrapper(String value, String label) {
            this.value = value;
            this.label = label;
        }
    }
}
