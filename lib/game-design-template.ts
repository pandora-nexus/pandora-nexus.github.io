export function generateGameDesignDocument(projectTitle: string): string {
  return `# Game Design Document — ${projectTitle}

## 1. Proje Kimliği
- **Proje Adı:** ${projectTitle}
- **Tür:** (RPG, FPS, Platform, vb.)
- **Perspektif:** (1. Şahıs, 3. Şahıs, Üstten, Yandan)
- **Platform:** (PC, Mobil, Web, Konsol)
- **Oyun Motoru:** (Godot, Unity, Unreal)

## 2. Konsept ve Hikaye
- **Kısa Özet:** Oyunun temel konusu nedir?
- **Hikaye Arka Planı:** Dünya, karakterler, çatışma.
- **Ana Karakter:** Kim? Özellikleri neler?
- **Hedef Kitle:** Kimler oynayacak?

## 3. Oynanış ve Mekanikler
- **Temel Oynanış Döngüsü:** Oyuncu ne yapar? (Keşfet, savaş, inşa et, vb.)
- **Savaş Sistemi:** (Sıra tabanlı, gerçek zamanlı, aksiyon)
- **İlerleme Sistemi:** Seviye atlama, yetenek ağacı, eşya toplama.
- **Ekonomi:** Para birimi, ticaret, crafting.
- **Multiplayer:** (Yok, co-op, PvP, MMO)

## 4. Dünya ve Seviyeler
- **Dünya Türü:** (Açık dünya, bölüm tabanlı, prosedürel)
- **Seviye Sayısı:** Kaç bölüm/alan var?
- **Ortamlar:** Orman, şehir, zindan, uzay...
- **Harita Boyutu:** (Küçük, Orta, Devasa)

## 5. Görsel ve İşitsel Stil
- **Sanat Tarzı:** (Pixel art, anime, realist, low-poly)
- **Renk Paleti:** (Canlı, karanlık, pastel)
- **Müzik Tarzı:** (Orkestral, elektronik, chiptune)
- **Ses Efektleri:** (Gerçekçi, abartılı, minimal)

## 6. Teknik Gereksinimler
- **Motor:** (Godot 4.x, Unity 2023 LTS, Unreal 5.x)
- **Script Dili:** (GDScript, C#, C++)
- **Veritabanı:** (Gerekli mi? SQLite, PostgreSQL)
- **Çok Oyunculu Altyapı:** (Photon, Steamworks, özel sunucu)

## 7. Varlık Listesi (Assetler)
- **Karakterler:** Ana karakter, düşmanlar, NPC'ler.
- **Ortam:** Zemin, duvar, dekor, arka plan.
- **UI:** Butonlar, paneller, fontlar.
- **Ses:** Müzikler, efektler.

## 8. Proje Takvimi
- **Prototip:** (Tarih)
- **Alpha:** (Tarih)
- **Beta:** (Tarih)
- **Çıkış:** (Tarih)

## 9. Riskler ve Çözümler
- **Risk 1:** ...
- **Risk 2:** ...
- **Risk 3:** ...

## 10. Onay
- **Patron Onayı:** (Bekleniyor / Onaylandı)
- **Tarih:** ...
`;
}