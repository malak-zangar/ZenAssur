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


/* public with sharing class ProductController {
    
    // Récupère tous les produits d'assurance santé avec leur prix du Price Book
    @AuraEnabled(cacheable=true)
    public static List<ProductWrapper> getHealthInsuranceProducts() {
        // Récupérer l'ID du Pricebook "Assurance Santé"
        Id pricebookId = [SELECT Id FROM Pricebook2 WHERE Name = 'Assurance santé' LIMIT 1].Id;
        // Récupérer les produits avec leurs prix dans ce Pricebook
        List<Product2> products = [
            SELECT Id, Name, ProductCode, Description, 
                   (SELECT UnitPrice FROM PricebookEntries WHERE Pricebook2Id = :pricebookId LIMIT 1),
                   Coverage_Duration__c, Reimbursement_Cap__c, 
                   Reimbursement_Percentage__c, Deductible__c, 
                   Dental_and_Optical_Coverage__c, Hospitalization_Coverage__c, 
                   Image_URL__c, Exclusions__c, Main_Benefits__c
            FROM Product2
            WHERE Family = 'Assurance Santé'
            ORDER BY Name ASC
        ];
        // Créer la liste des objets ProductWrapper
        List<ProductWrapper> wrappedProducts = new List<ProductWrapper>();
        for (Product2 p : products) {
            Decimal price = 0; // Valeur par défaut
            if (p.PricebookEntries != null && !p.PricebookEntries.isEmpty()) {
                price = p.PricebookEntries[0].UnitPrice;
            }

            wrappedProducts.add(new ProductWrapper(
                p.Id, p.Name, p.ProductCode, p.Description, price,
                p.Coverage_Duration__c, p.Reimbursement_Cap__c, 
                p.Reimbursement_Percentage__c, p.Deductible__c, 
                p.Dental_and_Optical_Coverage__c, p.Hospitalization_Coverage__c, 
                p.Image_URL__c, p.Exclusions__c, p.Main_Benefits__c
            ));

        }
        
        return wrappedProducts;
    }

    // Récupère un produit spécifique avec son prix du Price Book
    @AuraEnabled(cacheable=true)
    public static ProductWrapper getProductById(Id productId) {
        try {
            PricebookEntry pbe = [
                SELECT Id, UnitPrice, Product2.Id, Product2.Name, Product2.Description
                FROM PricebookEntry
                WHERE Product2.Id = :productId 
                AND Pricebook2.IsStandard = true
                LIMIT 1
            ];
            return new ProductWrapper(
                pbe.Product2.Id, pbe.Product2.Name, null, pbe.Product2.Description, 
                pbe.UnitPrice, null, null, null, null, null, null, null, null, null
            );

        } catch (Exception e) {
            throw new AuraHandledException('Erreur lors de la récupération du produit : ' + e.getMessage());
        }
    }


}*/