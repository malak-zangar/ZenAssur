public with sharing class ProductController {
    @AuraEnabled(cacheable=true)
    public static List<Product2> getHealthInsuranceProducts() {
        return [
            SELECT Id, Name, ProductCode, Description, Price__c, Coverage_Duration__c, 
                   Reimbursement_Cap__c, Reimbursement_Percentage__c, 
                   Deductible__c, Dental_and_Optical_Coverage__c, 
                   Hospitalization_Coverage__c, Image_URL__c,Exclusions__c,Main_Benefits__c
            FROM Product2
            WHERE Family = 'Assurance Santé'
            ORDER BY Price__c DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Product2 getProductById(Id productId) {
        try {
            System.debug(productId);
            Product2 product = [SELECT Id, Name, Price__c FROM Product2 WHERE Id = :productId LIMIT 1];
            return product;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving product: ' + e.getMessage());
        }
    }
    
    
}


