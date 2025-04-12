import { LightningElement, wire, track } from 'lwc';
import getHealthInsuranceProducts from '@salesforce/apex/ProductController.getHealthInsuranceProducts';
import { NavigationMixin } from 'lightning/navigation';


export default class InsuranceOffers extends NavigationMixin(LightningElement){
    @track products = [];
    @track selectedOffers = [];
    @track showComparisonTable = false;
    @track selectedOfferId = null;  // Gérer l'ID de l'offre sélectionnée pour afficher les détails
    @track selectedOffer; // Détails de l'offre sélectionnée
    @track isModalDetailsOfferVisible = false;
    @track isModalSouscriptionVisible = false;

    @wire(getHealthInsuranceProducts)
    wiredProducts({ error, data }) {
        console.log('hey');
        if (data) {
            console.log(data);
            let index = 0; // Initialisation de l'index manuellement
            this.products = data.map(product => {
                const modifiedProduct = {
                    ...product,
                    DentalAndOpticalCoverageText: product.Dental_and_Optical_Coverage__c ? 'Oui' : 'Non',
                    Image_URL: this.extractImageUrl(product.Image_URL__c),
                    imagePosition: index % 2 === 0 ? 'left-image' : 'right-image', // Alternance gauche/droite
               
                // 🟢 Transformer les champs contenant des listes en tableaux
                exclusionsList: this.convertToList(product.Exclusions__c, ','),  // Séparateur = virgule
                benefitsList: this.convertToList(product.Main_Benefits__c, ','), 
                hospitalizationList: this.convertToList(product.Hospitalization_Coverage__c, ';'),  // Séparateur = point-virgule
                DentalAndOpticalCoverageIcon: product.Dental_and_Optical_Coverage__c ? '✅' : '❌',
                };
                index++; // Incrémentation de l'index après chaque produit
                return modifiedProduct;
            });
            console.log('Produits traités avec alternance:', this.products);
        } else if (error) {
            console.error('Erreur de récupération des produits:', error);
        }
    }

       // Fonction pour convertir une chaîne séparée par des virgules en liste
       convertToList(value, separator) {
        return value ? value.split(separator).map(item => item.trim()) : [];
    }

    subscribeOffer(event) {
        const productId = event.target.dataset.id; // Récupérer l'ID de l'offre
        console.log(productId);
    
        this.selectedOffer = this.products.find(product => product.Id === productId);
        console.log('Offre sélectionnée:', JSON.parse(JSON.stringify(this.selectedOffer))); // 🔥 Force la conversion en JSON pour afficher le contenu
    
        if (this.selectedOffer) {
            // Assurez-vous que 'offerId' est bien défini
            const offerId = this.selectedOffer.Id; // Utiliser 'offerId' correct ici
            sessionStorage.setItem('offerId', offerId); // Stocker l'ID dans sessionStorage
            console.log('Offer ID stored in sessionStorage:', offerId);
    
            // Navigation vers la page de souscription
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/souscription' // Assurez-vous que l'URL de souscription est correcte
                }
            });
        } else {
            console.error('Aucune offre correspondante trouvée!');
        }
    }
    
   showDetails(event) {
        const productId = event.target.dataset.id;
        console.log('Détails de l\'offre sélectionnée:', productId);
    
        this.selectedOffer = this.products.find(product => product.Id === productId);
        console.log('Offre sélectionnée:', JSON.parse(JSON.stringify(this.selectedOffer))); // 🔥 Force la conversion en JSON pour afficher le contenu
    
        if (this.selectedOffer  && !this.isModalDetailsOfferVisible) {
            this.isModalDetailsOfferVisible = true;    
            console.log('Modal affiché avec l\'offre:', JSON.stringify(this.selectedOffer)); // 🔥 Vérifie si les données sont présentes
        } else {
            console.error('Aucune offre correspondante trouvée!');
        }
    }
    
// Handler for closing the modal
handleClose() {
        this.isModalDetailsOfferVisible = false;
}

handleCloseSouscription() {
    this.isModalSouscriptionVisible = false;
}

    extractImageUrl(richText) {
        // Extraction d'URL d'image
        const imgTag = richText.match(/<img[^>]+src="([^"]+)"/);
        if (imgTag) {
            let imageUrl = imgTag[1];
            // Si l'URL est relative, la convertir en absolue
            if (imageUrl && !imageUrl.startsWith('http')) {
                const baseUrl = window.location.origin;  // Utilise l'URL de base de votre instance Salesforce
                imageUrl = baseUrl + imageUrl.replace(/&amp;/g, "&");  // Remplacer toutes les occurrences de &amp; par &
            }
            return imageUrl;
        }
        return null;
    }

    get groupedProductsWithKeys() {
        console.log('test');
        if (!this.products || this.products.length === 0) {
            return [];
        }

        // Trier les produits par prix décroissant
        const sortedProducts = [...this.products].sort((a, b) => b.Price__c - a.Price__c);

        // Découper en groupes de 3 par ligne
        const grouped = [];
        for (let i = 0; i < sortedProducts.length; i += 3) {
            grouped.push({
                id: `group-${i}`,
                products: sortedProducts.slice(i, i + 3)
            });
        }

        return grouped;
    }

    get cantCompare() {
        return this.selectedOffers.length < 2;
    }

    handleSelectOffer(event) {
        console.log(event);
        const productId = event.target.dataset.id;
        const product = this.products.find(p => p.Id === productId);
        const offerCard = event.target.closest('.offer-card'); // Récupère la carte de l'offre
    
        if (!product) return;
    
        if (event.target.checked) {
            // Si l'utilisateur coche la case
            if (this.selectedOffers.length < 3) {
                this.selectedOffers = [...this.selectedOffers, product];
                offerCard.classList.add('selected-offer'); // Ajoute la classe 'selected-offer'
                product.isSelected = true; // Marque l'offre comme sélectionnée
            } else {
                event.target.checked = false; // Décocher la case si plus de 3 offres sélectionnées
                alert("Vous ne pouvez comparer que 3 offres à la fois.");
            }
        } else {
            // Si l'utilisateur décoche la case
            this.selectedOffers = this.selectedOffers.filter(p => p.Id !== productId);
            offerCard.classList.remove('selected-offer'); // Retire la classe 'selected-offer'
            product.isSelected = false; // Marque l'offre comme non sélectionnée
        }
    
        // Mise à jour de l'état du bouton de comparaison
        this.updateCompareButtonState();
    }
    
    updateCompareButtonState() {
        // Mise à jour du bouton "Comparer"
        const compareButton = this.template.querySelector('lightning-button');
        compareButton.disabled = this.selectedOffers.length < 2; // Le bouton est désactivé si moins de 2 offres sont sélectionnées
    }
    
    

    showComparison() {
        this.showComparisonTable = true;
    }

    hideComparison() {
        this.showComparisonTable = false;
    }

    // Fonction pour vérifier la position de l'image
    isImageLeft(product) {
        const index = this.products.indexOf(product);
        return index % 2 === 0;  // Alterner l'image à gauche (index pair)
    }

    getCardClass(index) {
        return index % 2 === 0 ? 'offer-card left-image' : 'offer-card right-image';
    }
    
    
}
