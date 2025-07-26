#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QMenu>
#include <QMenuBar>
#include <QToolBar>
#include <QStatusBar>
#include <QDockWidget>
#include <QTabWidget>
#include "editor.h"
#include "debugger.h"
#include "register_view.h"
#include "../core/assembler.h"
#include "../core/vm.h"
#include "../core/project.h"

class MainWindow : public QMainWindow {
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void newProject();
    void openProject();
    void saveProject();
    void saveProjectAs();
    void closeProject();
    
    void compileCode();
    void runCode();
    void debugCode();
    void stopExecution();
    void stepExecution();
    
    void showSettings();
    void showAbout();

private:
    void setupUi();
    void createActions();
    void createMenus();
    void createToolbars();
    void createDockWindows();
    void connectSignals();
    void updateWindowTitle();

    // Arayüz bileşenleri
    Editor* codeEditor;
    Debugger* debugger;
    RegisterView* registerView;
    QTabWidget* tabWidget;
    
    // Çekirdek bileşenler
    Assembler* assembler;
    VirtualMachine* vm;
    Project* currentProject;
    
    // Menüler ve araç çubukları
    QMenu* fileMenu;
    QMenu* editMenu;
    QMenu* buildMenu;
    QMenu* debugMenu;
    QMenu* viewMenu;
    QMenu* helpMenu;
    
    QToolBar* fileToolBar;
    QToolBar* editToolBar;
    QToolBar* buildToolBar;
    QToolBar* debugToolBar;
};

#endif // MAINWINDOW_H