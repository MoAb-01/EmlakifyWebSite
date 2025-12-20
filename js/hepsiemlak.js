import { normalizeText } from './utils.js';

export function generateHepsiEmlakUrl(inputs) {
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

  const cleanNeighborhood = (text) => {
    if (!text) return "";
    let clean = normalizeText(text);
    clean = clean.replace(/(\s+mahallesi|\s+mah\.?)$/i, "");
    return makeSlug(clean);
  };

  const normalizeOda = makeSlug((oda_sayisi || "").replace(/\+/g, "-"));
  const normalizeIlce = makeSlug(ilce);
  const normalizeSehir = makeSlug(sehir);
  const normalizeMahalle = cleanNeighborhood(mahalle_sokak);
  const normalizeTur = makeSlug(emlak_turu);

  let finalSlug = normalizeTur;
  if (normalizeTur === "daire" && normalizeOda) {
    finalSlug = `daire-${normalizeOda}`;
  }
  const locationPart = [normalizeIlce || normalizeSehir, normalizeMahalle]
    .filter(Boolean)
    .join("-");

  const isRent = durum && durum.toLowerCase().includes("kiralık");
  const statusSlug = isRent ? "kiralik" : "satilik";

  const path = locationPart ? `${locationPart}-${statusSlug}` : statusSlug;
  const queryParams = [];
  if (min_price) queryParams.push(`p31=${min_price}`);
  if (max_price) queryParams.push(`p32=${max_price}`);
  if (queryParams.length > 0) queryParams.push("p33=1");

  const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
  const url = `https://www.hepsiemlak.com/${path}/${finalSlug}${queryString}`;

  return { url };
}