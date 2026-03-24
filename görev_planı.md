# 📋 Oyun Projesi Görev Planı

Bu belge, projenin gelişim sürecini ve yapılacak işleri takip etmek amacıyla oluşturulmuştur.

## ✅ Tamamlanan Görevler
- [x] **Proje Kurulumu**: React altyapısı ve temel dosya yapısı oluşturuldu.
- [x] **Oyun Motoru**: Temel savaş mantığı (Otomatik Savaş) geliştirildi.
- [x] **Hayvan Kütüphanesi**: Tier 1-6 arası çeşitli hayvanlar ve yetenekleri eklendi.
- [x] **Gelişmiş Grafikler**: Animasyonlar, parçacık efektleri ve 3D kart tasarımları uygulandı.
- [x] **UI/UX Yenileme**: Ana menü sadeleştirildi, bekleme süreleri iyileştirildi.
- [x] **Zorluk Seviyeleri**: Kolay, Orta ve Zor modlar eklendi.
- [x] **Hızlı İlerleme**: Takım ve mağaza slotları artık daha erken (3. ve 5. turlar) açılıyor.
- [x] **Firebase Entegrasyonu**: 
    - [x] Firebase projesi bağlandı (`src/firebase.js`).
    - [x] Google ve E-posta ile giriş sistemi eklendi.
    - [x] Kullanıcı oturum yönetimi sağlandı.
- [x] **Arena Modu (PvP)**: 
    - [x] Kazanan takımların Firestore'a kaydedilmesi.
    - [x] Diğer oyuncuların takımlarıyla asenkron savaşma sistemi.
- [x] **Savaş Akışı ve Görsel Modernizasyon**: 
    - [x] Savaşın takılma hatası (LastProcessedStep) giderildi.
    - [x] Takım yerleşimleri ve bakış yönleri düzeltildi (Sol: Oyuncu, Sağ: Düşman).
    - [x] Arayüz "Premium Glassmorphism" ve "Arena Perspektifi" ile modernize edildi.
    - [x] Gereksiz görsel efektler temizlendi ve boss dengeleri sağlandı.

## ⏳ Devam Eden & Yakında Yapılacaklar
- [x] **Firebase Yapılandırması**: `src/firebase.js` içindeki konfigürasyon bilgilerinin kullanıcı tarafından güncellenmesi.
- [x] **Eşleştirme Sistemi (Matchmaking)**: Arena modunda oyuncu gücüne göre daha dengeli rakiplerin seçilmesi.
- [x] **Versus Modu (Canlı 1v1)**: Gerçek zamanlı karşılıklı oyun modunun geliştirilmesi.
- [x] **Mağaza & Ekonomi Geliştirmeleri**: Yeni eşyalar ve kalıcı geliştirmeler.
- [x] **Ses ve Müzik**: Eksik ses efektlerinin tamamlanması ve arka plan müziği.
- [x] **Dosya Temizliği**: Proje klasöründeki gereksiz dosyaların temizlenmesi (Şu an yapılıyor).

## 🛠️ Teknik Bakım
- [x] Kod refaktörizasyonu (App.js'in parçalara bölünmesi).
- [x] Performans optimizasyonları.
- [x] Mobil uyumluluk kontrolleri.

## 🚀 Yeni Yol Haritası (Faz 2)
### 1. Mimari İyileştirmeler (Kritik)
- [ ] **App.js Refactoring**: Global state yönetimine (Context API) geçiş ve projenin modülerleşmesi.
- [ ] **Versus Modu Görselleri**: Versus modunda "emoji" kullanımının bırakılıp public klasöründeki gerçek hayvan resimlerinin kullanılması.

### 2. Grafik ve Oyun Motoru
- [ ] **PixiJS Entegrasyonu (Ar-Ge)**: PixiJS mimarisini kurarak savaş sahnelerinde 60FPS ve gelişmiş parçacık / yetenek animasyonları tasarlamak.

### 3. İleri Ekonomi ve Oyun Modları
- [ ] Daha çeşitli eşya (item) havuzu ve gelişmiş mağaza sistemleri.
