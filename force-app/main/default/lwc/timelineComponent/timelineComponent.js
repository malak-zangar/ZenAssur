import { LightningElement } from 'lwc';

export default class TimelineComponent extends LightningElement {
    steps = [
        {
            id: 1,
            title: "Choisir une offre",
            description: "Explorez nos différentes offres et sélectionnez celle qui correspond à vos besoins.",
            icon: "utility:choice"
        },
        {
            id: 2,
            title: "Remplir le formulaire",
            description: "Fournissez les informations nécessaires pour générer votre devis personnalisé.",
            icon: "utility:form"
        },
        {
            id: 3,
            title: "Nous vous contactons et envoyons votre devis",
            description: "Un conseiller ZenAssur vous contactera pour valider les informations. Vous recevrez ensuite votre devis par email et devrez l'accepter pour continuer.",
            icon: "utility:money"
        },
        {
            id: 4,
            title: "Signer le contrat",
            description: "Finalisez votre souscription en signant votre contrat en ligne.",
            icon: "utility:signature"
        },
        {
            id: 5,
            title: "Devenir assuré",
            description: "Votre assurance est maintenant active et vous êtes officiellement couvert !",
            icon: "utility:like"
        }
    ];
}
