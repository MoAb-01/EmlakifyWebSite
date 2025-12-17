export async function fetchLocalNews(sehir, ilce) {
    const newsSection = document.getElementById('newsSection');
    const newsGrid = document.getElementById('newsGrid');

    // UI Hazırlığı: Spinner
    newsGrid.innerHTML = '<div class="spinner" style="width:30px; height:30px; border-color: #ddd; border-top-color: #333;"></div>';
    newsSection.style.display = 'block';

    // --- 1. KONUM MANTIĞI (DÜZELTİLDİ) ---
    // Cache Key için basit string birleştirme
    let cacheLocationString = sehir;
    if (ilce && !ilce.includes("Seçiniz")) {
        cacheLocationString += "_" + ilce;
    }

    // Google Araması için MANTIKSAL (AND) birleştirme
    // Bu sayede "İzmir" ve "Bornova" kelimelerinin yan yana olması gerekmez, haber içinde geçmesi yeterlidir.
    let searchQueryLocation = `"${sehir}"`;
    if (ilce && !ilce.includes("Seçiniz")) {
        searchQueryLocation = `"${ilce}" AND "${sehir}"`;
    }

    // --- 2. ÖNBELLEK MEKANİZMASI ---
    const CACHE_KEY = `news_cache_${cacheLocationString.replace(/\s+/g, '_').toLowerCase()}`;
    const CACHE_DURATION = 60 * 60 * 1000; // 1 Saat

    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        const { timestamp, items } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('⚡ Haberler önbellekten getirildi.');
            renderNews(items, newsGrid);
            return;
        }
    }

    // --- 3. SORGU MÜHENDİSLİĞİ (PREMIUM FİLTRELER) ---
    
    const trustedSites = [
        "hurriyet.com.tr", "milliyet.com.tr", "sozcu.com.tr", 
        "haberturk.com", "ntv.com.tr", "dha.com.tr", 
        "aa.com.tr", "yeniasir.com.tr", "emlakkulisi.com", 
        "kamusoze.com.tr", "izmir.bel.tr" // Belediyeler de eklendi
    ];
    const siteQuery = `(${trustedSites.map(site => `site:${site}`).join(' OR ')})`;

    // Yatırım ve Yaşam Odaklı Kelimeler
    const pozitifKelimeler = '(' +
        '"imara açıldı" OR "metro durağı" OR "tramvay" OR "yeni yatırım" OR "kentsel dönüşüm" OR ' +
        '"millet bahçesi" OR "sosyal tesis" OR "kültür merkezi" OR "restorasyon" OR ' +
        '"değer kazandı" OR "konut projesi" OR "ulaşım projesi" OR "açılış töreni" OR "vizyon proje"' +
        ')';

    // Genişletilmiş Negatif Filtre
    const negatifKelimeler = '(-kaza -ölü -yaral -cinayet -kavga -hırsız -yangın -tutukl -gözaltı -mahkeme -intihar -enkaz -deprem -sel -şehit -dolandırıcı -ceset -tecavüz -darp)';

    // Ana Sorgu: locationTerm yerine searchQueryLocation kullanıldı.
    const query = `${searchQueryLocation} AND ${pozitifKelimeler} AND ${negatifKelimeler} AND ${siteQuery}`;
    
    // Son 45 gün
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:45d&hl=tr&gl=TR&ceid=TR:tr`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            
            // --- 4. İSTEMCİ TARAFI FİLTRELEME ---
            const processedItems = data.items
                .filter(item => {
                    // 1. Başlık uzunluk kontrolü
                    if (item.title.length < 15) return false; 
                    
                    const titleLower = item.title.toLowerCase();
                    
                    // 2. Blacklist kontrolü (API'den kaçanlar için)
                    const blacklist = ['kaza', 'yaralı', 'vefat', 'bıçaklı', 'silahlı', 'ceset', 'göçük', 'tutukla', 'gözaltı', 'mahkeme', 'asayiş'];
                    if (blacklist.some(word => titleLower.includes(word))) return false;

                    return true;
                })
                .map(item => ({
                    ...item,
                    timestamp: new Date(item.pubDate).getTime()
                }))
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5); // İsteğine göre 5 haber

            if (processedItems.length > 0) {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    items: processedItems
                }));
                
                renderNews(processedItems, newsGrid);
            } else {
                renderEmptyState(newsGrid);
            }

        } else {
            renderEmptyState(newsGrid);
        }
    } catch (error) {
        console.error('Haberler çekilemedi:', error);
        newsGrid.innerHTML = '<p style="color:#777;">Haber akışı şu an yüklenemiyor.</p>';
    }
}

// --- YARDIMCI FONKSİYONLAR ---

function renderNews(items, container) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const dateStr = new Date(item.timestamp || item.pubDate).toLocaleDateString('tr-TR', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });
        
        let cleanTitle = item.title.split(' - ')[0];

        const newsCard = document.createElement('div');
        newsCard.className = 'result-item news-card';

        newsCard.innerHTML = `
            <div class="link-text" style="text-align: left;">
                <span class="news-badge">BÖLGE GÜNDEMİ</span>
                <h4 class="news-title">${cleanTitle}</h4>
                <div class="news-date">
                    <i class="fa-regular fa-clock"></i> ${dateStr}
                </div>
            </div>
            <a href="${item.link}" target="_blank" class="news-link">
                Haberi İncele <i class="fa-solid fa-arrow-right" style="font-size: 11px; margin-left: auto;"></i>
            </a>
        `;
        fragment.appendChild(newsCard);
    });

    container.appendChild(fragment);
}

function renderEmptyState(container) {
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: #777; padding: 20px;">
            <i class="fa-regular fa-newspaper" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
            Bu bölge için son dönemde öne çıkan büyük bir proje veya yatırım haberi bulunamadı.
            <br><small style="font-size: 12px;">Bölge sakin ve yerleşik bir düzene sahip olabilir.</small>
        </div>`;
}