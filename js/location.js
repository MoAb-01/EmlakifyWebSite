const citySelect = document.getElementById("citySelect");
const districtSelect = document.getElementById("districtSelect");
const neighborhoodSelect = document.getElementById("neighborhoodSelect");

export async function loadCities() {
    try {
        const response = await fetch("https://turkiyeapi.dev/api/v1/provinces");
        const data = await response.json();
        populateSelect(citySelect, data.data.map(city => ({ value: city.id, text: city.name })));
    } catch (e) { console.error("API Hatası:", e); }
}

export async function loadDistricts() {
    districtSelect.innerHTML = `<option value="" selected disabled>İlçe Seçiniz</option>`;
    neighborhoodSelect.innerHTML = `<option value="" selected disabled>Önce İlçe Seçiniz</option>`;
    districtSelect.disabled = true; neighborhoodSelect.disabled = true;

    const cityId = citySelect.value;
    if (!cityId) return;

    try {
        const response = await fetch(`https://turkiyeapi.dev/api/v1/districts?provinceId=${cityId}`);
        const data = await response.json();
        populateSelect(districtSelect, data.data.map(dis => ({ value: dis.id, text: dis.name })));
        districtSelect.disabled = false;
    } catch (e) { console.error(e); }
}

export async function loadNeighborhoods() {
    neighborhoodSelect.innerHTML = `<option value="" selected disabled>Yükleniyor...</option>`;
    neighborhoodSelect.disabled = true;
    const districtId = districtSelect.value;
    if (!districtId) return;

    try {
        const response = await fetch(`https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${districtId}`);
        if (!response.ok) throw new Error("Hata");
        const data = await response.json();
        neighborhoodSelect.innerHTML = `<option value="" selected disabled>Mahalle Seçiniz</option>`;
        if (data.data) {
            populateSelect(neighborhoodSelect, data.data.map(n => ({ value: n.id, text: n.name })));
            neighborhoodSelect.disabled = false;
        } else {
            neighborhoodSelect.innerHTML = `<option value="" selected disabled>Mahalle bulunamadı</option>`;
        }
    } catch (error) {
        console.error(error);
        neighborhoodSelect.innerHTML = `<option value="" selected disabled>Tümü</option>`;
        neighborhoodSelect.disabled = false;
    }
}

function populateSelect(selectElement, items) {
    items.forEach(i => {
        const opt = document.createElement("option");
        opt.value = i.value;
        opt.textContent = i.text;
        selectElement.appendChild(opt);
    });
}