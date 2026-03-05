using System;
using System.IO;

namespace AwesomeCockpit.NT8.Bridge
{
    public static class BridgeLogger
    {
        private static string _logDirectory = string.Empty;
        private static readonly object _lock = new object();

        public static string LogDirectory
        {
            get { return _logDirectory; }
            set
            {
                _logDirectory = value;
                try
                {
                    if (!string.IsNullOrEmpty(_logDirectory) && !Directory.Exists(_logDirectory))
                    {
                        Directory.CreateDirectory(_logDirectory);
                    }
                }
                catch { }
            }
        }

        public static void Log(string message)
        {
            if (string.IsNullOrEmpty(_logDirectory)) return;

            try
            {
                lock (_lock)
                {
                    string fileName = $"nt8_bridge_{DateTime.Now:yyyyMMdd}.log";
                    string filePath = Path.Combine(_logDirectory, fileName);
                    string logLine = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} | {message}";

                    File.AppendAllText(filePath, logLine + Environment.NewLine);
                }
            }
            catch
            {
                // Silently fail if we can't write to the log file to avoid crashing the bridge
            }
        }
    }
}
