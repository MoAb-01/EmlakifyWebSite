import { ODA_KODLARI, normalizeText } from './utils.js';

export function generateSahibindenUrl(inputs) {
    let { sehir, ilce, mahalle_sokak, durum, emlak_turu, min_price, max_price, oda_sayisi, metin_kutusu } = inputs;
    
    sehir = normalizeText(sehir);
    ilce = normalizeText(ilce);
    mahalle_sokak = normalizeText(mahalle_sokak);
    durum = normalizeText(durum);
    emlak_turu = normalizeText(emlak_turu);

    let minPriceVal = parseInt(min_price);
    let maxPriceVal = parseInt(max_price);
    if (isNaN(minPriceVal) || minPriceVal <= 0) minPriceVal = null;
    if (isNaN(maxPriceVal) || maxPriceVal <= 0) maxPriceVal = null;

    if (minPriceVal !== null && maxPriceVal !== null && maxPriceVal < minPriceVal) {
        let temp = maxPriceVal; maxPriceVal = minPriceVal; minPriceVal = temp;
    }

    if (!metin_kutusu) metin_kutusu = "";
    else metin_kutusu = metin_kutusu.trim().replaceAll("+", "%2B").replaceAll(" ", "+");

    if (oda_sayisi) {
        let cleanOda = oda_sayisi.split('(')[0].trim(); 
        oda_sayisi = ODA_KODLARI[cleanOda] || ODA_KODLARI[oda_sayisi] || "";
    }

    const baseUrl = "https://www.sahibinden.com";
    let pathUrl = `${baseUrl}/${durum || ""}-${emlak_turu || ""}`;
    
    const allLocations = [sehir, ilce, mahalle_sokak];
    const filledLocations = allLocations.filter(loc => loc && loc.length > 0 && !loc.includes("seciniz"));

    if (filledLocations.length > 0) {
        pathUrl = pathUrl + "/" + filledLocations.join("-");
    }

    let params = [];
    if (minPriceVal) params.push(`price_min=${minPriceVal}`);
    if (maxPriceVal) params.push(`price_max=${maxPriceVal}`);
    if (oda_sayisi) params.push(`a20=${oda_sayisi}`);
    if (metin_kutusu) params.push(`query_text=${metin_kutusu}`);

    if (params.length === 0) return pathUrl;
    return `${pathUrl}?${params.join("&")}`;
}