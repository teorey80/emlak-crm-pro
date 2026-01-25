import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Trash2, MapPin, Globe, Store, Wand2, Loader2, Link, FileText, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { Property, Customer } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateRealEstateAdvice } from '../services/geminiService';

// Türkiye'nin 81 İli ve İlçeleri
const ALL_CITIES_DISTRICTS: Record<string, string[]> = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
  "Aksaray": ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi", "Sultanhanı"],
  "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Ardahan": ["Çıldır", "Damal", "Göle", "Hanak", "Merkez", "Posof"],
  "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bartın": ["Amasra", "Kurucaşile", "Merkez", "Ulus"],
  "Batman": ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"],
  "Bayburt": ["Aydıntepe", "Demirözü", "Merkez"],
  "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
  "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"],
  "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Merkez", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
  "Hakkari": ["Çukurca", "Derecik", "Merkez", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Iğdır": ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
  "Karabük": ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"],
  "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kırıkkale": ["Bahşılı", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
  "Kilis": ["Elbeyli", "Merkez", "Musabeyli", "Polateli"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Osmaniye": ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazımiye", "Ovacık", "Pertek", "Pülümür"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"],
  "Yalova": ["Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Merkez", "Termal"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Sorgun", "Şefaatli", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"]
};

// Detaylı Mahalle Verisi (Kapsamlı Veri Seti)
const DETAILED_NEIGHBORHOODS: Record<string, Record<string, string[]>> = {
  'İstanbul': {
    'Adalar': ['Burgazada', 'Heybeliada', 'Kınalıada', 'Maden', 'Nizam'],
    'Arnavutköy': ['Adnan Menderes', 'Anadolu', 'Arnavutköy Merkez', 'Atatürk', 'Baklalı', 'Balaban', 'Boğazköy İstiklal', 'Bolluca', 'Boyalık', 'Çilingir', 'Deliklikaya', 'Dursunköy', 'Durusu', 'Fatih', 'Hacımaşlı', 'Hadımköy', 'Haraççı', 'Hastane', 'Hicret', 'İmrahor', 'İslambey', 'Karaburun', 'Karlıbayır', 'M.Fevzi Çakmak', 'Mavigöl', 'Mehmet Akif Ersoy', 'Mustafa Kemal Paşa', 'Nenehatun', 'Ömerli', 'Sazlıbosna', 'Taşoluk', 'Tayakadın', 'Terkos', 'Yassıören', 'Yavuz Selim', 'Yeniköy', 'Yeşilbayır', 'Yunus Emre'],
    'Ataşehir': ['Aşık Veysel', 'Ataşehir Atatürk', 'Barbaros', 'Esatpaşa', 'Ferhatpaşa', 'Fetih', 'İçerenköy', 'İnönü', 'Kayışdağı', 'Küçükbakkalköy', 'Mevlana', 'Mimar Sinan', 'Mustafa Kemal', 'Örnek', 'Yeni Çamlıca', 'Yenisahra', 'Yenişehir'],
    'Avcılar': ['Ambarlı', 'Cihangir', 'Denizköşkler', 'Firuzköy', 'Gümüşpala', 'Merkez', 'Mustafa Kemal Paşa', 'Tahtakale', 'Üniversite', 'Yeşilkent'],
    'Bağcılar': ['100. Yıl', '15 Temmuz', 'Bağlar', 'Barbaros', 'Çınar', 'Demirkapı', 'Fatih', 'Fevzi Çakmak', 'Göztepe', 'Güneşli', 'Hürriyet', 'İnönü', 'Kazım Karabekir', 'Kirazlı', 'Mahmutbey', 'Merkez', 'Sancaktepe', 'Yavuz Selim', 'Yenigün', 'Yenimahalle', 'Yıldıztepe'],
    'Bahçelievler': ['Bahçelievler', 'Cumhuriyet', 'Çobançeşme', 'Fevzi Çakmak', 'Hürriyet', 'Kocasinan Merkez', 'Siyavuşpaşa', 'Soğanlı', 'Şirinevler', 'Yenibosna Merkez', 'Zafer'],
    'Bakırköy': ['Ataköy 1. Kısım', 'Ataköy 2-5-6. Kısım', 'Ataköy 3-4-11. Kısım', 'Ataköy 7-8-9-10. Kısım', 'Basınköy', 'Cevizlik', 'Kartaltepe', 'Osmaniye', 'Sakızağacı', 'Şenlikköy', 'Yenimahalle', 'Yeşilköy', 'Yeşilyurt', 'Zeytinlik', 'Zuhuratbaba'],
    'Başakşehir': ['Altınşehir', 'Bahçeşehir 1. Kısım', 'Bahçeşehir 2. Kısım', 'Başak', 'Başakşehir', 'Güvercintepe', 'İkitelli OSB', 'Kayabaşı', 'Şahintepe', 'Şamlar', 'Ziya Gökalp'],
    'Bayrampaşa': ['Altıntepsi', 'Cevatpaşa', 'İsmet Paşa', 'Kartaltepe', 'Kocatepe', 'Muratpaşa', 'Ortamahalle', 'Terazidere', 'Vatan', 'Yenidoğan', 'Yıldırım'],
    'Beşiktaş': ['Abbasağa', 'Akat', 'Arnavutköy', 'Balmumcu', 'Bebek', 'Cihannüma', 'Dikilitaş', 'Etiler', 'Gayrettepe', 'Konaklar', 'Kuruçeşme', 'Kültür', 'Levazım', 'Levent', 'Mecidiye', 'Muradiye', 'Nisbetiye', 'Ortaköy', 'Sinanpaşa', 'Türkali', 'Ulus', 'Vişnezade', 'Yıldız'],
    'Beykoz': ['Acarlar', 'Akbaba', 'Alibahadır', 'Anadolu Hisarı', 'Anadolu Kavağı', 'Anadolufeneri', 'Baklacı', 'Bozhane', 'Cumhuriyet', 'Çamlıbahçe', 'Çengeldere', 'Çiftlik', 'Çiğdem', 'Çubuklu', 'Dereseki', 'Elmalı', 'Fatih', 'Görele', 'Göztepe', 'Gümüşsuyu', 'İncirköy', 'İshaklı', 'Kanlıca', 'Kavacık', 'Kaynarca', 'Kılıçlı', 'Mahmutşevketpaşa', 'Merkez', 'Ortaçeşme', 'Öyümce', 'Paşabahçe', 'Paşamandıra', 'Polonezköy', 'Poyrazköy', 'Riva', 'Rüzgarlıbahçe', 'Soğuksu', 'Tokatköy', 'Yalıköy', 'Yavuz Selim', 'Yeni Mahalle', 'Zerzavatçı'],
    'Beylikdüzü': ['Adnan Kahveci', 'Barış', 'Büyükşehir', 'Cumhuriyet', 'Dereağzı', 'Gürpınar', 'Kavaklı', 'Marmara', 'Sahil', 'Yakuplu'],
    'Beyoğlu': ['Arap Cami', 'Asmalı Mescit', 'Bedrettin', 'Bereketzade', 'Bostan', 'Bülbül', 'Camiikebir', 'Cihangir', 'Çatmamescit', 'Çukur', 'Emekyemez', 'Evliya Çelebi', 'Fetihtepe', 'Firuzağa', 'Gümüşsuyu', 'Hacıahmet', 'Hacımimi', 'Halıcıoğlu', 'Hüseyinağa', 'İstiklal', 'Kadımehmet Efendi', 'Kalyoncu Kulluğu', 'Kaptanpaşa', 'Katipmustafa Çelebi', 'Keçecipiri', 'Kemankeş Karamustafa Paşa', 'Kılıçalipaşa', 'Kocatepe', 'Kulaksız', 'Kuloğlu', 'Küçük Piyale', 'Müeyyetzade', 'Örnektepe', 'Piri Paşa', 'Piyalepaşa', 'Pürtelaş Hasan Efendi', 'Sururi Mehmet Efendi', 'Sütlüce', 'Şahkulu', 'Şehit Muhtar', 'Tomtom', 'Yahya Kahya', 'Yenişehir'],
    'Büyükçekmece': ['19 Mayıs', 'Ahmediye', 'Alkent 2000', 'Atatürk', 'Bahçelievler', 'Celaliye', 'Cumhuriyet', 'Çakmaklı', 'Dizdariye', 'Ekinoba', 'Fatih', 'Güzelce', 'Hürriyet', 'Kamiloba', 'Karaağaç', 'Kumburgaz', 'Mimaroba', 'Mimarsinan', 'Muratçeşme', 'Pınartepe', 'Sinanoba', 'Türkoba', 'Ulus', 'Yenimahalle'],
    'Çatalca': ['Akalan', 'Atatürk', 'Aydınlar', 'Bahşayiş', 'Başak', 'Belgrat', 'Celepköy', 'Çakıl', 'Çanakça', 'Çiftlikköy 1', 'Dağyenice', 'Elbasan', 'Fatih', 'Ferhatpaşa', 'Gökçeali', 'Gümüşpınar', 'Hallaçlı', 'Hisarbeyli', 'İhsaniye', 'İnceğiz', 'İzzettin', 'Kabakça', 'Kaleiçi', 'Kalfa', 'Karacaköy Merkez', 'Karamandere', 'Kestanelik', 'Kızılcaali', 'Muratbey Merkez', 'Nakkaş', 'Oklalı', 'Ormanlı', 'Ovayenice', 'Örcünlü', 'Subaşı', 'Yalıköy', 'Yaylacık', 'Yazlık'],
    'Çekmeköy': ['Alemdağ', 'Aydınlar', 'Cumhuriyet', 'Çamlık', 'Çatalmeşe', 'Ekşioğlu', 'Güngören', 'Hamidiye', 'Hüseyli', 'Kirazlıdere', 'Koçullu', 'Mehmet Akif', 'Merkez', 'Mimar Sinan', 'Nişantepe', 'Ömerli', 'Reşadiye', 'Sırapınar', 'Soğukpınar', 'Sultançiftliği', 'Taşdelen'],
    'Esenler': ['Birlik', 'Çifte Havuzlar', 'Davutpaşa', 'Fatih', 'Fevzi Çakmak', 'Havaalanı', 'Kazım Karabekir', 'Kemer', 'Menderes', 'Mimar Sinan', 'Namık Kemal', 'Nine Hatun', 'Oruçreis', 'Tuna', 'Turgut Reis', 'Yavuz Selim'],
    'Esenyurt': ['Akçaburgaz', 'Akevler', 'Akşemseddin', 'Ardıçlı', 'Aşık Veysel', 'Atatürk', 'Bağlarçeşme', 'Balıkyolu', 'Barbaros Hayrettin Paşa', 'Battalgazi', 'Cumhuriyet', 'Çınar', 'Esenkent', 'Fatih', 'Gökevler', 'Güzelyurt', 'Hürriyet', 'İncirtepe', 'İnönü', 'İstiklal', 'Koza', 'Mehmet Akif Ersoy', 'Mehterçeşme', 'Mevlana', 'Namık Kemal', 'Necip Fazıl Kısakürek', 'Orhangazi', 'Osmangazi', 'Pınar', 'Piri Reis', 'Saadetdere', 'Selahaddin Eyyubi', 'Sultaniye', 'Süleyman Demirel', 'Şehitler', 'Talatpaşa', 'Turgut Özal', 'Üçevler', 'Yenikent', 'Yeşilkent', 'Yunus Emre', 'Zafer'],
    'Eyüpsultan': ['5. Levent', 'Ağaçlı', 'Akpınar', 'Akşemsettin', 'Alibeyköy', 'Çırçır', 'Çiftalan', 'Defterdar', 'Düğmeciler', 'Emniyettepe', 'Esentepe', 'Eyüp Merkez', 'Göktürk Merkez', 'Güzeltepe', 'Işıklar', 'İhsaniye', 'İslambey', 'Karadolap', 'Mimar Sinan', 'Mithatpaşa', 'Nişancı', 'Odayeri', 'Pir,inççi', 'Rami Cuma', 'Rami Yeni', 'Sakarya', 'Silahtarağa', 'Topçular', 'Yeşilpınar'],
    'Fatih': ['Aksaray', 'Akşemsettin', 'Alemdar', 'Ali Kuşçu', 'Atikali', 'Ayvansaray', 'Balabanağa', 'Balat', 'Beyazıt', 'Binbirdirek', 'Cankurtaran', 'Cerrahpaşa', 'Cibali', 'Demirtaş', 'Derviş Ali', 'Emin Sinan', 'Hacı Kadın', 'Haseki Sultan', 'Hırka-i Şerif', 'Hobyar', 'Hoca Gıyasettin', 'Hoca Paşa', 'İskenderpaşa', 'Kalenderhane', 'Karagümrük', 'Katip Kasım', 'Kemal Paşa', 'Kocamustafapaşa', 'Küçük Ayasofya', 'Mercan', 'Mesih Paşa', 'Mevlanakapı', 'Mimar Hayrettin', 'Mimar Kemalettin', 'Molla Fenari', 'Molla Gürani', 'Molla Hüsrev', 'Muhsine Hatun', 'Nişanca', 'Rüstem Paşa', 'Saraç İshak', 'Sarıdemir', 'Seyyid Ömer', 'Silivrikapı', 'Sultan Ahmet', 'Sururi', 'Süleymaniye', 'Sümbül Efendi', 'Şehremini', 'Şehsuvar Bey', 'Tahtakale', 'Taya Hatun', 'Topkapı', 'Yavuz Sinan', 'Yavuz Sultan Selim', 'Yedikule', 'Zeyrek'],
    'Gaziosmanpaşa': ['Bağlarbaşı', 'Barbaros Hayrettin Paşa', 'Fevzi Çakmak', 'Hürriyet', 'Karadeniz', 'Karayolları', 'Karlıtepe', 'Kazım Karabekir', 'Merkez', 'Mevlana', 'Pazariçi', 'Sarıgöl', 'Şemsipaşa', 'Yeni Mahalle', 'Yenidoğan', 'Yıldıztabya'],
    'Güngören': ['Abdurrahman Nafiz Gürman', 'Akıncılar', 'Gençosman', 'Güneştepe', 'Güven', 'Haznedar', 'Mareşal Çakmak', 'Mehmet Nesih Özmen', 'Merkez', 'Sanayi', 'Tozkoparan'],
    'Kadıköy': ['19 Mayıs', 'Acıbadem', 'Bostancı', 'Caddebostan', 'Caferağa', 'Dumlupınar', 'Eğitim', 'Erenköy', 'Fenerbahçe', 'Feneryolu', 'Fikirtepe', 'Göztepe', 'Hasanpaşa', 'Koşuyolu', 'Kozyatağı', 'Merdivenköy', 'Moda', 'Osmanağa', 'Rasimpaşa', 'Sahrayıcedit', 'Suadiye', 'Zühtüpaşa'],
    'Kağıthane': ['Çağlayan', 'Çeliktepe', 'Emniyet Evleri', 'Gültepe', 'Gürsel', 'Hamidiye', 'Harmantepe', 'Hürriyet', 'Mehmet Akif Ersoy', 'Merkez', 'Nurtepe', 'Ortabayır', 'Sanayi', 'Seyrantepe', 'Sultan Selim', 'Şirintepe', 'Talatpaşa', 'Telsizler', 'Yahya Kemal', 'Yeşilce'],
    'Kartal': ['Atalar', 'Cevizli', 'Cumhuriyet', 'Çavuşoğlu', 'Esentepe', 'Gümüşpınar', 'Hürriyet', 'Karlıktepe', 'Kordonboyu', 'Orhantepe', 'Orta', 'Petrol İş', 'Soğanlık Yeni', 'Topselvi', 'Uğur Mumcu', 'Yakacık Çarşı', 'Yakacık Yeni', 'Yalı', 'Yukarı', 'Yunus'],
    'Küçükçekmece': ['Atakent', 'Atatürk', 'Beşyol', 'Cennet', 'Cumhuriyet', 'Fatih', 'Fevzi Çakmak', 'Gültepe', 'Halkalı Merkez', 'İnönü', 'İstasyon', 'Kanarya', 'Kartaltepe', 'Kemalpaşa', 'Mehmet Akif', 'Söğütlü Çeşme', 'Sultan Murat', 'Tevfikbey', 'Yarımburgaz', 'Yeni Mahalle', 'Yeşilova'],
    'Maltepe': ['Altayçeşme', 'Altıntepe', 'Aydınevler', 'Bağlarbaşı', 'Başıbüyük', 'Büyükbakkalköy', 'Cevizli', 'Çınar', 'Esenkent', 'Feyzullah', 'Fındıklı', 'Girne', 'Gülensu', 'Gülsuyu', 'İdealtepe', 'Küçükyalı', 'Yalı', 'Zümrütevler'],
    'Pendik': ['Ahmet Yesevi', 'Bahçelievler', 'Ballıca', 'Batı', 'Çamçeşme', 'Çamlık', 'Çınardere', 'Doğu', 'Dumlupınar', 'Emirli', 'Ertuğrul Gazi', 'Esenler', 'Esenyalı', 'Fatih', 'Fevzi Çakmak', 'Göçbeyli', 'Güllü Bağlar', 'Güzelyalı', 'Harmandere', 'Kavakpınar', 'Kaynarca', 'Kurna', 'Kurtdoğmuş', 'Kurtköy', 'Orhangazi', 'Orta', 'Ramazanoğlu', 'Sanayi', 'Sapan Bağları', 'Sülüntepe', 'Şeyhli', 'Velibaba', 'Yayalar', 'Yeni Mahalle', 'Yenişehir', 'Yeşilbağlar'],
    'Sancaktepe': ['Abdurrahmangazi', 'Akpınar', 'Atatürk', 'Emek', 'Eyüp Sultan', 'Fatih', 'Hilal', 'İnönü', 'Kemal Türkler', 'Meclis', 'Merve', 'Mevlana', 'Osmangazi', 'Paşaköy', 'Safa', 'Sarıgazi', 'Veysel Karani', 'Yenidoğan', 'Yunus Emre'],
    'Sarıyer': ['Baltalimanı', 'Bahçeköy Merkez', 'Bahçeköy Yeni', 'Büyükdere', 'Camikebir', 'Cumhuriyet', 'Çayırbaşı', 'Darüşşafaka', 'Demirci', 'Emirgan', 'Fatih Sultan Mehmet', 'Ferahevler', 'Garipçe', 'Gümüşdere', 'Huzur', 'İstinye', 'Kazım Karabekir', 'Kısırkaya', 'Kireçburnu', 'Kocataş', 'Kumköy (Kilyos)', 'Maden', 'Maslak', 'Merkez', 'Pınar', 'Poligon', 'P.T.T. Evleri', 'Reşitpaşa', 'Rumeli Feneri', 'Rumelihisarı', 'Rumeli Kavağı', 'Tarabya', 'Uskumruköy', 'Yeniköy', 'Yenimahalle', 'Zekeriyaköy'],
    'Silivri': ['Alibey', 'Alipaşa', 'Balaban', 'Bekirli', 'Beyciler', 'Büyükçavuşlu', 'Büyükkılıçlı', 'Cumhuriyet', 'Çayırdere', 'Çeltik', 'Danamandıra', 'Fatih', 'Fener', 'Fevzipaşa', 'Gazitepe', 'Gümüşyaka', 'İsmetpaşa', 'Kadıköy', 'Kavaklı', 'Kurfallı', 'Küçük Kılıçlı', 'Küçük Sinekli', 'Mimar Sinan', 'Ortaköy', 'Piri Mehmet Paşa', 'Sancaktepe', 'Sayalar', 'Selimpaşa', 'Semizkumlar', 'Seymen', 'Sinekli', 'Yeni Mahalle', 'Yolçatı'],
    'Sultanbeyli': ['Abdurrahmangazi', 'Adil', 'Ahmet Yesevi', 'Akşemsettin', 'Battalgazi', 'Fatih', 'Hamidiye', 'Hasanpaşa', 'Mecidiye', 'Mehmet Akif', 'Mimar Sinan', 'Necip Fazıl', 'Orhangazi', 'Turgut Reis', 'Yavuz Selim'],
    'Sultangazi': ['50. Yıl', '75. Yıl', 'Cebeci', 'Cumhuriyet', 'Esentepe', 'Eski Habipler', 'Gazi', 'Habipler', 'İsmetpaşa', 'Malkoçoğlu', 'Sultançiftliği', 'Uğur Mumcu', 'Yayla', 'Yunus Emre', 'Zübeyde Hanım'],
    'Şile': ['Ağaçdere', 'Ağva Merkez', 'Ahmetli', 'Akçakese', 'Alacalı', 'Avcıkoru', 'Balibey', 'Bıçkıdere', 'Bozgoca', 'Bucaklı', 'Çataklı', 'Çayırbaşı', 'Çelebi', 'Çengilli', 'Darlık', 'Değirmençayırı', 'Doğancılı', 'Erenler', 'Esenceli', 'Geredeli', 'Göçe', 'Gökmaslı', 'Göksu', 'Hacıkasım', 'Hasanlı', 'İmrendere', 'İsaköy', 'Kabakoz', 'Kadıköy', 'Kalem', 'Karabeyli', 'Karakiraz', 'Karamandere', 'Kervansaray', 'Kızılca', 'Kömürlük', 'Korucu', 'Kurfallı', 'Kurna', 'Kumbaba', 'Meşrutiyet', 'Oruçoğlu', 'Osmanköy', 'Ovacık', 'Sahilköy', 'Satmazlı', 'Sofular', 'Soğullu', 'Sortullu', 'Şuayipli', 'Teke', 'Ulupelit', 'Üvezli', 'Yaka', 'Yaylalı', 'Yazımanayır', 'Yeniköy', 'Yeşilvadi'],
    'Şişli': ['19 Mayıs', 'Bozkurt', 'Cumhuriyet', 'Duatepe', 'Ergenekon', 'Esentepe', 'Eskişehir', 'Feriköy', 'Fulya', 'Gülbahar', 'Halaskargazi', 'Halide Edip Adıvar', 'Halil Rıfat Paşa', 'Harbiye', 'Hüzzetpaşa', 'İnönü', 'Kaptanpaşa', 'Kuştepe', 'Mahmut Şevket Paşa', 'Mecidiyeköy', 'Meşrutiyet', 'Paşa', 'Teşvikiye', 'Yayla'],
    'Tuzla': ['Akfırat', 'Anadolu', 'Aydınlı', 'Aydıntepe', 'Cami', 'Evliya Çelebi', 'Fatih', 'İçmeler', 'İstasyon', 'Mescit', 'Mimar Sinan', 'Orhanlı', 'Orta', 'Postane', 'Şifa', 'Tepeören', 'Yayla'],
    'Ümraniye': ['Adem Yavuz', 'Altınşehir', 'Armağanevler', 'Aşağı Dudullu', 'Atakent', 'Atatürk', 'Cemil Meriç', 'Çakmak', 'Çamlık', 'Dumlupınar', 'Elmalıkent', 'Esenevler', 'Esenkent', 'Esencehir', 'Fatih Sultan Mehmet', 'Finanskent', 'Hekimbaşı', 'Huzur', 'Ihlamurkuyu', 'İnkılap', 'İstiklal', 'Kazım Karabekir', 'Madenler', 'Mehmet Akif', 'Namık Kemal', 'Necip Fazıl', 'Parseller', 'Saray', 'Site', 'Şerifali', 'Tantavi', 'Tatlısu', 'Tepeüstü', 'Topağacı', 'Yamanevler', 'Yeni Sanayi', 'Yukarı Dudullu'],
    'Üsküdar': ['Acıbadem', 'Ahmediye', 'Altunizade', 'Aziz Mahmud Hüdayi', 'Bahçelievler', 'Barbaros', 'Beylerbeyi', 'Bulgurlu', 'Burhaniye', 'Cumhuriyet', 'Çengelköy', 'Ferah', 'Güzeltepe', 'İcadiye', 'Kandilli', 'Kısıklı', 'Kirazlıtepe', 'Kuleli', 'Kuzguncuk', 'Küçük Çamlıca', 'Küçüksu', 'Mehmet Akif Ersoy', 'Mimar Sinan', 'Murat Reis', 'Salacak', 'Selamiali', 'Selimiye', 'Sultantepe', 'Ünalan', 'Valide-i Atik', 'Yavuztürk', 'Zeynep Kamil'],
    'Zeytinburnu': ['Beştelsiz', 'Çırpıcı', 'Gökalp', 'Kazlıçeşme', 'Maltepe', 'Merkezefendi', 'Nuripaşa', 'Seyitnizam', 'Sümer', 'Telsiz', 'Veliefendi', 'Yenidoğan', 'Yeşiltepe']
  },
  'Ankara': {
    'Çankaya': ['Kızılay', '100. Yıl', 'Ahlatlıbel', 'Akarlar', 'Akpınar', 'Anıttepe', 'Aşağı Dikmen', 'Aşağı Öveçler', 'Aşıkpaşa', 'Ata', 'Aydınlar', 'Ayrancı', 'Aziziye', 'Bademlidere', 'Bağcılar', 'Bahçelievler', 'Balgat', 'Barbaros', 'Bayraktar', 'Beytepe', 'Birlik', 'Bozkurt', 'Büyükesat', 'Cebeci', 'Cevizlidere', 'Cumhuriyet', 'Çamlıtepe', 'Çankaya', 'Çavuşlu', 'Çayyolu', 'Çiğdem', 'Çukurambar', 'Devlet', 'Dilekler', 'Dodurga', 'Doğuş', 'Ehlibeyt', 'Emek', 'Ertuğrul Gazi', 'Erzurum', 'Esatoğlu', 'Eti', 'Fakülteler', 'Fidanlık', 'Gaziosmanpaşa', 'Gökkuşağı', 'Göktürk', 'Güvenevler', 'Güzeltepe', 'Harbiye', 'Hilal', 'Huzur', 'İleri', 'İlkadım', 'İlkbahar', 'İlker', 'İncesu', 'Karataş', 'Kavaklıdere', 'Kazım Özalp', 'Keklik Pınarı', 'Kırkkonaklar', 'Kocatepe', 'Konutkent', 'Korkutreis', 'Koru', 'Kültür', 'Maltepe', 'Mebusevleri', 'Meşrutiyet', 'Metin Akkuş', 'Metin Oktay', 'Mimar Sinan', 'Muhsin Ertuğrul', 'Murat', 'Mustafa Kemal', 'Mutlukent', 'Mürsel Uluç', 'Naci Çakır', 'Namık Kemal', 'Nasuh Akar', 'Oğuzlar', 'Oran', 'Orta İmrahor', 'Osman Temiz', 'Ön Cebeci', 'Öveçler', 'Remzi Oğuz Arık', 'Sağlık', 'Sancak', 'Seyranbağları', 'Sokullu Mehmet Paşa', 'Söğütözü', 'Şehit Cengiz Karaca', 'Şehit Cevdet Özdemir', 'Tınaztepe', 'Topraklık', 'Umut', 'Ümit', 'Üniversiteler', 'Yakupabdal', 'Yaşamkent', 'Yıldızevler', 'Yukarı Bahçelievler', 'Yukarı Dikmen', 'Yukarı Öveçler', 'Yücetepe', 'Zafertepe'],
    'Keçiören': ['19 Mayıs', '23 Nisan', 'Adnan Menderes', 'Aktepe', 'Aşağı Eğlence', 'Atapark', 'Ayvalı', 'Bademlik', 'Bağlarbaşı', 'Bağlum Güzelyurt', 'Basınevleri', 'Çaldıran', 'Çiçekli', 'Emrah', 'Esertepe', 'Etlik', 'Güçlükaya', 'Gümüşdere', 'Güzelyurt', 'Hasköy', 'Hisar', 'İncirli', 'Kafkas', 'Kalaba', 'Kanuni', 'Karakaya', 'Karşıyaka', 'Kavacık Subayevleri', 'Köşk', 'Kuşcağız', 'Osmangazi', 'Ovacık', 'Pınarbaşı', 'Sancaktepe', 'Şefkat', 'Şehit Kubilay', 'Şenlik', 'Tepebaşı', 'Ufuktepe', 'Uyanış', 'Yakacık', 'Yayla', 'Yeşilöz', 'Yeşiltepe', 'Yükseltepe'],
    'Yenimahalle': ['25 Mart', 'Anadolu', 'Aşağı Yahyalar', 'Avcılar', 'Barış', 'Barıştepe', 'Batı Sitesi', 'Beştepe', 'Burç', 'Çamlıca', 'Çarşı', 'Çiğdemtepe', 'Demetevler', 'Demetgül', 'Demetlale', 'Emniyet', 'Ergazi', 'Ergenekon', 'Esentepe', 'Gayret', 'Gazi', 'Güventepe', 'Güzelyaka', 'Işınlar', 'İlkyerleşim', 'İnönü', 'İvedik', 'İvedik OSB', 'Kaletepe', 'Karacakaya', 'Kardelen', 'Karşıyaka', 'Kayalar', 'Kentkoop', 'Kuzey Yıldızı', 'Macun', 'Mehmet Akif Ersoy', 'Memlik', 'Ostim', 'Ostim OSB', 'Özevler', 'Pamuklar', 'Ragıp Tüzün', 'Serhat', 'Susuz', 'Tepealtı', 'Turgut Özal', 'Uğur Mumcu', 'Varlık', 'Yakacık', 'Yeni Batı', 'Yeşilevler', 'Yukarı Yahyalar', 'Yunus Emre', 'Yuva'],
    'Mamak': ['Abidinpaşa', 'Akdere', 'Akşemsettin', 'Altıağaç', 'Altınevler', 'Anayurt', 'Araplar', 'Aşık Veysel', 'Bahçeleriçi', 'Bahçelerüstü', 'Balkiraz', 'Başak', 'Bayındır', 'Boğaziçi', 'Bostancık', 'Büyükkayaş', 'Cengizhan', 'Çağlayan', 'Çiğiltepe', 'Demirlibahçe', 'Derbent', 'Dostlar', 'Durali Alıç', 'Ege', 'Ekin', 'Fahri Korutürk', 'General Zeki Doğan', 'Gökçeyurt', 'Gülseren', 'Gülveren', 'Harman', 'Hürel', 'Hüsewingazi', 'Karaağaç', 'Karşıyaka', 'Kartaltepe', 'Kıbrısköy', 'Kızılca', 'Köstence', 'Kusunlar', 'Kutlu', 'Küçük Kayaş', 'Lalahan', 'Mehtap', 'Misket', 'Mutlu', 'Ortaköy', 'Peyami Safa', 'Saimekadın', 'Şafaktepe', 'Şahap Gürler', 'Şahintepe', 'Şirintepe', 'Tepecik', 'Tuzluçayır', 'Türközü', 'Üreğil', 'Yukarı İmrahor', 'Yeşilbayır'],
    'Etimesgut': ['30 Ağustos', 'Ahimesut', 'Alsancak', 'Altay', 'Aşağıyurtçu', 'Atakent', 'Ayyıldız', 'Bağlıca', 'Bahçekapı', 'Balıkuyumcu', 'Elvan', 'Erler', 'Eryaman', 'Etiler', 'Fatih Sultan', 'Fevziye', 'Göksu', 'Güzelkent', 'İstasyon', 'Kazım Karabekir', 'Oğuzlar', 'Piyade', 'Süvari', 'Şehit Osman Avcı', 'Şehitalı', 'Şeker', 'Şeyh Şamil', 'Topçu', 'Tunahan', 'Turkuaz', 'Yapracık', 'Yavuz Selim', 'Yeşilova', 'Yukarıyurtçu'],
    'Altındağ': ['Atıfbey', 'Aydıncık', 'Aydınlıkevler', 'Baraj', 'Başpınar', 'Battalgazi', 'Beşikkaya', 'Doğantepe', 'Feridun Çelik', 'Gökçenefe', 'Gültepe', 'Güneşevler', 'Hacettepe', 'Hacı Bayram', 'Karacaören', 'Karakum', 'Karapürçek', 'Kavaklı', 'Önder', 'Örnek', 'Peçenek', 'Siteler', 'Tatlar', 'Ulubey', 'Yıldıztepe', 'Ziraat', 'Zübeyde Hanım']
  },
  'İzmir': {
    'Konak': ['1. Kadriye', '2. Kadriye', '19 Mayıs', 'Akdeniz', 'Akarcalı', 'Alsancak', 'Altay', 'Altınordu', 'Atamer', 'Atilla', 'Ballıkuyu', 'Barbaros', 'Basmane', 'Boğaziçi', 'Cengiz Topel', 'Çankaya', 'Çınarlı', 'Çimentepe', 'Dayıemir', 'Dolaplıkuyu', 'Ege', 'Emir Sultan', 'Etiler', 'Faik Paşa', 'Fatih', 'Ferahlı', 'Fevzi Paşa', 'Göztepe', 'Gültepe', 'Güneş', 'Güneşli', 'Güney', 'Güzelyalı', 'Halkapınar', 'Hasan Özdemir', 'Hilal', 'Hurşidiye', 'Huzur', 'İmariye', 'İsmet Kaptan', 'İsmet Paşa', 'Kadifekale', 'Kahraman Mescit', 'Kahramanlar', 'Kemal Reis', 'Kestelli', 'Kılıç Reis', 'Konak', 'Kosova', 'Kubilay', 'Kurtuluş', 'Küçükada', 'Kültür', 'Lale', 'Levent', 'Mecidiye', 'Mehmet Akif', 'Mehmet Ali Akman', 'Mehtap', 'Mersinli', 'Millet', 'Mimar Sinan', 'Mirali', 'Mithatpaşa', 'Murat', 'Murat Reis', 'Namık Kemal', 'Odunkapı', 'Oğuzlar', 'Pazaryeri', 'Piri Reis', 'Sakarya', 'Saygı', 'Selçuk', 'Süleymaniye', 'Şehit Nedim Tuğaltay', 'Tan', 'Tınaztepe', 'Trakya', 'Turgut Reis', 'Tuzcu', 'Türkyılmaz', 'Uğur', 'Ulubatlı', 'Umurbey', 'Ülkü', 'Vezirağa', 'Yavuz Selim', 'Yeni', 'Yenidoğan', 'Yenigün', 'Yenişehir', 'Yeşildere', 'Yeşiltepe', 'Yıldız', 'Zafertepe', 'Zeybek', 'Zeytinlik'],
    'Karşıyaka': ['Aksoy', 'Alaybey', 'Atakent', 'Baharia', 'Bahçelievler', 'Bahriye Üçok', 'Bostanlı', 'Cumhuriyet', 'Dedebaşı', 'Demirköprü', 'Donanmacı', 'Fikri Altay', 'Goncalar', 'İmbatlı', 'İnönü', 'Latife Hanım', 'Mavişehir', 'Mustafa Kemal', 'Nergiz', 'Örnekköy', 'Sancaklı', 'Şemikler', 'Tersane', 'Tuna', 'Yalı', 'Yamanlar', 'Zübeyde Hanım'],
    'Bornova': ['Atatürk', 'Barbaros', 'Beşyol', 'Birlik', 'Çamkule', 'Çınar', 'Çiçekli', 'Doğanlar', 'Egemenlik', 'Eğridere', 'Ergene', 'Erzene', 'Evka 3', 'Evka 4', 'Gazi Osman Paşa', 'Gökdere', 'Gürpınar', 'Işıklar', 'İnönü', 'Karacaoğlan', 'Karaçam', 'Kavaklıdere', 'Kayadibi', 'Kazımdirik', 'Kemalpaşa', 'Kızılay', 'Koşukavak', 'Kurudere', 'Laka', 'Meriç', 'Merkez', 'Mevlana', 'Naldöken', 'Rafet Paşa', 'Sarnıçköy', 'Serintepe', 'Tuna', 'Ümit', 'Yakaköy', 'Yeşilçam', 'Yeşilova', 'Yıldırım Beyazıt', 'Yunus Emre', 'Zafer'],
    'Buca': ['29 Ekim', 'Adatepe', 'Akıncılar', 'Atatürk', 'Aydoğdu', 'Barış', 'Belenbaşı', 'Buca Koop', 'Cumhuriyet', 'Çağdaş', 'Çaldıran', 'Çamlık', 'Çamlıkule', 'Çamlıpınar', 'Dicle', 'Doğancılar', 'Dumlupınar', 'Efeler', 'Fırat', 'Gaziler', 'Göksu', 'Güven', 'Hürriyet', 'İnkilap', 'İnönü', 'İzkent', 'Karacaağaç', 'Karanfil', 'Kaynaklar', 'Kırıklar', 'Kozağaç', 'Kuruçeşme', 'Laleli', 'Menderes', 'Murathan', 'Mustafa Kemal', 'Seyhan', 'Şirinkapı', 'Ufuk', 'Vali Rahmi Bey', 'Yaylacık', 'Yenigün', 'Yeşilbağlar', 'Yıldız', 'Yıldızlar', 'Yiğitler', 'Zafer'],
    'Çiğli': ['Ahmet Efendi', 'Ahmet Taner Kışlalı', 'Ataşehir', 'Atatürk', 'Aydınlıkevler', 'Balatçık', 'Cumhuriyet', 'Çağdaş', 'Egekent', 'Esentepe', 'Evka 2', 'Evka 5', 'Evka 6', 'Güzeltepe', 'Harmandalı Gazi Mustafa Kemal Atatürk', 'İnönü', 'İzkent', 'Kaklıç', 'Köyiçi', 'Küçük Çiğli', 'Maltepe', 'Sasalı', 'Şirintepe', 'Uğur Mumcu', 'Yakakent', 'Yeni Mahalle'],
    'Bayraklı': ['75. Yıl', 'Adalet', 'Alpaslan', 'Bayraklı', 'Cengizhan', 'Çay', 'Çiçek', 'Doğançay', 'Emek', 'Fuat Edip Baksı', 'Gümüşpala', 'Manavkuyu', 'Mansuroğlu', 'Muhittin Erener', 'Onur', 'Orgeneral Nafiz Gürman', 'Osmangazi', 'Postacılar', 'R. Şevket İnce', 'Soğukkuyu', 'Tepekule', 'Turan', 'Yamanlar'],
    'Gaziemir': ['Aktepe', 'Atatürk', 'Atıfbey', 'Beyazevler', 'Binbaşı Reşatbey', 'Dokuz Eylül', 'Emerez', 'Fatih', 'Gazi', 'Gazikent', 'Hürriyet', 'Irmak', 'Menderes', 'Sevgi', 'Yeşil', 'Zafer'],
    'Urla': ['Atatürk', 'Bademler', 'Balıklıova', 'Barbaros', 'Birgi', 'Camiatik', 'Çamlıçay', 'Çeşmealtı', 'Demircili', 'Denizli', 'Gülbahçe', 'Güvendik', 'Hacı İsa', 'İçmeler', 'İskele', 'Kadıovacık', 'Kalabak', 'Kuşçular', 'M.Fevzi Çakmak', 'Naipli', 'Nohutalan', 'Ovacık', 'Özbek', 'Rüstem', 'Sıra', 'Şirinkent', 'Torasan', 'Uzunkuyu', 'Yağcılar', 'Yaka', 'Yelaltı', 'Yeni', 'Yenice', 'Yenikent', 'Zeytineli', 'Zeytinalanı']
  }
};

// Generic fallback for neighborhoods if specific data is missing
const GENERIC_NEIGHBORHOODS = ['Merkez', 'Cumhuriyet', 'Atatürk', 'Fatih', 'Yeni', 'Bahçelievler', 'Hürriyet', 'İstiklal', 'Gazi', 'Zafer', 'Mimar Sinan', 'Yıldız', 'Esenyurt', 'Karşıyaka', 'Yeşil', 'Barbaros', 'İnönü'];

const ROOM_OPTIONS = [
  '1+0', '1+1', '2+0', '2+1', '2+2',
  '3+0', '3+1', '3+2', '4+0', '4+1', '4+2',
  '5+0', '5+1', '5+2', '6+0', '6+1', '6+2',
  '7+0', '7+1', '7+2'
];

const PropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL for Edit mode
  const { addProperty, updateProperty, deleteProperty, sites, addSite, webConfig, properties, customers, addCustomer, addActivity, session } = useData();

  // ... (inside component)





  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<'url' | 'text'>('url');
  const [importInput, setImportInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importError, setImportError] = useState('');

  // Owner Modal States
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [isAddingOwner, setIsAddingOwner] = useState(false); // Loading state

  // AI Description Generation State
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // AI Price Estimation State
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);

  const handleImport = async () => {
    if (!importInput.trim()) return;

    setIsAnalyzing(true);
    setImportError('');

    try {
      // Use client-side Gemini service instead of API route (which fails locally)
      // Dynamic import to avoid circular dep issues if any, though explicit import is better.
      // We will assume generateRealEstateAdvice is available or imported.
      // Need to make sure generating the prompt here.

      const prompt = `Aşağıdaki ${importMode === 'url' ? 'URL içeriğini' : 'metni'} analiz et ve BİR EMLAK İLANI OLUŞTURMAK İÇİN JSON formatında veri çıkar. 
      Sadece JSON döndür. Başka bir açıklama yazma.
      
      İstenen JSON Formatı:
      {
        "title": "Başlık",
        "description": "Açıklama",
        "price": 0,
        "currency": "TL", 
        "location": "İlçe, İl",
        "rooms": "3+1", 
        "bathrooms": 1,
        "area": 100,
        "type": "Satılık" (veya Kiralık),
        "propertyType": "Daire" (veya Villa, Arsa vb)
      }

      Analiz Edilecek İçerik:
      ${importInput}
      `;

      // Import service here or assume it is imported at top. 
      // I will add the import to the file if missing, but let's assume I can change this block.
      // Error: generateRealEstateAdvice is not imported. I need to add import first.
      // But I can't add import with this tool in the same call easily if I only replace this block.
      // I will use multi_replace or just update imports in a separate step? 
      // I will assume I'll add the import in a previous or subsequent step.

      // TEMPORARY: I will use the service function directly if I can, but I need to import it.
      // Let's mistakenly assume it's there? No, I must be safe.
      // I'll return the logic here assuming 'generateRealEstateAdvice' is imported.

      const result = await generateRealEstateAdvice(prompt);

      // Parse JSON from result (clean markdown code blocks)
      const cleanJson = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const startIndex = cleanJson.indexOf('{');
      const endIndex = cleanJson.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1) {
        throw new Error("AI geçerli bir JSON verisi döndürmedi.");
      }

      const jsonStr = cleanJson.substring(startIndex, endIndex + 1);
      const data = JSON.parse(jsonStr);

      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        price: data.price || prev.price,
        currency: data.currency || prev.currency,
        type: data.type || prev.type,
        rooms: data.rooms || prev.rooms,
        bathrooms: data.bathrooms || prev.bathrooms,
        netArea: data.area || prev.netArea,
        grossArea: data.area || prev.grossArea,
        city: data.location?.split(',')[1]?.trim() || prev.city,
        district: data.location?.split(',')[0]?.trim() || prev.district
      }));

      toast.success('İlan bilgileri yapay zeka ile dolduruldu! Lütfen kontrol edin.');

    } catch (err: any) {
      console.error(err);
      setImportError('Analiz hatası: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Description Generator
  const handleGenerateDescription = async () => {
    // Check if we have enough info to generate
    if (!formData.type && !formData.rooms && !formData.city) {
      toast.error('Lütfen önce emlak tipi, oda sayısı ve konum bilgilerini doldurun');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const propertyInfo = [
        formData.type && `Emlak Tipi: ${formData.type}`,
        formData.rooms && `Oda Sayısı: ${formData.rooms}`,
        formData.bathrooms && `Banyo: ${formData.bathrooms}`,
        formData.netArea && `Net Alan: ${formData.netArea} m²`,
        formData.grossArea && `Brüt Alan: ${formData.grossArea} m²`,
        formData.city && formData.district && `Konum: ${formData.district}, ${formData.city}`,
        formData.neighborhood && `Mahalle: ${formData.neighborhood}`,
        formData.buildingAge && `Bina Yaşı: ${formData.buildingAge}`,
        formData.floorNumber && formData.floorCount && `Kat: ${formData.floorNumber}/${formData.floorCount}`,
        formData.heating && `Isıtma: ${formData.heating}`,
        formData.furnished && `Eşya: ${formData.furnished}`,
        formData.parking && `Otopark: ${formData.parking}`,
        formData.balcony && `Balkon: Var`,
        formData.elevator && `Asansör: Var`,
        formData.price && `Fiyat: ${formData.price.toLocaleString('tr-TR')} ${formData.currency || 'TL'}`,
        formData.listingType && `İlan Tipi: ${formData.listingType}`,
      ].filter(Boolean).join('\n');

      const prompt = `Aşağıdaki emlak bilgilerine göre, profesyonel ve çekici bir Türkçe ilan açıklaması yaz.
Açıklama 100-200 kelime arasında olsun. Sadece açıklama metnini yaz, başka bir şey ekleme.
Emlak bilgilerini tekrar listeleme, bunları cazip bir anlatımla açıklamaya dönüştür.
Potansiyel alıcı/kiracıyı heyecanlandıracak ve emlağın öne çıkan özelliklerini vurgulayacak şekilde yaz.

Emlak Bilgileri:
${propertyInfo}`;

      const result = await generateRealEstateAdvice(prompt);

      if (result) {
        setFormData(prev => ({
          ...prev,
          description: result.trim()
        }));
        toast.success('İlan açıklaması AI ile oluşturuldu!');
      }
    } catch (err: any) {
      console.error('AI Description error:', err);
      toast.error('Açıklama oluşturulamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // AI Price Estimation
  const handleEstimatePrice = async () => {
    if (!formData.type && !formData.city) {
      toast.error('Lütfen önce emlak tipi ve konum bilgilerini doldurun');
      return;
    }

    setIsEstimatingPrice(true);
    try {
      const propertyInfo = [
        formData.type && `Emlak Tipi: ${formData.type}`,
        formData.listingType && `İşlem: ${formData.listingType}`,
        formData.rooms && `Oda Sayısı: ${formData.rooms}`,
        formData.netArea && `Net Alan: ${formData.netArea} m²`,
        formData.grossArea && `Brüt Alan: ${formData.grossArea} m²`,
        formData.city && `Şehir: ${formData.city}`,
        formData.district && `İlçe: ${formData.district}`,
        formData.neighborhood && `Mahalle: ${formData.neighborhood}`,
        formData.buildingAge && `Bina Yaşı: ${formData.buildingAge}`,
        formData.floorNumber && `Bulunduğu Kat: ${formData.floorNumber}`,
        formData.heating && `Isıtma: ${formData.heating}`,
        formData.furnished && `Eşya Durumu: ${formData.furnished}`,
        formData.parking && `Otopark: ${formData.parking}`,
        formData.elevator && `Asansör: Var`,
        formData.balcony && `Balkon: Var`,
      ].filter(Boolean).join('\n');

      const prompt = `Aşağıdaki emlak bilgilerine göre Türkiye piyasasında tahmini bir ${formData.listingType === 'Kiralık' ? 'kira' : 'satış'} fiyatı öner.
SADECE bir sayı döndür, başka hiçbir şey yazma. Türk Lirası cinsinden yaz.
Örnek çıktı: 2500000

Emlak Bilgileri:
${propertyInfo}`;

      const result = await generateRealEstateAdvice(prompt);

      if (result) {
        // Extract number from response
        const priceMatch = result.replace(/[^\d]/g, '');
        const estimatedPrice = parseInt(priceMatch, 10);

        if (estimatedPrice && !isNaN(estimatedPrice)) {
          setFormData(prev => ({
            ...prev,
            price: estimatedPrice
          }));
          toast.success(`AI fiyat tahmini: ${estimatedPrice.toLocaleString('tr-TR')} TL`);
        } else {
          toast.error('Fiyat tahmini alınamadı');
        }
      }
    } catch (err: any) {
      console.error('AI Price error:', err);
      toast.error('Fiyat tahmini yapılamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsEstimatingPrice(false);
    }
  };

  const [formData, setFormData] = useState<Partial<Property>>({
    title: "",
    price: 0,
    currency: 'TL',
    id: `PRT-${Date.now().toString().slice(-6)}`,
    description: '',
    type: 'Daire',
    rooms: '',
    bathrooms: 1,
    grossArea: 0,
    netArea: 0,
    openArea: 0,
    buildingAge: 0,
    floorCount: 1,
    heating: '',
    kitchenType: '',
    parking: '',
    furnished: '',
    usageStatus: '',
    deedStatus: '',
    city: '',
    district: '',
    neighborhood: '',
    address: '',
    isInSite: false,
    site: '',
    dues: 0,
    deposit: 0,
    images: [],
    listingDate: new Date().toISOString().split('T')[0],
    status: 'Satılık',
    listingStatus: 'Aktif', // NEW: Portfolio status
    publishedOnMarketplace: true,
    publishedOnPersonalSite: true,
    ownerId: '',
    ownerName: ''
  });

  // Load data if in Edit mode
  useEffect(() => {
    if (id && properties.length > 0) {
      const existingProperty = properties.find(p => p.id === id);
      if (existingProperty) {
        setFormData(existingProperty);
      }
    }
  }, [id, properties]);

  // Quick Add Owner Handler
  const handleQuickAddOwner = async () => {
    if (isAddingOwner) return; // Prevent double clicks

    if (!session?.user?.id) {
      toast.error('Lütfen önce oturum açın.');
      return;
    }

    if (!newOwnerName.trim() || !newOwnerPhone.trim()) {
      toast.error('Lütfen ad ve telefon giriniz.');
      return;
    }

    setIsAddingOwner(true);
    try {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: newOwnerName,
        phone: newOwnerPhone,
        email: '',
        status: 'Aktif',
        customerType: 'Mal Sahibi', // Important
        source: 'Hızlı Ekleme',
        createdAt: new Date().toISOString().split('T')[0],
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        interactions: []
      };

      await addCustomer(newCustomer);

      // Auto select the new owner
      setFormData(prev => ({
        ...prev,
        ownerId: newCustomer.id,
        ownerName: newCustomer.name
      }));

      setShowOwnerModal(false);
      setNewOwnerName('');
      setNewOwnerPhone('');
      toast.success('Yeni mal sahibi başarıyla eklendi ve seçildi.');
    } catch (error: any) {
      console.error('Error adding owner:', error);
      toast.error('Hata: ' + (error.message || 'Mal sahibi eklenirken bir hata oluştu.'));
    } finally {
      setIsAddingOwner(false);
    }
  };

  const handleChange = (field: keyof Property, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Cascading reset logic
      if (field === 'city') {
        newData.district = '';
        newData.neighborhood = '';
      } else if (field === 'district') {
        newData.neighborhood = '';
      }

      return newData;
    });
  };

  // Helper to get districts based on selected city
  const getDistricts = (): string[] => {
    if (!formData.city) return [];
    return ALL_CITIES_DISTRICTS[formData.city] || [];
  };

  // Helper to get neighborhoods based on selected district
  const getNeighborhoods = (): string[] => {
    if (!formData.city || !formData.district) return [];

    // Try to find specific neighborhood data first
    if (DETAILED_NEIGHBORHOODS[formData.city]?.[formData.district]) {
      return DETAILED_NEIGHBORHOODS[formData.city][formData.district].sort();
    }

    // Fallback to generic neighborhood list for other cities
    return GENERIC_NEIGHBORHOODS.sort();
  };

  // Helper to generate dynamic map URL
  const getMapUrl = () => {
    const parts = [];
    if (formData.neighborhood && formData.neighborhood !== 'Merkez') parts.push(formData.neighborhood + ' Mahallesi');
    if (formData.district) parts.push(formData.district);
    if (formData.city) parts.push(formData.city);

    // Default to Turkey if nothing selected, or build query string
    const query = parts.length > 0 ? parts.join(', ') : 'Turkey';

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  // Image Upload Handler
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadingImages(true);
    const files = Array.from(e.target.files) as File[];
    const newImages: string[] = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) continue;

        // Upload to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error for file ' + file.name, uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages]
        }));
      }

    } catch (error) {
      console.error('Batch upload error:', error);
      toast.error('Resimler yüklenirken bir hata oluştu.');
    } finally {
      setUploadingImages(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm('Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await deleteProperty(id);
        toast.success('İlan silindi.');
        navigate('/properties');
      } catch (error) {
        console.error('Silme hatası:', error);
        toast.error('Silme işlemi başarısız oldu.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }

    const property: Property = {
      id: formData.id || Date.now().toString(),
      title: formData.title || '',
      price: formData.price || 0,
      currency: formData.currency || 'TL',
      location: `${formData.neighborhood}, ${formData.district}, ${formData.city}`,
      type: formData.type || 'Daire',
      status: formData.status || 'Satılık',
      rooms: formData.rooms || '',
      area: formData.netArea || 0,
      bathrooms: formData.bathrooms || 1,
      heating: formData.heating || '',
      site: formData.isInSite ? formData.site : undefined,
      images: formData.images || [],
      description: formData.description || '',
      coordinates: { lat: 41.0082, lng: 28.9784 },
      grossArea: formData.grossArea,
      netArea: formData.netArea,
      openArea: formData.openArea,
      buildingAge: formData.buildingAge,
      floorCount: formData.floorCount,
      kitchenType: formData.kitchenType,
      parking: formData.parking,
      furnished: formData.furnished,
      usageStatus: formData.usageStatus,
      deedStatus: formData.deedStatus,
      city: formData.city,
      district: formData.district,
      neighborhood: formData.neighborhood,
      address: formData.address,
      dues: formData.dues,
      deposit: formData.deposit,
      listingDate: formData.listingDate,
      publishedOnMarketplace: formData.publishedOnMarketplace,
      publishedOnPersonalSite: formData.publishedOnPersonalSite,
      // Enhanced Fields
      currentFloor: formData.currentFloor,
      balkon: formData.balkon,
      asansor: formData.asansor,
      kimden: formData.kimden,
      krediyeUygunluk: formData.krediyeUygunluk,
      takas: formData.takas,
      // Owner Field
      ownerId: formData.ownerId,
      ownerName: formData.ownerName,
      // Listing Status Fields (snake_case for Supabase)
      listing_status: formData.listingStatus || formData.listing_status || 'Aktif',
      inactive_reason: formData.inactiveReason || formData.inactive_reason,
      sold_date: formData.soldDate || formData.sold_date,
      rented_date: formData.rentedDate || formData.rented_date
    };

    try {
      // Auto-create Site if it doesn't exist
      if (formData.isInSite && formData.site) {
        const siteExists = sites.some(s => s.name.toLowerCase() === formData.site!.trim().toLowerCase());
        if (!siteExists) {
          const newSite: any = {
            id: Date.now().toString(),
            name: formData.site.trim(),
            region: formData.district || '',
            address: formData.neighborhood || '',
            status: 'Aktif',
            createdAt: new Date().toISOString().split('T')[0]
          };
          await addSite(newSite);
          // Small delay to ensure state update if needed, though usually not strictly necessary with await
        }
      }

      if (id) {
        // Edit Mode
        await updateProperty(property);
        toast.success('İlan güncellendi!');
      } else {
        // Add Mode
        await addProperty(property);

        // Auto-Log Activity for Owner
        if (formData.ownerId && formData.ownerName) {
          await addActivity({
            id: Date.now().toString(),
            type: 'Diğer',
            customerId: formData.ownerId,
            customerName: formData.ownerName,
            propertyId: property.id,
            propertyTitle: property.title,
            date: new Date().toISOString().split('T')[0],
            description: `Emlak Eklendi: ${property.title} (${property.price.toLocaleString('tr-TR')} ${property.currency})`,
            status: 'Tamamlandı'
          });
        }

        toast.success('İlan eklendi!');
      }

      navigate('/properties');
    } catch (error: any) {
      console.error('Property Save Error:', error);
      toast.error('İşlem başarısız oldu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  return (
    <div className="pb-10 space-y-8">

      {/* Magic Import Section */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sihirli İçe Aktar</h2>
            <p className="text-indigo-100 text-sm">Başka bir siteden link verin veya metni yapıştırın, formu biz dolduralım.</p>
          </div>
        </div>

        <div className="bg-white/10 p-1 rounded-lg inline-flex mb-4">
          <button
            type="button"
            onClick={() => setImportMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${importMode === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}
          >
            <Link className="w-4 h-4" /> Link İle
          </button>
          <button
            type="button"
            onClick={() => setImportMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${importMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}
          >
            <FileText className="w-4 h-4" /> Metin İle
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {importMode === 'url' ? (
            <input
              type="text"
              placeholder="https://sahibinden.com/ilan/..."
              className="flex-1 rounded-lg border-0 bg-white/90 p-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
            />
          ) : (
            <textarea
              placeholder="İlan açıklamasını buraya yapıştırın..."
              className="flex-1 rounded-lg border-0 bg-white/90 p-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 min-h-[50px] max-h-[150px]"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
            />
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={isAnalyzing || !importInput}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analiz...</> : 'Bilgileri Getir'}
          </button>
        </div>
        {importError && (
          <div className="mt-3 bg-red-500/20 border border-red-500/30 text-white px-4 py-2 rounded-lg text-sm">
            ⚠️ {importError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">İlan Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İlan Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Kadıköy Merkezde 3+1 Satılık Daire"
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İlan Tipi</label>
                <select
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="Satılık">Satılık</option>
                  <option value="Kiralık">Kiralık</option>
                  <option value="Devren">Devren</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Portföy Durumu</label>
                <select
                  className={`w-full rounded-md border p-2.5 sm:text-sm focus:border-[#1193d4] focus:ring-[#1193d4] ${(formData.listingStatus || formData.listing_status) === 'Satıldı' ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' :
                    (formData.listingStatus || formData.listing_status) === 'Kiralandı' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' :
                      (formData.listingStatus || formData.listing_status) === 'Pasif' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300' :
                        'bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white'
                    }`}
                  value={formData.listingStatus || formData.listing_status || 'Aktif'}
                  onChange={e => handleChange('listingStatus', e.target.value)}
                >
                  <option value="Aktif">✅ Aktif</option>
                  <option value="Pasif">⏸️ Pasif</option>
                  <option value="Satıldı">🎉 Satıldı</option>
                  <option value="Kiralandı">🏠 Kiralandı</option>
                </select>
              </div>
              {/* Inactive Reason - show when Pasif selected */}
              {(formData.listingStatus === 'Pasif' || formData.listing_status === 'Pasif') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pasif Olma Sebebi</label>
                  <select
                    className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-amber-50 dark:bg-amber-900/20 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                    value={formData.inactiveReason || formData.inactive_reason || ''}
                    onChange={e => handleChange('inactiveReason', e.target.value)}
                  >
                    <option value="">Sebep Seçin...</option>
                    <option value="Mal sahibi vazgeçti">Mal sahibi vazgeçti</option>
                    <option value="Fiyat uyuşmazlığı">Fiyat uyuşmazlığı</option>
                    <option value="Başka ofis satış yaptı">Başka ofis satış yaptı</option>
                    <option value="İlan süresi doldu">İlan süresi doldu</option>
                    <option value="Geçici olarak askıya alındı">Geçici olarak askıya alındı</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Fiyat</label>
                  <button
                    type="button"
                    onClick={handleEstimatePrice}
                    disabled={isEstimatingPrice}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isEstimatingPrice ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Hesaplanıyor...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        AI Tahmin
                      </>
                    )}
                  </button>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">₺</span>
                  </div>
                  <input
                    type="text"
                    placeholder="0"
                    className="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 pl-7 pr-12 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                    value={formData.price ? formData.price.toLocaleString('tr-TR') : ''}
                    onChange={e => {
                      const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');
                      const numValue = parseInt(rawValue, 10);
                      handleChange('price', isNaN(numValue) ? 0 : numValue);
                    }}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">TL</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İlan No</label>
                <input
                  type="text"
                  disabled={!!id}
                  className={`w-full rounded-md border-gray-300 dark:border-slate-600 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm ${id ? 'bg-gray-100 dark:bg-slate-600 cursor-not-allowed opacity-70' : 'bg-slate-50 dark:bg-slate-700'}`}
                  value={formData.id}
                  onChange={e => handleChange('id', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Açıklama</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGeneratingDescription ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        AI ile Oluştur
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="İlan hakkında detaylı bilgi giriniz..."
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Emlak Özellikleri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Emlak Tipi</label>
                <select
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.type}
                  onChange={e => handleChange('type', e.target.value)}
                >
                  <option>Konut</option>
                  <option>Daire</option>
                  <option>Villa</option>
                  <option>İşyeri</option>
                  <option>Arsa</option>
                </select>
              </div>

              {/* Arsa (Land) Specific Fields */}
              {formData.type === 'Arsa' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">m² (Arsa Alanı)</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.grossArea || ''}
                      onChange={e => handleChange('grossArea', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">m² Fiyatı</label>
                    <input
                      type="text"
                      readOnly
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 border p-2.5 text-gray-900 dark:text-white sm:text-sm"
                      value={formData.grossArea && formData.price ? Math.round(formData.price / formData.grossArea).toLocaleString('tr-TR') + ' ₺' : '-'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">İmar Durumu</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.imarDurumu || ''}
                      onChange={e => handleChange('imarDurumu', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Villa</option>
                      <option>Konut</option>
                      <option>Ticari</option>
                      <option>Tarım</option>
                      <option>Sanayi</option>
                      <option>Turizm</option>
                      <option>Arsa+Ticaret</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Ada No</label>
                    <input
                      type="text"
                      placeholder="Örn: 1234"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.adaNo || ''}
                      onChange={e => handleChange('adaNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Parsel No</label>
                    <input
                      type="text"
                      placeholder="Örn: 56"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.parselNo || ''}
                      onChange={e => handleChange('parselNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Pafta No</label>
                    <input
                      type="text"
                      placeholder="Örn: G21"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.paftaNo || ''}
                      onChange={e => handleChange('paftaNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Kaks (Emsal)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Örn: 0.10"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.kaks || ''}
                      onChange={e => handleChange('kaks', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Gabari</label>
                    <input
                      type="number"
                      step="0.50"
                      placeholder="Örn: 6.50"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.gabari || ''}
                      onChange={e => handleChange('gabari', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Krediye Uygunluk</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.krediyeUygunluk || ''}
                      onChange={e => handleChange('krediyeUygunluk', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Evet</option>
                      <option>Hayır</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Tapu Durumu</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.deedStatus || ''}
                      onChange={e => handleChange('deedStatus', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Kat Mülkiyeti</option>
                      <option>Kat İrtifakı</option>
                      <option>Hisseli Tapu</option>
                      <option>Kooperatif Hisseli Tapu</option>
                      <option>Müstakil Tapu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Takas</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.takas || ''}
                      onChange={e => handleChange('takas', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Evet</option>
                      <option>Hayır</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Building-specific fields (hide for Arsa) */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Oda Sayısı</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.rooms}
                      onChange={e => handleChange('rooms', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      {ROOM_OPTIONS.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Banyo Sayısı</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.bathrooms || ''}
                      onChange={e => handleChange('bathrooms', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">m² (Brüt)</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.grossArea || ''}
                      onChange={e => handleChange('grossArea', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">m² (Net)</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.netArea || ''}
                      onChange={e => handleChange('netArea', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Açık Alan m²</label>
                    <input
                      type="number"
                      placeholder="Varsa girin"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.openArea || ''}
                      onChange={e => handleChange('openArea', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Bina Yaşı</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.buildingAge || ''}
                      onChange={e => handleChange('buildingAge', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Kat Sayısı</label>
                    <input
                      type="number"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.floorCount || ''}
                      onChange={e => handleChange('floorCount', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Isıtma</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.heating}
                      onChange={e => handleChange('heating', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Klima</option>
                      <option>Doğal Gaz</option>
                      <option>Merkezi</option>
                      <option>Yerden Isıtma</option>
                      <option>Sobalı</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mutfak Tipi</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.kitchenType}
                      onChange={e => handleChange('kitchenType', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Amerikan Mutfak</option>
                      <option>Ayrı Mutfak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Otopark</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.parking}
                      onChange={e => handleChange('parking', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Yok</option>
                      <option>Var (Açık)</option>
                      <option>Var (Kapalı)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Eşyalı Durumu</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.furnished}
                      onChange={e => handleChange('furnished', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Boş</option>
                      <option>Eşyalı</option>
                      <option>Kısmen Eşyalı</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Kullanım Durumu</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.usageStatus}
                      onChange={e => handleChange('usageStatus', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Boş</option>
                      <option>Kiracılı</option>
                      <option>Mülk Sahibi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Tapu Durumu</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.deedStatus}
                      onChange={e => handleChange('deedStatus', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Kat Mülkiyetli</option>
                      <option>Hisseli Tapu</option>
                      <option>Müstakil Tapu</option>
                      <option>Arsa Tapusu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Bulunduğu Kat</label>
                    <input
                      type="number"
                      placeholder="Örn: 3"
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.currentFloor || ''}
                      onChange={e => handleChange('currentFloor', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Balkon</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.balkon || ''}
                      onChange={e => handleChange('balkon', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Var</option>
                      <option>Yok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Asansör</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.asansor || ''}
                      onChange={e => handleChange('asansor', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Var</option>
                      <option>Yok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Kimden</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.kimden || ''}
                      onChange={e => handleChange('kimden', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Emlak Ofisinden</option>
                      <option>Sahibinden</option>
                      <option>İnşaat Firmasından</option>
                    </select>
                  </div>
                  <div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">İlan Sahibi (CRM Kaydı)</label>
                        <button
                          type="button"
                          onClick={() => setShowOwnerModal(true)}
                          className="text-xs bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md hover:bg-green-100 transition-colors flex items-center font-medium"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Yeni Ekle
                        </button>
                      </div>
                      <select
                        className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                        value={formData.ownerId || ''}
                        onChange={e => {
                          const selectedCustomer = customers.find(c => c.id === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            ownerId: e.target.value,
                            ownerName: selectedCustomer ? selectedCustomer.name : ''
                          }));
                        }}
                      >
                        <option value="">Müşteri Seçiniz</option>
                        {customers.filter(c => c.customerType === 'Mal Sahibi').map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Krediye Uygun</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.krediyeUygunluk || ''}
                      onChange={e => handleChange('krediyeUygunluk', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Evet</option>
                      <option>Hayır</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Takas</label>
                    <select
                      className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.takas || ''}
                      onChange={e => handleChange('takas', e.target.value)}
                    >
                      <option value="">Seçiniz</option>
                      <option>Evet</option>
                      <option>Hayır</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Konum Bilgileri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">İl</label>
                <select
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                >
                  <option value="">İl Seçiniz</option>
                  {Object.keys(ALL_CITIES_DISTRICTS).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">İlçe</label>
                <select
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.district}
                  onChange={e => handleChange('district', e.target.value)}
                  disabled={!formData.city}
                >
                  <option value="">İlçe Seçiniz</option>
                  {getDistricts().map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mahalle / Köy</label>
                <select
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.neighborhood?.startsWith('__CUSTOM__') ? '__CUSTOM__' : formData.neighborhood}
                  onChange={e => {
                    if (e.target.value === '__CUSTOM__') {
                      handleChange('neighborhood', '__CUSTOM__');
                    } else {
                      handleChange('neighborhood', e.target.value);
                    }
                  }}
                  disabled={!formData.district}
                >
                  <option value="">Mahalle Seçiniz</option>
                  {getNeighborhoods().map(neighborhood => (
                    <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                  ))}
                  <option value="__CUSTOM__">📝 Diğer - Manuel Giriş</option>
                </select>
              </div>
              {formData.neighborhood?.startsWith('__CUSTOM__') && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mahalle/Köy Adı (Manuel)</label>
                  <input
                    type="text"
                    placeholder="Örn: Paşaköy Köyü"
                    className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                    value={formData.neighborhood?.replace('__CUSTOM__:', '') || ''}
                    onChange={e => handleChange('neighborhood', '__CUSTOM__:' + e.target.value)}
                  />
                </div>
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Açık Adres</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                ></textarea>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Harita Konumu</label>
                <div className="aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-600 relative bg-gray-100 dark:bg-slate-700">
                  <iframe
                    width="100%"
                    height="100%"
                    id="gmap_canvas"
                    src={getMapUrl()}
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    title="Konum Haritası"
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 italic">* Adres bilgileri girildikçe harita otomatik olarak güncellenir.</p>
              </div>
            </div>
          </div>

          {/* Site Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Site Bilgileri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#1193d4] focus:ring-[#1193d4]"
                  checked={formData.isInSite}
                  onChange={e => handleChange('isInSite', e.target.checked)}
                />
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Site İçerisinde mi?</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Site Adı</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                    value={formData.site}
                    onChange={e => {
                      if (e.target.value === '__NEW_SITE__') {
                        const siteName = prompt('Yeni site adı girin:');
                        if (siteName && siteName.trim()) {
                          handleChange('site', siteName.trim());
                        }
                      } else {
                        handleChange('site', e.target.value);
                      }
                    }}
                    disabled={!formData.isInSite}
                  >
                    <option value="">Seçiniz</option>
                    {sites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    <option value="__NEW_SITE__">➕ Yeni Site Ekle</option>
                  </select>
                </div>
                {formData.site && !sites.find(s => s.name === formData.site) && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Yeni site: {formData.site}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Aidat (₺)</label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.dues || ''}
                  onChange={e => handleChange('dues', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Depozito (₺)</label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                  value={formData.deposit || ''}
                  onChange={e => handleChange('deposit', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Görseller</h3>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images?.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img alt="Property view" className="w-full h-full object-cover rounded-lg" src={img} />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <button className="text-white p-2 hover:bg-red-500 rounded-full transition-colors" type="button" onClick={() => removeImage(idx)}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <div
                className="relative group aspect-square border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <button className="flex flex-col items-center text-gray-500 dark:text-slate-400" type="button">
                  <ImagePlus className="w-8 h-8 mb-1" />
                  <span className="text-sm">Görsel Ekle</span>
                </button>
              </div>
              {/* Images */}
              {/* ... */}
            </div>

            {/* Owner Selection - Visible for ALL types */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Mal Sahibi Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mal Sahibi Seç</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                      value={formData.ownerId || ''}
                      onChange={e => {
                        const selected = customers?.find(c => c.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          ownerId: e.target.value,
                          ownerName: selected?.name || ''
                        }));
                      }}
                    >
                      <option value="">Seçiniz</option>
                      {customers?.filter(c => c.customerType === 'Mal Sahibi' || c.customerType === 'Satıcı').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowOwnerModal(true)}
                      className="bg-[#1193d4] text-white p-2.5 rounded-lg hover:bg-[#0e7db5] transition-colors"
                      title="Yeni Mal Sahibi Ekle"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mal Sahibi Adı (Otomatik)</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 border p-2.5 text-gray-900 dark:text-white sm:text-sm"
                    value={formData.ownerName || '-'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-slate-700 transition-colors">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Yayın Ayarları</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
                  <Globe className="w-5 h-5 text-[#1193d4] mt-0.5" />
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={formData.publishedOnPersonalSite}
                        onChange={e => handleChange('publishedOnPersonalSite', e.target.checked)}
                      />
                      Kişisel Web Sitemde Yayınla
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      İlan, {webConfig.domain || 'sitenizde'} görüntülenecektir.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <Store className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={formData.publishedOnMarketplace}
                        onChange={e => handleChange('publishedOnMarketplace', e.target.checked)}
                      />
                      Genel Pazaryerinde Yayınla
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      İlan, EmlakPazarı genel ağında listelenir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İlan Tarihi</label>
                  <input
                    type="date"
                    className="w-full rounded-md border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-2.5 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] sm:text-sm"
                    value={formData.listingDate}
                    onChange={e => handleChange('listingDate', e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 px-6 font-semibold rounded-lg bg-[#1193d4] text-white flex items-center justify-center transition-opacity hover:opacity-90 shadow-sm"
                >
                  Kaydet
                </button>

                {id && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full h-12 px-6 font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 flex items-center justify-center transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    İlanı Sil
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/properties')}
                  className="w-full h-12 px-6 font-semibold rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {showOwnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1193d4]" />
                Yeni Mal Sahibi Ekle
              </h3>
              <button
                onClick={() => setShowOwnerModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Ad Soyad</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] transition-all"
                  value={newOwnerName}
                  onChange={e => setNewOwnerName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Telefon</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border p-3 text-gray-900 dark:text-white focus:border-[#1193d4] focus:ring-[#1193d4] transition-all"
                  value={newOwnerPhone}
                  onChange={e => setNewOwnerPhone(e.target.value)}
                  placeholder="Örn: 0532 123 45 67"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOwnerModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddOwner}
                  disabled={isAddingOwner}
                  className={`flex-1 bg-[#1193d4] text-white py-3 rounded-xl font-semibold hover:bg-[#0e7db5] shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center ${isAddingOwner ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isAddingOwner ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet ve Seç'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyForm;
