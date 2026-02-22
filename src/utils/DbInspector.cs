using System;
using System.Data;
using System.IO;
using System.Data.SQLite; // We might need to copy this DLL from NT8 bin

namespace DbInspector
{
    class Program
    {
        static void Main(string[] args)
        {
            string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "NinjaTrader 8", "db", "NinjaTrader.sqlite");
            string nt8Bin = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "NinjaTrader 8", "bin", "Custom");
            // NT8 Core usually has SQLite in Program Files.
            
            Console.WriteLine($"Inspecting: {dbPath}");

            try 
            {
                // We assume System.Data.SQLite is available or we fail?
                // We'll try to reflect load it? No, too complex.
                // Let's just try to open as text? No, it's binary.
            } 
            catch (Exception ex) 
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
