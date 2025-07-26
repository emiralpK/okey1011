#ifndef EDITOR_H
#define EDITOR_H

#include <QPlainTextEdit>
#include <QSyntaxHighlighter>
#include <QCompleter>

class SyntaxHighlighter;
class LineNumberArea;

class Editor : public QPlainTextEdit
{
    Q_OBJECT

public:
    Editor(QWidget *parent = nullptr);
    ~Editor();
    
    void lineNumberAreaPaintEvent(QPaintEvent *event);
    int lineNumberAreaWidth();
    
    bool loadFile(const QString &fileName);
    bool saveFile(const QString &fileName);
    
    QString getCurrentFileName() const { return currentFile; }
    void setCurrentFileName(const QString &fileName);
    
protected:
    void resizeEvent(QResizeEvent *event) override;
    void keyPressEvent(QKeyEvent *event) override;
    
private slots:
    void updateLineNumberAreaWidth(int newBlockCount);
    void highlightCurrentLine();
    void updateLineNumberArea(const QRect &rect, int dy);
    void insertCompletion(const QString &completion);
    
private:
    void createCompleter();
    
    QString currentFile;
    SyntaxHighlighter *highlighter;
    LineNumberArea *lineNumberArea;
    QCompleter *completer;
};

// Satır numaraları için yardımcı widget
class LineNumberArea : public QWidget
{
public:
    LineNumberArea(Editor *editor) : QWidget(editor), codeEditor(editor) {}
    
    QSize sizeHint() const override {
        return QSize(codeEditor->lineNumberAreaWidth(), 0);
    }
    
protected:
    void paintEvent(QPaintEvent *event) override {
        codeEditor->lineNumberAreaPaintEvent(event);
    }
    
private:
    Editor *codeEditor;
};

#endif // EDITOR_H