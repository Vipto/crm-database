import {
  collection,
  doc,
  writeBatch,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateSearchKeywords } from '../utils/validation';

// Raw real CSV records from Crm Database
export const REAL_CRM_DATA = [
  { storeName: "Classic Shoes", link: "https://maps.app.goo.gl/H31wUz2vkYMAD7AGA", category: "Fashion", phone: "9764586002", status: "Not started", createdBy: "Vipto" },
  { storeName: "Kaya Collection", link: "https://www.instagram.com/kaya.collection_18?stkn=djB5NjJzdGh6Z3o3", category: "Fashion", phone: "8830240881", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "Aarohi Collection", link: "https://www.instagram.com/aarohi___collection?stkn=MW5waTB2emZmOWJpZA==", category: "Fashion", phone: "9370003465", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "SS Mobile - Pune -Balaji Nagar", link: "https://www.google.com/maps/search/?api=1&query=SS+Mobile+Balaji+Nagar+Dhankawadi+Pune&utm_source=chatgpt.com", category: "Electronics", phone: "9767737475", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Rangutsav Kurti Hub", link: "https://www.instagram.com/rangutsav_kurti_hub_dhankvdi?stkn=bWQ0ang1ZzE0cjhs", category: "Fashion", phone: "9699789745", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "KP Collection", link: "https://www.instagram.com/kpcollection2026?stkn=cDgwOWl6cmFhOHFi", category: "Fashion", phone: "7887872999", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "OM MOBILE STORE", link: "https://www.google.com/maps/search/?api=1&query=OM+Mobile+Store+Dhankawadi+Pune&utm_source=chatgpt.com", category: "Mobile", phone: "8888551990", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Galani Fashions", link: "https://www.instagram.com/galanifashions/", category: "Fashion", phone: "9552999699", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Vastralankar rental Jwellery & Outfits", link: "https://www.instagram.com/vastralankar_rental?stkn=MXJ5cXo4NDg3enF2Zg==", category: "Fashion", phone: "9370039163", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "Fragrance Designs", link: "http://google.com/maps/dir/?api=1&destination=Fragrance+Designs%2C+Pune", category: "Fashion", phone: "9822243979", status: "Not started", createdBy: "Vipto" },
  { storeName: "S B Mobile Shopee", link: "https://www.google.com/maps/search/?api=1&query=SB+Mobile+Shopee+Dhankawadi+Pune", category: "Mobile", phone: "8408056167", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Minakshi Kurti House", link: "https://www.instagram.com/minakshi_kurti_house?stkn=MWJveHh4cXVxMGtzcg==", category: "Fashion", phone: "7775019292", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "D Men's Fashion", link: "https://www.instagram.com/the_d_mens_fashion_official?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9168922097", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Balaji Electronics", link: "https://www.google.com/maps/search/?api=1&query=Balaji+Electronics+Bharati+Vidyapeeth+Katraj+Pune", category: "Electronics", phone: "9922967992", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Parnika Heritage - A Designer Boutique", link: "https://www.google.com/maps/dir/?api=1&destination=Parnika+Heritage+Pune", category: "Fashion", phone: "8308209728", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Premium Mens Wear", link: "https://www.instagram.com/the_premium_outfits_pune?stkn=ZTB1YWNvc2IwaWRn", category: "Fashion", phone: "9309806611", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "Shree Mahavir Electronics", link: "https://www.google.com/maps/search/?api=1&query=Shree+Mahavir+Electronics+Bharati+Vidyapeeth+Pune", category: "Electronics", phone: "9850068889", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Global Creation", link: "http://google.com/maps?q=Light+House+Bibwewadi+Pune", category: "Fashion", phone: "7775023131", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "June27_clothingstore", link: "https://www.instagram.com/june27_clothingstore/?utm_source=ig_web_button_share_sheet", category: "Fashion", phone: "9766702706", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "blossom boutique", link: "https://www.google.com/maps/dir/Blossom+Boutique+Parvati+Pune", category: "Fashion", phone: "9922694464", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "iradha & Co", link: "https://www.instagram.com/iradha.co/", category: "Fashion", phone: "9823386158", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Jay Shankar Mens Wear", link: "https://www.instagram.com/jayshankarmenswearpune?stkn=ZDVvYWp1c2dsazRv", category: "Fashion", phone: "8655700729", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "THE BERLIN STORE", link: "https://www.google.com/maps/dir/?api=1&destination=THE+BERLIN+STORE+Bibwewadi+Pune", category: "Fashion", phone: "07385521111", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Downtown Sports Arena", link: "https://www.instagram.com/downtown.sports.arena?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9067240007", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Riddhi Fashions", link: "Shop No.5, B4, Maniratna Complex, near Swargate, Sahakar Nagar, Pune", category: "Fashion", phone: "8830487379", status: "Not started", createdBy: "Vipto" },
  { storeName: "Super Collections", link: "https://www.instagram.com/supercollection_shoes?stkn=MW40cTVzNGxuYnJubQ==", category: "Fashion", phone: "7020904566", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "Raadnyi Clothing", link: "https://www.instagram.com/raadnyi_clothing?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "7447314151", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Girisha's Boutique", link: "https://www.google.com/maps/dir/Girisha+Boutique+Bibwewadi+Pune", category: "Fashion", phone: "8308998998", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "June27", link: "https://www.instagram.com/june27_clothingstore?stkn=MWRxNGtrbDg1Y2c5NA==", category: "Fashion", phone: "9766702706", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "MANIK MOBILE SHOPEE BHARTI VIDYAPEETH", link: "https://www.google.com/maps/search/?api=1&query=Manik+Mobile+Shopee+Bharati+Vidyapeeth+Pune", category: "Mobile", phone: "8788195468", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "New RadhaKrishna Collection", link: "https://www.instagram.com/new_radhakrushna_collection_44?stkn=ZXhiNDNiMTZsYmE2", category: "Fashion", phone: "9370994964", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "MG Mobiles", link: "https://www.instagram.com/mg_mobiles_official/", category: "Mobile", phone: "9960656561", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "enchanting COLORS", link: "https://www.google.com/maps/dir/Sahakar+Nagar+Pune", category: "Fashion", phone: "8010502009", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Vastra Utsav", link: "https://www.google.com/maps/search/Swanand+Society+Parvati+Paytha+Pune", category: "Fashion", phone: "9881138368", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "MIEW CREATIONS", link: "https://www.google.com/maps/search/Chintamani+Hospital+Bibwewadi+Pune", category: "Fashion", phone: "8830765946", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Galaxy Shoes", link: "https://www.instagram.com/galaxyshoes_08?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "9823964131", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Sunny’s Mobile Branch 2", link: "https://www.google.com/maps/search/?api=1&query=Sunnys+Mobile+Branch+2+Dhankawadi+Pune", category: "Electronics", phone: "7038715530", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "PALLUS FASHION", link: "https://www.google.com/maps/search/KRISHNAI+VIHAR+Bibwewadi+Pune", category: "Fashion", phone: "9552833434", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "OWND!", link: "https://www.google.com/maps/place/OWND!/@18.4807621,73.8604771", category: "Fashion", phone: "7387121472", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Manasi - The Boutique", link: "Shop no 8, Kumar Park, Bibwewadi Kondhwa Rd, Pune", category: "Fashion", phone: "9595854003", status: "Not started", createdBy: "Vipto" },
  { storeName: "Poona Mobile World", link: "https://www.google.com/maps/search/?api=1&query=Poona+Mobile+World+Trimurti+Chowk+Pune", category: "Mobile", phone: "9607994074", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Chunari Boutique", link: "https://www.instagram.com/chunariboutique750/", category: "Fashion", phone: "7506123936", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Parnika Heritage", link: "https://maps.app.goo.gl/pB91x6PtwbXgodbV7", category: "Fashion", phone: "8308209728", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Fuss Pot Pune", link: "https://www.instagram.com/fusspot_pune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "9156565718", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Champion Sports", link: "https://www.instagram.com/championsports_india?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9822477222", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Necks & Collars", link: "https://www.google.com/maps/dir/NECKS+COLLARS+Bibwewadi+Pune", category: "Fashion", phone: "9405822800", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "AKSHAY ELECTRONICS", link: "https://www.google.com/maps/search/?api=1&query=Akshay+Electronics+Dhankawadi+Pune", category: "Electronics", phone: "8149702744", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Lata's Pride of Women", link: "https://www.google.com/maps?daddr=Bhausaheb+Sadan+Bibwewadi+Pune", category: "Fashion", phone: "9970066665", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "ROYAL MAN", link: "https://www.google.com/maps/search/?api=1&query=Shop+No.97+KK+Market+Dhankawadi+Pune", category: "Fashion", phone: "9975983867", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "M S Mobile Shopee", link: "https://www.google.com/maps/search/?api=1&query=M+S+Mobile+Shopee+Balaji+Nagar+Pune", category: "Mobile", phone: "8793397326", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Global Hub Mobiles", link: "https://www.google.com/maps/search/?api=1&query=Global+Hub+Mobiles+Trimurti+Chowk+Pune", category: "Mobile", phone: "8999989200", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Instyle Boutique", link: "https://www.google.com/maps?ftid=0x3bc2eaa1a5c54ff7:0x5522d00c6e6d6648", category: "Fashion", phone: "9960770284", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Nauvari Rupal's Boutique", link: "https://www.google.com/maps?daddr=Swapnil+Society+Bibwewadi+Pune", category: "Fashion", phone: "9404611309", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "MIEW Creations", link: "https://www.instagram.com/miewcreations/", category: "Fashion", phone: "8830765946", status: "Not started", createdBy: "Vipto" },
  { storeName: "Cotton Point NX", link: "https://www.google.com/maps/search/?api=1&query=K+K+Market+G-27+Pune", category: "Fashion", phone: "7276112358", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "POONA_MOBILE _WORLD", link: "https://www.instagram.com/poona_mobile_world/", category: "Mobile", phone: "9607994074", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Sonal Ladies Paradise", link: "https://www.google.com/maps/dir/Ashwini+Paradise+Bibwewadi+Pune", category: "Fashion", phone: "9326740499", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Madhusudan Textiles", link: "https://www.google.com/maps/search/?api=1&query=C-37+KK+Market+Dhankawadi+Pune", category: "Fashion", phone: "8668309346", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Dwarkadas Shamkumar Textiles", link: "https://www.google.com/maps/search/?api=1&query=KK+Market+Balaji+Nagar+Pune", category: "Fashion", phone: "9175077120", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Garvi Kurti & Boutique", link: "https://www.instagram.com/garvi_kurti_and_boutique?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "7219451978", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "World of Proteins", link: "https://www.instagram.com/world_of_proteins?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9890136050", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "After all Friday", link: "https://www.instagram.com/after_all_friday/", category: "Fashion", phone: "9762903097", status: "Not started", createdBy: "Drishti Bhalotia" },
  { storeName: "Sitara Boutique", link: "https://www.instagram.com/sitara____boutique/", category: "Fashion", phone: "9108593939", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Shivba For Mens", link: "https://www.instagram.com/shivba_for_mens_official_50?stkn=d2ZweDdrbWxieHV0", category: "Fashion", phone: "9370695633", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "Prakashh Showroom", link: "https://www.google.com/maps/search/?api=1&query=KK+Market+Pune-Satara+Rd+Pune", category: "Fashion", phone: "7887833250", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Style Union", link: "https://www.google.com/maps/search/?api=1&query=Bhargav+Stella+Pune-Satara+Rd+Pune", category: "Fashion", phone: "7304053032", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Drishti Creation", link: "Shop no. 6, Jyoti Height, Katraj, Pune", category: "Fashion", phone: "9145510030", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Tattva fashion designer studio", link: "https://www.instagram.com/_tattva.fashion.studio_?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "7083101616", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "SS Mobile Swargate Pune", link: "https://www.instagram.com/ssmobileswaargate/", category: "Mobile", phone: "8237640051", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Motiwale Sports & Wear", link: "https://www.instagram.com/motiwalesports?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9822451102", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "CORSAGE STUDIO", link: "https://www.instagram.com/corsage.in/", category: "Fashion", phone: "7249099009", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Branded Jackpot", link: "https://www.google.com/maps/search/?api=1&query=Tanaje+Nagar+Dhankawadi+Pune", category: "Fashion", phone: "7304053032", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Surekha Boutique and Paradise", link: "https://www.google.com/maps/search/?api=1&query=KK+Market+Dhankawadi+Pune", category: "Fashion", phone: "7722035699", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "jds mens wear", link: "https://www.instagram.com/_jds.mens.wear_?stkn=cHg5aHJuN3Vra2pi", category: "Fashion", phone: "9529863656", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "House of Kritee", link: "https://www.instagram.com/houseofkritee/", category: "Fashion", phone: "8928877702", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Sai Footwear", link: "https://www.google.com/maps/search/?api=1&query=KK+Market+Rd+Dhankawadi+Pune", category: "Fashion", phone: "9923924005", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Wazir the multi brand01", link: "https://www.google.com/maps/search/?api=1&query=Sahakar+Nagar+Pune", category: "Fashion", phone: "7276144882", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Shloka Sports Shopee", link: "https://www.instagram.com/shloka.sports?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9422089123", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "TUBA MOBILE STORE (PUNE)", link: "https://www.instagram.com/tuba_mobile_store_pune/", category: "Mobile", phone: "9892575157", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Kolte Boutique", link: "https://www.instagram.com/kolte_boutique?stkn=MTN1bXBoMG1wdjZtZw==", category: "Fashion", phone: "8669900483", status: "Not started", createdBy: "Dhiren Lodha" },
  { storeName: "Sarda Fashions", link: "https://www.google.com/maps/search/?api=1&query=K+K+Market+Satara+Rd+Pune", category: "Fashion", phone: "9404140333", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "dhanyeshwar.mobile.shopee", link: "https://www.instagram.com/dhanyeshwar.mobile.shopee/", category: "Mobile", phone: "8888979720", status: "Not started", createdBy: "Vipto" },
  { storeName: "POKARNA ELECTRONICS", link: "https://www.google.com/maps/search/?api=1&query=POKARNA+ELECTRONICS+Satara+Road+Pune", category: "Electronics", phone: "9881123641", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Adaa Fashions", link: "https://www.instagram.com/adaa_fashions_pune/", category: "Fashion", phone: "9823885018", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Wild Squat", link: "https://www.instagram.com/wildsquat.pune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9272068473", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "D K SHOES", link: "https://www.google.com/maps/search/?api=1&query=Shop+No.1+Balaji+Nagar+Pune", category: "Fashion", phone: "9511820231", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "Komfort Shoes", link: "https://www.google.com/maps/search/?api=1&query=Tanaje+Nagar+Dhankawadi+Pune", category: "Fashion", phone: "8928996060", status: "Not started", createdBy: "Sanika Patil" },
  { storeName: "KENSHA MOBILES BALAJINAGAR", link: "https://www.instagram.com/kensha_mobiles_balajinagar/", category: "Mobile", phone: "8007202539", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Vaibhav Creation", link: "https://www.instagram.com/_vaibhav_creation_/", category: "Fashion", phone: "8849171779", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "R K Sports", link: "https://www.instagram.com/r.k.sports_pune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9850765057", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "SHRIRAM MOBILE SHOPEE", link: "https://www.instagram.com/shrirammobileshopee/", category: "Mobile", phone: "9850437765", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Jay Shankar Enterprises", link: "https://www.google.com/maps/search/?api=1&query=Jay+Shankar+Enterprises+Mohan+Nagar+Pune", category: "Mobile", phone: "9284050048", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Pokarna Agencies", link: "https://www.instagram.com/pokarnaagencies", category: "Electronics", phone: "9970472540", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "NARENDRA ELECTRONICS", link: "https://www.instagram.com/narendra_electronics/", category: "Electronics", phone: "9922400490", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Om Sai Electronics", link: "https://www.google.com/maps/search/?api=1&query=Om+Sai+Electronics+Dhankawadi+Pune", category: "Electronics", phone: "8698670108", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Mahalaxmi Fashion Mantra", link: "https://www.instagram.com/mahalaxmi_fashion_mantra?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "8767466126", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "BALAJI ELECTRICAL PUNE MARKET", link: "https://www.instagram.com/balaji_electricals__wholesale_/", category: "Electronics", phone: "8788790401", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Karishma Boutique", link: "https://www.instagram.com/karishma_boutique_pune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "9890054885", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "BALAJI ELECTRONICS", link: "https://www.instagram.com/balaji_electronic_pune/", category: "Electronics", phone: "8237700126", status: "Not started", createdBy: "Krishna Israni" },
  { storeName: "Shubhakanya Silk and Sarees", link: "https://www.instagram.com/shubhakanya_sareepune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "8308224370", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Laptop Hub", link: "https://www.google.com/maps/search/?api=1&query=Laptop+Hub+Trimurti+Chowk+Pune", category: "Electronics", phone: "8585852239", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Universal Enterprises", link: "https://www.google.com/maps/search/?api=1&query=Universal+Enterprises+Balaji+Nagar+Pune", category: "Mobile", phone: "9970177770", status: "Not started", createdBy: "Dhruo Gadhiya" },
  { storeName: "Aneev Sports World", link: "https://www.instagram.com/aneevsportsworld?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9822100987", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Decentral Nutrition & Gym Gear", link: "https://www.instagram.com/decentralizednutrition/?utm_source=ig_web_button_share_sheet", category: "Sports", phone: "9763288901", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Blush boutique", link: "https://www.instagram.com/blush_boutique_kk_market?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "9860468609", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Shakti Sports Pune", link: "https://www.instagram.com/shaktisportspune/?utm_source=ig_web_button_share_sheet", category: "Sports", phone: "9922924292", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Rohini Textiles", link: "https://www.instagram.com/rohini_textiles_pune_2206?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "8460611846", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Nu Life Sports Wear", link: "https://www.instagram.com/nulife_sports_wear/?utm_source=ig_web_button_share_sheet", category: "Sports", phone: "9657719042", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Rutba", link: "https://www.instagram.com/rutba.in?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "9679670100", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Performax", link: "https://www.instagram.com/performaxactivewear/?utm_source=ig_web_button_share_sheet", category: "Sports", phone: "8408889170", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Poonam Fashions", link: "https://www.instagram.com/poonam.fashions/?utm_source=ig_web_button_share_sheet", category: "Fashion", phone: "8208390414", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Empire Sports", link: "https://www.instagram.com/empiresports_hadapsar?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9881230987", status: "Not started", createdBy: "Neha Bhoye" },
  { storeName: "Global Creations", link: "https://www.instagram.com/globalcreationspune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "7775023131", status: "Not started", createdBy: "Khushi Gupta" },
  { storeName: "Sharayu boutique", link: "https://www.instagram.com/sharayuboutique?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "9922059393", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Vidyas Boutique", link: "https://www.instagram.com/vidyas__boutique?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "8122538165", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Aisha's Studio", link: "https://www.instagram.com/aishas_studio__?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Fashion", phone: "7722030506", status: "Not started", createdBy: "Shweta Chavan" },
  { storeName: "Sports Gallery", link: "https://www.instagram.com/sportsgallerypune?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==", category: "Sports", phone: "9158531719", status: "Not started", createdBy: "Neha Bhoye" }
];

// Deduplicate stores by phone number and normalized name
const seenNames = new Set<string>();
const seenPhones = new Set<string>();

export const DEDUPLICATED_CRM_DATA = REAL_CRM_DATA.filter((s) => {
  const normName = s.storeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPhone = s.phone ? s.phone.replace(/\D/g, '').slice(-10) : '';

  if (!normName) return false;

  // Check phone duplicate
  if (cleanPhone && cleanPhone.length >= 10) {
    if (seenPhones.has(cleanPhone)) return false;
    seenPhones.add(cleanPhone);
  }

  // Check store name duplicate
  if (seenNames.has(normName)) return false;
  seenNames.add(normName);

  return true;
});

export async function checkDatabaseEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'sellers'));
    return snap.empty;
  } catch {
    return true;
  }
}

export async function checkIfNeedsRealDataSync(): Promise<boolean> {
  try {
    const synced = localStorage.getItem('vipto_crm_synced_real_data_v5');
    if (synced === 'true') return false;

    return true;
  } catch {
    return true;
  }
}

function normalizeCreatorName(name?: string): string {
  if (!name) return 'Vipto';
  const trimmed = name.trim().toLowerCase();
  if (trimmed.includes('krishna') || trimmed.includes('israni')) return 'Krishna Israni';
  if (trimmed.includes('swaraj') || trimmed.includes('suryavanshi')) return 'Swaraj Suryavanshi';
  if (trimmed.includes('sanika') || trimmed.includes('sanikavpatil')) return 'Sanika Patil';
  if (trimmed.includes('hitesh') || (trimmed.includes('patil') && !trimmed.includes('sanika'))) return 'Hitesh Patil';
  if (trimmed.includes('dhruo') || trimmed.includes('gadhiya')) return 'Dhruo Gadhiya';
  if (trimmed.includes('dhiren') || trimmed.includes('lodha')) return 'Dhiren Lodha';
  if (trimmed.includes('khushi') || trimmed.includes('gupta')) return 'Khushi Gupta';
  if (trimmed.includes('riddhi') || trimmed.includes('gopalani')) return 'Riddhi Gopalani';
  if (trimmed.includes('shweta') || trimmed.includes('chavan')) return 'Shweta Chavan';
  if (trimmed.includes('drishti') || trimmed.includes('bhalotia')) return 'Drishti Bhalotia';
  if (trimmed.includes('neha') || trimmed.includes('bhoye')) return 'Neha Bhoye';
  return 'Vipto';
}

export async function clearAndSeedRealDatabase(onProgress?: (step: string) => void): Promise<void> {
  if (onProgress) onProgress('Clearing duplicates and old data from Firestore...');

  // 1. Delete all existing collections: sellers, employees, tasks, activities, discoveredSellers
  const collectionsToClear = ['sellers', 'employees', 'tasks', 'activities', 'discoveredSellers'];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn(`Could not clear collection ${colName}:`, e);
    }
  }

  if (onProgress) onProgress(`Importing ${DEDUPLICATED_CRM_DATA.length} unique store records...`);

  // 2. Insert deduplicated records
  const CHUNK_SIZE = 250;
  for (let i = 0; i < DEDUPLICATED_CRM_DATA.length; i += CHUNK_SIZE) {
    const chunk = DEDUPLICATED_CRM_DATA.slice(i, i + CHUNK_SIZE);
    const sellerBatch = writeBatch(db);

    chunk.forEach((s) => {
      const sellerRef = doc(collection(db, 'sellers'));
      const cleanPhone = s.phone ? s.phone.replace(/\D/g, '').slice(-10) : '';
      const searchKeywords = generateSearchKeywords({
        name: s.storeName,
        shopName: s.storeName,
        phone: cleanPhone,
        category: s.category,
      });

      const isMap = s.link.includes('maps') || s.link.includes('goo.gl');
      const isInstagram = s.link.includes('instagram.com');
      const creator = normalizeCreatorName(s.createdBy);

      const dataPayload: any = {
        name: s.storeName.trim(),
        shopName: s.storeName.trim(),
        googleMapOrInstagramLink: s.link.trim(),
        websiteUrl: s.link.trim() || '',
        category: s.category || 'Fashion',
        phone: cleanPhone,
        whatsapp: cleanPhone,
        sellerStatus: s.status || 'Not started',
        contactStatus: 'Not Contacted',
        onboardingStatus: 'Not Started',
        priority: 'Medium',
        leadSource: isInstagram ? 'Instagram' : isMap ? 'Google Maps' : 'Field Research',
        createdByName: creator,
        city: 'Pune',
        searchKeywords,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isMap && s.link.trim()) {
        dataPayload.location = { googleMapsUrl: s.link.trim() };
      }
      if (isInstagram && s.link.trim()) {
        dataPayload.socialLinks = { instagram: s.link.trim() };
      }

      sellerBatch.set(sellerRef, dataPayload);
    });

    await sellerBatch.commit();
  }

  localStorage.setItem('vipto_crm_synced_real_data_v5', 'true');
  if (onProgress) onProgress(`Loaded ${DEDUPLICATED_CRM_DATA.length} unique stores!`);
}

export async function seedViptoDatabase(onProgress?: (step: string) => void): Promise<void> {
  const isEmpty = await checkDatabaseEmpty();
  if (!isEmpty) {
    if (onProgress) onProgress('Database already contains seller records. Skipping overwrite.');
    return;
  }

  if (onProgress) onProgress(`Importing initial ${DEDUPLICATED_CRM_DATA.length} store records...`);

  const CHUNK_SIZE = 250;
  for (let i = 0; i < DEDUPLICATED_CRM_DATA.length; i += CHUNK_SIZE) {
    const chunk = DEDUPLICATED_CRM_DATA.slice(i, i + CHUNK_SIZE);
    const sellerBatch = writeBatch(db);

    chunk.forEach((s) => {
      const sellerRef = doc(collection(db, 'sellers'));
      const cleanPhone = s.phone ? s.phone.replace(/\D/g, '').slice(-10) : '';
      const searchKeywords = generateSearchKeywords({
        name: s.storeName,
        shopName: s.storeName,
        phone: cleanPhone,
        category: s.category,
      });

      const isMap = s.link.includes('maps') || s.link.includes('goo.gl');
      const isInstagram = s.link.includes('instagram.com');
      const creator = normalizeCreatorName(s.createdBy);

      const dataPayload: any = {
        name: s.storeName.trim(),
        shopName: s.storeName.trim(),
        googleMapOrInstagramLink: s.link.trim(),
        websiteUrl: s.link.trim() || '',
        category: s.category || 'Fashion',
        phone: cleanPhone,
        whatsapp: cleanPhone,
        sellerStatus: s.status || 'Not started',
        contactStatus: 'Not Contacted',
        onboardingStatus: 'Not Started',
        priority: 'Medium',
        leadSource: isInstagram ? 'Instagram' : isMap ? 'Google Maps' : 'Field Research',
        createdByName: creator,
        city: 'Pune',
        searchKeywords,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isMap && s.link.trim()) {
        dataPayload.location = { googleMapsUrl: s.link.trim() };
      }
      if (isInstagram && s.link.trim()) {
        dataPayload.socialLinks = { instagram: s.link.trim() };
      }

      sellerBatch.set(sellerRef, dataPayload);
    });

    await sellerBatch.commit();
  }

  localStorage.setItem('vipto_crm_synced_real_data_v5', 'true');
  if (onProgress) onProgress(`Loaded ${DEDUPLICATED_CRM_DATA.length} unique stores!`);
}

