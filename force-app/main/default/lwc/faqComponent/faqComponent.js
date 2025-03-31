import { LightningElement } from 'lwc';

export default class FaqComponent extends LightningElement {
    faqList = [
        {
            id: 1,
            question: "Comment souscrire à une assurance santé chez ZenAssur ?",
            answer: "Pour souscrire, vous devez choisir une offre, remplir un formulaire et fournir les informations demandées. Vous recevrez ensuite un devis et pourrez signer le contrat en ligne.",
            isOpen: false
        },
        {
            id: 2,
            question: "Comment recevoir un devis personnalisé ?",
            answer: "Après avoir sélectionné l'offre qui vous intéresse et etre contacté par nous, vous recevrez un devis détaillé dans votre espace client.",
            isOpen: false
        },
        {
            id: 3,
            question: "Comment puis-je suivre l'état de mes remboursements ?",
            answer: "Vous pouvez suivre l'état de vos remboursements directement sur votre espace client en ligne. Les remboursements sont mis à jour régulièrement.",
            isOpen: false
        },
        {
            id: 4,
            question: "Quelles sont les garanties incluses dans les offres d'assurance ?",
            answer: "Nos offres incluent la couverture hospitalisation, les soins médicaux courants, ainsi que des options supplémentaires selon l'offre choisie.",
            isOpen: false
        },
        {
            id: 5,
            question: "Comment puis-je modifier mes informations personnelles après avoir souscrit à une assurance ?",
            answer: "Vous pouvez modifier vos informations personnelles directement dans votre espace client en ligne. Une fois connecté, allez dans la section 'Mon Profil' et mettez à jour vos informations.",   
            isOpen: false
        },
        {
            id: 6,
            question: "Que faire si je rencontre un problème avec ma souscription ou mes remboursements ?",
            answer: "Si vous rencontrez un problème, vous pouvez contacter notre service client via le formulaire de contact sur le site ou par téléphone. Notre équipe est disponible pour vous aider et résoudre rapidement toute situation.",           
            isOpen: false
        }
    ];

  

    toggleSection(event) {
        const id = event.target.dataset.id;
        this.faqList = this.faqList.map(item => ({
            ...item,
            isOpen: item.id == id ? !item.isOpen : item.isOpen
        }));
    }
}
