import { normalizeText } from './utils.js';

export function generateEmlakJetUrl(inputs) {
    const {
        sehir,
        ilce,
        mahalle_sokak,
        oda_sayisi,
        durum,
        min_price,
        max_price,
        emlak_turu
    } = inputs;

    const makeSlug = (text) => {
        return normalizeText(text || "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    };

    // Dynamic Paramterization
    //________________
    const normalizeSehir = makeSlug(sehir);
    const normalizeIlce = makeSlug(ilce);
        let normalizeMahalle = "";
    if (mahalle_sokak) {
        let clean = normalizeText(mahalle_sokak).replace(/(\s+mahallesi|\s+mah\.?)$/i, "");
        normalizeMahalle = makeSlug(clean) + "-mahallesi";
    }
    const locationSlug = [normalizeSehir, normalizeIlce, normalizeMahalle]
        .filter(Boolean)
        .join("-");

    const normalizeOda = (oda_sayisi || "").replace(/\+/g, "-");
    
    let typeSlug = makeSlug(emlak_turu);
    if (typeSlug === "yali-komple") typeSlug = "yali";
    
    const isRent = durum && durum.toLowerCase().includes("kiralık");
    const statusSlug = isRent ? "kiralik" : "satilik";

    const path = `${statusSlug}-${typeSlug}/${locationSlug}`;
    //_______________
    // Price Fixing::
    //_______________
    const params = [];
    let min = parseInt(min_price);
    let max = parseInt(max_price);
    if (isNaN(min) || min < 0) min = null;
    if (isNaN(max) || max <= 0) max = null;
    if (min !== null && max !== null && min > max) { const temp = min; min = max; max = temp; }
    if (min !== null) params.push(`min-fiyat=${min}`);
    if (max !== null) params.push(`max-fiyat=${max}`);
    //_________________
    if (normalizeOda) {
        params.push(`oda-sayisi=${normalizeOda}`);
    }
    const queryString = params.length > 0 ? `?filtreler=${params.join("&")}` : "";
    const url = `https://www.emlakjet.com/${path}/${queryString}`;
    return { url };
}