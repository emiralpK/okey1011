#ifndef ASSEMBLER_H
#define ASSEMBLER_H

#include <QString>
#include <QVector>
#include <QMap>
#include <QSet>

// Makine kodu için temel veri yapısı
struct Instruction {
    uint32_t opcode;    // İşlem kodu
    uint32_t operand1;  // İlk işlenen
    uint32_t operand2;  // İkinci işlenen
    uint32_t operand3;  // Üçüncü işlenen
};

// Assembly derleyici
class Assembler {
public:
    Assembler();
    ~Assembler();
    
    // Derleme fonksiyonları
    bool compile(const QString &sourceCode);
    bool hasCompiledCode() const { return !compiledCode.isEmpty(); }
    QVector<Instruction> getCompiledCode() const { return compiledCode; }
    
    // Hata yönetimi
    QString getLastError() const { return lastError; }
    
    // Desteklenen işlemler
    QStringList getSupportedInstructions() const;
    
private:
    // Derleme yardımcı fonksiyonları
    bool parseLine(const QString &line, int lineNumber);
    bool parseInstruction(const QString &instruction, const QStringList &operands, int lineNumber);
    bool resolveLabels();
    uint32_t getRegisterValue(const QString &reg);
    
    // Adres ve etiket yönetimi
    QMap<QString, uint32_t> labels;        // Etiketler ve adresleri
    QVector<std::pair<uint32_t, QString>> unresolvedLabels;  // Çözümlenmemiş etiketler
    
    // Derleme durumu
    QVector<Instruction> compiledCode;     // Derlenmiş kod
    QString lastError;                     // Son hata mesajı
    uint32_t currentAddress;               // Mevcut derleme adresi
    
    // İşlem kodu tablosu
    QMap<QString, uint32_t> opcodeTable;   // İşlem ve opcode eşleşmeleri
    
    // Kayıt tablosu
    QMap<QString, uint32_t> registerTable; // Kayıt isimleri
};

#endif // ASSEMBLER_H