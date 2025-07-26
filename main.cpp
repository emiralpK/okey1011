#include <QApplication>
#include "gui/mainwindow.h"
#include "core/assembler.h"
#include "core/vm.h"
#include "utils/settings.h"

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);
    
    // Uygulama ayarlarını yükle
    Settings::getInstance().loadSettings();
    
    // Ana pencereyi oluştur ve göster
    MainWindow mainWindow;
    mainWindow.show();
    
    return app.exec();
}