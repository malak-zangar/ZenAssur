public class ContactImportHandler {

    public static void processContactsFromContentVersion(Id oppId, Id profileId) {
        try {
            // 1. Récupération de l'opportunité
            Opportunity opp = [
                SELECT Id, Name, StageName, AccountId
                FROM Opportunity
                WHERE Id = :oppId
                LIMIT 1
            ];

            // 2. Vérification du stade
            if (opp.StageName != 'Closed Won') {
                System.debug('Opportunité non Closed Won');
                return;
            }

            // 3. Vérification du compte
            Id accountId = opp.AccountId;
            if (accountId == null) {
                System.debug('Aucun compte lié à cette opportunité.');
                return;
            }

            // 4. Récupération des pièces jointes de l’opportunité
List<ContentDocumentLink> links = [
    SELECT ContentDocumentId
    FROM ContentDocumentLink
    WHERE LinkedEntityId = :oppId
];

// Vérifie qu’il y a des fichiers liés
if (links.isEmpty()) {
    System.debug('Aucune pièce jointe trouvée sur cette opportunité.');
    return;
}

// Récupère toutes les ContentVersion liées, avec les extensions souhaitées
List<Id> docIds = new List<Id>();
for (ContentDocumentLink l : links) {
    docIds.add(l.ContentDocumentId);
}

List<ContentVersion> versions = [
    SELECT Id, Title, VersionData, FileExtension, ContentDocumentId, CreatedDate
    FROM ContentVersion
    WHERE ContentDocumentId IN :docIds
    AND FileExtension IN ('csv', 'xls', 'xlsx')
    ORDER BY CreatedDate DESC
];

// Vérifie qu’il y a bien un fichier au bon format
if (versions.isEmpty()) {
    System.debug('Aucun fichier CSV ou Excel trouvé.');
    return;
}

// On prend la plus récente (grâce à ORDER BY CreatedDate DESC)
ContentVersion version = versions[0];


            // 5. Lecture du contenu CSV
            String content = version.VersionData != null ? EncodingUtil.urlDecode(version.VersionData.toString(), 'UTF-8') : '';
            if (String.isBlank(content)) {
                System.debug('Fichier vide');
                return;
            }

            List<String> lines = content.split('\\r?\\n');
            if (lines.isEmpty()) {
                System.debug('CSV sans ligne');
                return;
            }

            String delimiter = lines[0].contains(';') ? ';' : ',';
            Boolean hasHeader = lines[0].toLowerCase().contains('firstname') &&
                                lines[0].toLowerCase().contains('lastname') &&
                                lines[0].toLowerCase().contains('email');

            Integer startIndex = hasHeader ? 1 : 0;
            List<Contact> contactsToCreate = new List<Contact>();

            for (Integer i = startIndex; i < lines.size(); i++) {
                try {
                    if (String.isBlank(lines[i])) continue;

                    List<String> cols = lines[i].split(delimiter, -1);
                    if (cols.size() < 6) {
                        System.debug('Ligne ignorée (colonnes manquantes): ' + lines[i]);
                        continue;
                    }

                    String firstName = cols[0].trim();
                    String lastName = cols[1].trim();
                    String email = cols[3].trim();
                    String phone = cols[2].trim();
                    String salutation = cols[4].trim();
                    String title = cols[5].trim();

                    if (String.isBlank(lastName) || String.isBlank(email)) {
                        System.debug('Nom ou Email manquant à la ligne ' + (i + 1));
                        continue;
                    }

                    contactsToCreate.add(new Contact(
                        FirstName = firstName,
                        LastName = lastName,
                        Email = email,
                        Phone = phone,
                        Title = title,
                        Salutation = salutation,
                        AccountId = accountId
                    ));
                } catch (Exception e) {
                    System.debug('Erreur ligne ' + (i + 1) + ': ' + e.getMessage());
                }
            }

            // 6. Insertion des contacts
            if (!contactsToCreate.isEmpty()) {
                Database.SaveResult[] insertResults = Database.insert(contactsToCreate, false);
                List<Contact> createdContacts = new List<Contact>();

                for (Integer j = 0; j < insertResults.size(); j++) {
                    if (insertResults[j].isSuccess()) {
                        createdContacts.add(contactsToCreate[j]);
                    } else {
                        System.debug('Erreur création contact : ' + insertResults[j].getErrors()[0].getMessage());
                    }
                }

                // 7. Création des utilisateurs
                createUsersForContacts(createdContacts, profileId);
            } else {
                System.debug('Aucun contact valide à créer.');
            }

        } catch (Exception e) {
            System.debug('Erreur globale: ' + e.getMessage() + '\nStack Trace: ' + e.getStackTraceString());
        }
    }

    private static void createUsersForContacts(List<Contact> contacts, Id profileId) {
        if (contacts == null || contacts.isEmpty()) return;

        List<User> usersToCreate = new List<User>();

        for (Contact c : contacts) {
            if (String.isBlank(c.Email) || c.Id == null) continue;

            try {
                String alias = (c.FirstName != null && c.FirstName.length() >= 2 ?
                              c.FirstName.substring(0, 2) : 'us') +
                             (c.LastName != null && c.LastName.length() >= 2 ?
                              c.LastName.substring(0, 2) : 'er');

                usersToCreate.add(new User(
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    Email = c.Email,
                    Username = c.Email+c.LastName.substring(0, 2)+c.FirstName.substring(0, 2),
                    Alias = alias,
                    TimeZoneSidKey = 'Europe/Paris',
                    LocaleSidKey = 'fr_FR',
                    EmailEncodingKey = 'UTF-8',
                    LanguageLocaleKey = 'fr',
                    ProfileId = profileId,
                    ContactId = c.Id,
                    IsActive = true,
                    CommunityNickname = c.LastName+'-'+c.FirstName
                ));
            } catch (Exception e) {
                System.debug('Erreur création user pour contact ' + c.Id + ': ' + e.getMessage());
            }
        }

        if (!usersToCreate.isEmpty()) {
            Database.SaveResult[] userResults = Database.insert(usersToCreate, false);
            for (Integer i = 0; i < userResults.size(); i++) {
                if (!userResults[i].isSuccess()) {
                    System.debug('Erreur création utilisateur ' + usersToCreate[i].Email + ': ' +
                        userResults[i].getErrors()[0].getMessage());
                }
            }
        }
    }
}
