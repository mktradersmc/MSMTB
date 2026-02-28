//+------------------------------------------------------------------+
//|                                                     Profiler.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

input bool ProfilingActive = true;  // Aktiviert/Deaktiviert das Profiling

class CProfiler
{
private:
    static int     m_indentLevel;         // Aktuelle Einrückungsebene 
    static ulong   m_startTimes[];        // Array für Startzeiten
    static string  m_startTimeNames[];    // Array für Funktionsnamen
    static int     m_fileHandle;          // Handle für die Profiler-Datei
    static string  m_fileName;            // Name der Profiler-Datei
    
public:
    static void init();
    static void deinit();
    static void start(string functionName);
    static void end(string functionName);
    
private:
    static string getIndentation();
    static void saveStartTime(string functionName, ulong time);
    static int ArraySearch(string &arr[], string value);
    static void removeEntry(int index);
    static void writeToFile(string message);
};

// Initialisierung der statischen Klassenvariablen
int     CProfiler::m_indentLevel   = 0;
ulong   CProfiler::m_startTimes[];
string  CProfiler::m_startTimeNames[];
int     CProfiler::m_fileHandle    = INVALID_HANDLE;
string  CProfiler::m_fileName      = "profiler.txt";

//+------------------------------------------------------------------+
//| Initialisiert den Profiler                                        |
//+------------------------------------------------------------------+
void CProfiler::init()
{
    if(!ProfilingActive) return;
    
    // Öffne die Datei zum Schreiben
    m_fileHandle = FileOpen(m_fileName, FILE_WRITE|FILE_TXT);
    if(m_fileHandle == INVALID_HANDLE)
    {
        Print("Fehler beim Öffnen der Profiler-Datei: ", GetLastError());
        return;
    }
    
    // Schreibe Header
    writeToFile("Profiling started at " + TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES|TIME_SECONDS));
}

//+------------------------------------------------------------------+
//| Schließt den Profiler                                             |
//+------------------------------------------------------------------+
void CProfiler::deinit()
{
    if(!ProfilingActive) return;
    
    if(m_fileHandle != INVALID_HANDLE)
    {
        writeToFile("Profiling ended at " + TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES|TIME_SECONDS));
        FileClose(m_fileHandle);
        m_fileHandle = INVALID_HANDLE;
    }
}

//+------------------------------------------------------------------+
//| Startet die Zeitmessung für eine Funktion                         |
//+------------------------------------------------------------------+
void CProfiler::start(string functionName)
{
    if(!ProfilingActive) return;
    
    // Startzeit speichern
    saveStartTime(functionName, GetMicrosecondCount());
    
    // Einrückung für nachfolgende Funktionen erhöhen
    m_indentLevel++;
}

//+------------------------------------------------------------------+
//| Beendet die Zeitmessung und gibt die Dauer aus                    |
//+------------------------------------------------------------------+
void CProfiler::end(string functionName)
{
    if(!ProfilingActive) return;
    
    // Einrückung für nachfolgende Funktionen verringern
    m_indentLevel--;
    
    // Dauer berechnen
    ulong endTime = GetMicrosecondCount();
    int index = ArraySearch(m_startTimeNames, functionName);
    
    if(index != -1)
    {
        ulong duration = endTime - m_startTimes[index];
        
        // Ausgabe mit korrekter Einrückung
        string indent = getIndentation();
        string message = indent + functionName + ": " + IntegerToString(duration) + " microseconds";
        writeToFile(message);
        
        // Eintrag entfernen und Arrays optimieren
        removeEntry(index);
    }
    else
    {
        Print("Warnung: Keine Startzeit für Funktion ", functionName, " gefunden!");
    }
}

//+------------------------------------------------------------------+
//| Erzeugt den Einrückungsstring basierend auf m_indentLevel        |
//+------------------------------------------------------------------+
string CProfiler::getIndentation()
{
    string indent = "";
    for(int i = 0; i < m_indentLevel; i++)
    {
        indent += "    "; // 4 Leerzeichen pro Einrückungsebene
    }
    return indent;
}

//+------------------------------------------------------------------+
//| Speichert die Startzeit für eine Funktion                         |
//+------------------------------------------------------------------+
void CProfiler::saveStartTime(string functionName, ulong time)
{
    // Prüfen ob der Funktionsname bereits existiert
    int index = ArraySearch(m_startTimeNames, functionName);
    
    if(index == -1)
    {
        // Neuen Eintrag hinzufügen
        int size = ArraySize(m_startTimeNames);
        ArrayResize(m_startTimeNames, size + 1);
        ArrayResize(m_startTimes, size + 1);
        m_startTimeNames[size] = functionName;
        m_startTimes[size] = time;
    }
    else
    {
        // Existierenden Eintrag aktualisieren
        m_startTimes[index] = time;
    }
}

//+------------------------------------------------------------------+
//| Entfernt einen Eintrag aus den Arrays und optimiert die Größe     |
//+------------------------------------------------------------------+
void CProfiler::removeEntry(int index)
{
    int size = ArraySize(m_startTimeNames);
    
    // Letzten Eintrag an die zu löschende Position kopieren
    if(index < size - 1)
    {
        m_startTimeNames[index] = m_startTimeNames[size - 1];
        m_startTimes[index] = m_startTimes[size - 1];
    }
    
    // Arrays verkleinern
    ArrayResize(m_startTimeNames, size - 1);
    ArrayResize(m_startTimes, size - 1);
}

//+------------------------------------------------------------------+
//| Hilfsfunktion zum Suchen in Arrays                                |
//+------------------------------------------------------------------+
int CProfiler::ArraySearch(string &arr[], string value)
{
    int size = ArraySize(arr);
    for(int i = 0; i < size; i++)
    {
        if(arr[i] == value)
            return i;
    }
    return -1;
}

//+------------------------------------------------------------------+
//| Schreibt eine Nachricht in die Profiler-Datei                     |
//+------------------------------------------------------------------+
void CProfiler::writeToFile(string message)
{
    if(m_fileHandle != INVALID_HANDLE)
    {
        FileWrite(m_fileHandle, message);
        FileFlush(m_fileHandle);
    }
}
