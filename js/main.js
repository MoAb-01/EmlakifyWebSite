import { generateSahibindenUrl } from './sahibinden.js';
import { generateHepsiEmlakUrl } from './hepsiemlak.js';
import { generateEmlakJetUrl } from './emlakjet.js';
// import {generateEmlakJetUrl} from './emlakjet.js';
import { fetchLocalNews } from './news.js';
import { loadCities, loadDistricts, loadNeighborhoods } from './location.js';

// Sayfa Yüklendiğinde
window.addEventListener('load', () => {
    loadCities();
    setupEventListeners();
});

function setupEventListeners() {
    // Select kutularındaki değişimleri dinle
    document.getElementById("citySelect").addEventListener('change', loadDistricts);
    document.getElementById("districtSelect").addEventListener('change', loadNeighborhoods);

    // Buton tıklamasını dinle (HTML'deki onclick yerine)
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSearch);
    }
}

function handleSearch(event) {
    event.preventDefault();

    const citySelect = document.getElementById("citySelect");
    const districtSelect = document.getElementById("districtSelect");
    const neighborhoodSelect = document.getElementById("neighborhoodSelect");

    if (citySelect.value === "" || districtSelect.value === "") {
        alert("Lütfen en azından bir İl ve İlçe seçimi yapınız.");
        return;
    }

    const dynamicContent = document.getElementById('dynamicContent');
    const loadingState = document.getElementById('loadingState');
    const resultsState = document.getElementById('resultsState');
    const submitBtn = document.getElementById('submitBtn');
    const sahibindenLinkBtn = document.getElementById('sahibindenLink');
    const hepsiEmlakLinkBtn = document.getElementById('hepsiEmlakLink');

    dynamicContent.style.display = 'block';
    loadingState.style.display = 'flex';
    resultsState.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = "İşleniyor...";
    dynamicContent.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const inputs = {
        sehir: citySelect.options[citySelect.selectedIndex].text,
        ilce: (districtSelect.value && districtSelect.selectedIndex > 0) ? districtSelect.options[districtSelect.selectedIndex].text : "",
        mahalle_sokak: (!neighborhoodSelect.disabled && neighborhoodSelect.selectedIndex > 0)
            ? neighborhoodSelect.options[neighborhoodSelect.selectedIndex].text
            : "",
        durum: document.getElementById('durumSelect').value,
        emlak_turu: document.getElementById('emlakSelect').value,
        oda_sayisi: document.getElementById('odaSelect').value,
        min_price: document.getElementById('minPriceInput').value,
        max_price: document.getElementById('maxPriceInput').value,
        metin_kutusu: document.getElementById('keywordInput').value
    };

    // 1. Link Oluştur (sahibinden.js'den geliyor)
    const sahibindenLink = generateSahibindenUrl(inputs);
    if (sahibindenLinkBtn) sahibindenLinkBtn.href = sahibindenLink;

    // 2. Hepsi Emlak Linki Oluştur (hepsiemlak.js'den geliyor)
    const { url, error } = generateHepsiEmlakUrl(inputs);

    if (error) {
        alert(error);
        submitBtn.disabled = false;
        submitBtn.innerText = "Ara";
        return;
    }

    if (hepsiEmlakLinkBtn) {
        hepsiEmlakLinkBtn.href = url;
        hepsiEmlakLinkBtn.style.display = 'inline-block';
        hepsiEmlakLinkBtn.innerText = "HepsiEmlak Linkini Görüntüle";
    }

    // 3. Haber Çek (news.js'den geliyor)
    fetchLocalNews(inputs.sehir, inputs.ilce.includes("Seçiniz") ? "" : inputs.ilce);

    setTimeout(() => {
        loadingState.style.display = 'none';
        resultsState.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = "Arama Linklerini Oluştur";
    }, 1500);

    // 4. Emlakjet Linki Oluştur
    const emlakjetLinkBtn = document.getElementById('emlakjetLink');
    if (emlakjetLinkBtn) {
        const result = generateEmlakJetUrl(inputs);
        emlakjetLinkBtn.href = result.url;
        emlakjetLinkBtn.innerText = "Emlakjet Linkini Görüntüle";
    }
}