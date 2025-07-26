#include "mainwindow.h"
#include <QApplication>
#include <QFileDialog>
#include <QMessageBox>
#include <QCloseEvent>
#include <QSettings>
#include <QStatusBar>
#include <QLabel>
#include <QSplitter>
#include "../utils/settings.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent), currentProject(nullptr)
{
    // Çekirdek bileşenleri başlat
    assembler = new Assembler();
    vm = new VirtualMachine();
    
    // Arayüzü kur
    setupUi();
    createActions();
    createMenus();
    createToolbars();
    createDockWindows();
    connectSignals();
    
    // Pencere ayarları
    setWindowTitle("Gelişmiş Assembly IDE");
    setMinimumSize(800, 600);
    
    // Son projeyi yükle
    QString lastProject = Settings::getInstance().getLastProjectPath();
    if (!lastProject.isEmpty() && QFile::exists(lastProject)) {
        openProject(lastProject);
    } else {
        newProject();
    }
    
    statusBar()->showMessage("Hazır", 3000);
}

MainWindow::~MainWindow()
{
    delete assembler;
    delete vm;
    if (currentProject) {
        delete currentProject;
    }
}

void MainWindow::setupUi()
{
    // Ana widget'ı oluştur
    QWidget* centralWidget = new QWidget(this);
    setCentralWidget(centralWidget);
    
    // Ana layout
    QVBoxLayout* mainLayout = new QVBoxLayout(centralWidget);
    
    // Tab widget (editörler için)
    tabWidget = new QTabWidget(this);
    tabWidget->setTabsClosable(true);
    tabWidget->setMovable(true);
    
    // Varsayılan editörü ekle
    codeEditor = new Editor(this);
    tabWidget->addTab(codeEditor, "untitled.asm");
    
    mainLayout->addWidget(tabWidget);
    
    // Durum çubuğunu ayarla
    QStatusBar* status = statusBar();
    status->showMessage("Hoş geldiniz");
}

void MainWindow::createActions()
{
    // File actions
    newProjectAction = new QAction(QIcon(":/icons/new.png"), tr("Yeni Proje"), this);
    newProjectAction->setShortcut(QKeySequence::New);
    connect(newProjectAction, &QAction::triggered, this, &MainWindow::newProject);
    
    openProjectAction = new QAction(QIcon(":/icons/open.png"), tr("Proje Aç"), this);
    openProjectAction->setShortcut(QKeySequence::Open);
    connect(openProjectAction, &QAction::triggered, this, &MainWindow::openProject);
    
    saveProjectAction = new QAction(QIcon(":/icons/save.png"), tr("Kaydet"), this);
    saveProjectAction->setShortcut(QKeySequence::Save);
    connect(saveProjectAction, &QAction::triggered, this, &MainWindow::saveProject);
    
    // Build actions
    compileAction = new QAction(QIcon(":/icons/compile.png"), tr("Derle"), this);
    compileAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_B));
    connect(compileAction, &QAction::triggered, this, &MainWindow::compileCode);
    
    runAction = new QAction(QIcon(":/icons/run.png"), tr("Çalıştır"), this);
    runAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_R));
    connect(runAction, &QAction::triggered, this, &MainWindow::runCode);
    
    // Debug actions
    debugAction = new QAction(QIcon(":/icons/debug.png"), tr("Hata Ayıkla"), this);
    debugAction->setShortcut(QKeySequence(Qt::CTRL + Qt::Key_D));
    connect(debugAction, &QAction::triggered, this, &MainWindow::debugCode);
    
    stepAction = new QAction(QIcon(":/icons/step.png"), tr("Adım"), this);
    stepAction->setShortcut(QKeySequence(Qt::Key_F10));
    connect(stepAction, &QAction::triggered, this, &MainWindow::stepExecution);
    
    stopAction = new QAction(QIcon(":/icons/stop.png"), tr("Durdur"), this);
    stopAction->setShortcut(QKeySequence(Qt::Key_F9));
    connect(stopAction, &QAction::triggered, this, &MainWindow::stopExecution);
}

void MainWindow::createMenus()
{
    // Menüleri oluştur
    fileMenu = menuBar()->addMenu(tr("Dosya"));
    fileMenu->addAction(newProjectAction);
    fileMenu->addAction(openProjectAction);
    fileMenu->addAction(saveProjectAction);
    fileMenu->addSeparator();
    fileMenu->addAction(tr("Çıkış"), this, &QWidget::close);
    
    editMenu = menuBar()->addMenu(tr("Düzenle"));
    // Düzenleme menü öğeleri...
    
    buildMenu = menuBar()->addMenu(tr("Yapı"));
    buildMenu->addAction(compileAction);
    buildMenu->addAction(runAction);
    
    debugMenu = menuBar()->addMenu(tr("Hata Ayıklama"));
    debugMenu->addAction(debugAction);
    debugMenu->addAction(stepAction);
    debugMenu->addAction(stopAction);
    
    viewMenu = menuBar()->addMenu(tr("Görünüm"));
    // Görünüm menü öğeleri...
    
    helpMenu = menuBar()->addMenu(tr("Yardım"));
    helpMenu->addAction(tr("Hakkında"), this, &MainWindow::showAbout);
}

void MainWindow::createToolbars()
{
    // Araç çubuklarını oluştur
    fileToolBar = addToolBar(tr("Dosya"));
    fileToolBar->addAction(newProjectAction);
    fileToolBar->addAction(openProjectAction);
    fileToolBar->addAction(saveProjectAction);
    
    buildToolBar = addToolBar(tr("Yapı"));
    buildToolBar->addAction(compileAction);
    buildToolBar->addAction(runAction);
    
    debugToolBar = addToolBar(tr("Hata Ayıklama"));
    debugToolBar->addAction(debugAction);
    debugToolBar->addAction(stepAction);
    debugToolBar->addAction(stopAction);
}

void MainWindow::createDockWindows()
{
    // Hata ayıklama paneli
    QDockWidget *debugDock = new QDockWidget(tr("Hata Ayıklama"), this);
    debugDock->setAllowedAreas(Qt::BottomDockWidgetArea | Qt::RightDockWidgetArea);
    debugger = new Debugger(debugDock);
    debugDock->setWidget(debugger);
    addDockWidget(Qt::BottomDockWidgetArea, debugDock);
    viewMenu->addAction(debugDock->toggleViewAction());
    
    // Kayıt görüntüleme paneli
    QDockWidget *registerDock = new QDockWidget(tr("Kayıtlar"), this);
    registerDock->setAllowedAreas(Qt::BottomDockWidgetArea | Qt::RightDockWidgetArea);
    registerView = new RegisterView(registerDock);
    registerDock->setWidget(registerView);
    addDockWidget(Qt::RightDockWidgetArea, registerDock);
    viewMenu->addAction(registerDock->toggleViewAction());
}

void MainWindow::compileCode()
{
    statusBar()->showMessage("Derleniyor...");
    
    // Aktif editörden kodu al
    Editor* currentEditor = static_cast<Editor*>(tabWidget->currentWidget());
    if (!currentEditor) return;
    
    QString sourceCode = currentEditor->toPlainText();
    
    // Assembler ile derle
    bool success = assembler->compile(sourceCode);
    
    if (success) {
        debugger->setOutput("Derleme başarılı.");
        statusBar()->showMessage("Derleme başarılı", 3000);
    } else {
        debugger->setOutput("Derleme hatası: " + assembler->getLastError());
        statusBar()->showMessage("Derleme hatası", 3000);
    }
}

void MainWindow::runCode()
{
    statusBar()->showMessage("Çalıştırılıyor...");
    
    // Önce derle
    compileCode();
    if (!assembler->hasCompiledCode()) {
        statusBar()->showMessage("Çalıştırma başarısız: Derleme hatası", 3000);
        return;
    }
    
    // Derlenmiş kodu VM'e aktar
    vm->loadProgram(assembler->getCompiledCode());
    
    // Çalıştır
    vm->run();
    
    // Çalıştırma sonuçlarını göster
    debugger->setOutput(vm->getOutput());
    registerView->updateRegisters(vm->getRegisters());
    
    statusBar()->showMessage("Çalıştırma tamamlandı", 3000);
}

void MainWindow::showAbout()
{
    QMessageBox::about(this, tr("Hakkında"),
        tr("Gelişmiş Assembly IDE v1.0\n\n"
           "Modern, tam özellikli bir Assembly geliştirme ortamı.\n"
           "Kendi derleyici ve sanal makinesi ile birlikte gelir.\n\n"
           "© 2025 Assembly IDE Team"));
}