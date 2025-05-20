public class RemboursementFraudeService {
    @future(callout=true)
    public static void analyserRemboursementsAsync(Set<Id> remboursementIds) {
        List<Remboursement__c> remboursements = [
            SELECT Id, Contact__c, Montant_demande__c, Date_demande__c, 
                   Date_des_soins__c, Type_de_soins__c
            FROM Remboursement__c 
            WHERE Id IN :remboursementIds
        ];

        List<Remboursement__c> remboursementsToUpdate = new List<Remboursement__c>();

        for (Remboursement__c r : remboursements) {
            if (r.Contact__c == null) continue;

            try {
                Contact contact = [
                    SELECT Id, AccountId FROM Contact WHERE Id = :r.Contact__c LIMIT 1
                ];

                Opportunity opp = null;
                List<Opportunity> oppList = [
                    SELECT Id FROM Opportunity 
                    WHERE AccountId = :contact.AccountId AND StageName = 'Closed Won'
                    ORDER BY CloseDate DESC LIMIT 1
                ];
                if (!oppList.isEmpty()) opp = oppList[0];

                Boolean soinNonCouvert = false;
                if (opp != null) {
                    List<OpportunityLineItem> items = [
                        SELECT Product2.Exclusions__c 
                        FROM OpportunityLineItem WHERE OpportunityId = :opp.Id LIMIT 1
                    ];
                    if (!items.isEmpty() && items[0].Product2.Exclusions__c != null) {
                        soinNonCouvert = items[0].Product2.Exclusions__c.contains(r.Type_de_soins__c);
                    }
                }

                List<Remboursement__c> historique = [
                    SELECT Id, Montant_demande__c, Date_demande__c, Type_de_soins__c, 
                           isFraud__c, ScoreFraude__c, Date_des_soins__c 
                    FROM Remboursement__c 
                    WHERE Contact__c = :r.Contact__c AND Id != :r.Id
                    ORDER BY Date_demande__c DESC
                ];

                Integer dureeJours = r.Date_des_soins__c != null && r.Date_demande__c != null ?
                    r.Date_demande__c.daysBetween(r.Date_des_soins__c) : 0;

                Date troisMoisAvant = Date.today().addMonths(-3);
                Integer freq3Mois = [
                    SELECT COUNT() FROM Remboursement__c 
                    WHERE Contact__c = :r.Contact__c AND Date_demande__c >= :troisMoisAvant AND Id != :r.Id
                ];

                Integer totalDemandes = historique.size();
                Integer nbFraudes = 0;
                Decimal sommeScores = 0;
                for (Remboursement__c h : historique) {
                    if (h.isFraud__c) nbFraudes++;
                    sommeScores += (h.ScoreFraude__c != null ? h.ScoreFraude__c : 0);
                }
                Decimal moyenneScore = totalDemandes > 0 ? sommeScores / totalDemandes : 0;

                Integer tempsDepuisDerniere = 0;
                if (!historique.isEmpty() && historique[0].Date_demande__c != null && r.Date_demande__c != null) {
                    tempsDepuisDerniere = historique[0].Date_demande__c.daysBetween(r.Date_demande__c);
                }

                Boolean estDupliquee = false;
                for (Remboursement__c oldR : historique) {
                    if (oldR.Montant_demande__c == r.Montant_demande__c &&
                        oldR.Type_de_soins__c == r.Type_de_soins__c &&
                        oldR.Date_des_soins__c == r.Date_des_soins__c) {
                        estDupliquee = true;
                        break;
                    }
                }

                Map<String, Object> payload = new Map<String, Object>{
                    'SoinNonCouvert' => soinNonCouvert ? 1 : 0,
                    'MontantDemandeDT' => r.Montant_demande__c != null ? r.Montant_demande__c : 0,
                    'DureeDemandeActeJours' => dureeJours,
                    'FrequenceDemandes3Mois' => freq3Mois,
                    'NombreDemandesTotal' => totalDemandes,
                    'NbFraudesHistorique' => nbFraudes,
                    'MoyennePourcentageFraudeHistorique' => moyenneScore,
                    'TempsdapresDerniereDemandesJours' => tempsDepuisDerniere,
                    'DemandeDupliquee' => estDupliquee
                };

                HttpRequest req = new HttpRequest();
                req.setEndpoint('https://3071-197-3-0-226.ngrok-free.app/predict');
                req.setMethod('POST');
                req.setHeader('Content-Type', 'application/json');
                req.setBody(JSON.serialize(payload));

                Http http = new Http();
                HttpResponse res = http.send(req);

                if (res.getStatusCode() == 200) {
                    Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                    Integer prediction = (Integer) result.get('prediction');
                    Decimal score = ((Decimal) result.get('score')) * 100;
                    List<Object> explanation = (List<Object>) result.get('explanation');

                    String explanationFormatted = '';
                    for (Object e : explanation) {
                        Map<String, Object> item = (Map<String, Object>) e;
                        explanationFormatted += '- ' + item.get('feature') + ' (impact : ' + item.get('impact') + ')\n';
                    }

                    //r.isFraud__c = prediction == 1;
                    r.ScoreFraude__c = score;
                    r.FraudReason__c = explanationFormatted;
                    remboursementsToUpdate.add(r);
                } else {
                    System.debug('API erreur: ' + res.getStatusCode() + ' - ' + res.getBody());
                }

            } catch (Exception e) {
                System.debug('Erreur traitement remboursement ' + r.Id + ' : ' + e.getMessage());
            }
        }

        if (!remboursementsToUpdate.isEmpty()) {
            try {
                update remboursementsToUpdate;
            } catch (Exception e) {
                System.debug('Erreur update : ' + e.getMessage());
            }
        }
    }

    @AuraEnabled(cacheable=true)
    public static Remboursement__c getRemboursement(Id remboursementId) {
        return [
            SELECT Id, ScoreFraude__c, isFraud__c, FraudReason__c
            FROM Remboursement__c
            WHERE Id = :remboursementId
            LIMIT 1
        ];
    }
}
