#ifndef VIRTUAL_MACHINE_H
#define VIRTUAL_MACHINE_H

#include <QString>
#include <QVector>
#include <QMap>
#include "assembler.h"

// Kayıt adları için enum
enum RegisterName {
    REG_AX = 0,
    REG_BX,
    REG_CX,
    REG_DX,
    REG_SP,
    REG_BP,
    REG_SI,
    REG_DI,
    REG_IP,
    REG_FLAGS,
    REG_COUNT  // Toplam kayıt sayısı
};

// Sanal Makine sınıfı
class VirtualMachine {
public:
    VirtualMachine(uint32_t memSize = 65536);  // Varsayılan 64KB bellek
    ~VirtualMachine();
    
    // Programı yükle ve çalıştır
    void loadProgram(const QVector<Instruction> &program);
    void run();
    void step();
    void reset();
    void stop();
    
    // Durum ve sonuçlar
    bool isRunning() const { return running; }
    QString getOutput() const { return output; }
    QMap<QString, uint32_t> getRegisters() const;
    QByteArray getMemoryDump(uint32_t start, uint32_t size) const;
    
    // Hata durumları
    QString getLastError() const { return lastError; }
    
private:
    // İşlem işleme fonksiyonu
    bool executeInstruction(const Instruction &instr);
    
    // Bellek ve kayıtlar
    QVector<uint8_t> memory;       // Sanal bellek
    uint32_t registers[REG_COUNT]; // Kayıtlar
    
    // Çalışma durumu
    bool running;
    QString output;
    QString lastError;
    
    // Opcode işleyicileri
    typedef bool (VirtualMachine::*OpcodeHandler)(const Instruction &);
    QVector<OpcodeHandler> opcodeHandlers;
    
    // Belirli işlem işleyicileri
    bool handleMOV(const Instruction &instr);
    bool handleADD(const Instruction &instr);
    bool handleSUB(const Instruction &instr);
    bool handleMUL(const Instruction &instr);
    bool handleDIV(const Instruction &instr);
    bool handleJMP(const Instruction &instr);
    bool handleJZ(const Instruction &instr);
    bool handleJNZ(const Instruction &instr);
    bool handleCALL(const Instruction &instr);
    bool handleRET(const Instruction &instr);
    bool handlePUSH(const Instruction &instr);
    bool handlePOP(const Instruction &instr);
    bool handleINT(const Instruction &instr);
    
    // Yardımcı fonksiyonlar
    void initOpcodeHandlers();
    void updateFlags(uint32_t result);
    bool isValidMemoryAccess(uint32_t address, uint32_t size = 1);
};

#endif // VIRTUAL_MACHINE_H