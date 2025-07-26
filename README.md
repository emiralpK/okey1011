# Gelişmiş Assembly IDE

Kendi derleyicisi ve sanal makinesi bulunan modern, gelişmiş bir Assembly geliştirme ortamı.

## Özellikler

- 🚀 Modern ve kullanıcı dostu arayüz
- 🔍 Gelişmiş sözdizimi vurgulama ve otomatik tamamlama
- ⚙️ Özelleştirilebilir entegre derleyici
- 🔄 Entegre sanal makine ve hata ayıklayıcı
- 🛠️ Adım adım kod yürütme ve izleme
- 📊 Kayıt ve bellek görüntüleyicileri
- 📁 Proje yönetim sistemi

## Kurulum

### Gereksinimler
- CMake 3.12 veya daha yüksek
- C++17 destekli derleyici (GCC 8+, MSVC 2019+, Clang 9+)
- Qt 6.0 veya daha yüksek

### Windows'ta Kurulum
```bash
git clone https://github.com/kullanici/advanced-assembly-ide.git
cd advanced-assembly-ide
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

### Linux/MacOS'ta Kurulum
```bash
git clone https://github.com/kullanici/advanced-assembly-ide.git
cd advanced-assembly-ide
mkdir build && cd build
cmake ..
make
```

## Kullanım

### Yeni Bir Proje Oluşturma
1. `Dosya > Yeni Proje` menüsünü seçin
2. Proje adını ve konumunu belirtin
3. Proje şablonu seçin (isteğe bağlı)
4. `Oluştur` düğmesine tıklayın

### Kodu Derleme ve Çalıştırma
1. Kodunuzu editörde yazın veya düzenleyin
2. `Yapı > Derle` (Ctrl+B) ile derleyin
3. `Yapı > Çalıştır` (Ctrl+R) ile çalıştırın

### Hata Ayıklama
1. `Hata Ayıkla > Hata Ayıkla` (Ctrl+D) ile hata ayıklama modunda başlatın
2. Kesme noktaları ayarlamak için satır numaralarına tıklayın
3. `Hata Ayıkla > Adım` (F10) ile kod yürütmesini adım adım ilerletin
4. Kayıtları ve belleği Kayıt Görüntüleyici panelinden izleyin

## Desteklenen Assembly Komutları

IDE, x86/x64 assembly dilinde aşağıdaki komutları destekler:

### Veri Taşıma
- `MOV dest, src` - Kaynaktan hedefe değer taşır
- `PUSH src` - Değeri yığına iter
- `POP dest` - Değeri yığından çeker

### Aritmetik
- `ADD dest, src` - Toplama
- `SUB dest, src` - Çıkarma
- `MUL src` - Çarpma
- `DIV src` - Bölme
- `INC dest` - Bir artır
- `DEC dest` - Bir azalt

### Mantıksal
- `AND dest, src` - Mantıksal VE
- `OR dest, src` - Mantıksal VEYA
- `XOR dest, src` - Mantıksal XOR
- `NOT dest` - Mantıksal DEĞİL

### Dallanma
- `JMP label` - Koşulsuz atlama
- `JE/JZ label` - Eşitse/Sıfırsa atlama
- `JNE/JNZ label` - Eşit değilse/Sıfır değilse atlama
- `JG/JNLE label` - Büyükse atlama
- `JL/JNGE label` - Küçükse atlama
- `CALL label` - Alt programı çağır
- `RET` - Alt programdan dön

### Sistem
- `INT num` - Kesme çağır
- `NOP` - İşlem yok

## Katkıda Bulunma

Projeye katkıda bulunmak için:

1. Bu depoyu forklayın
2. Yeni bir özellik dalı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commitleyin (`git commit -m 'Yeni özellik: X'`)
4. Dalı pushlayın (`git push origin yeni-ozellik`)
5. Bir Pull Request açın

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Sorular ve geri bildirimler için [issues sayfası](https://github.com/kullanici/advanced-assembly-ide/issues) kullanabilirsiniz.