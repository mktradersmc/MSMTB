
const path = require('path');

module.exports = {
    // Communication
    PIPE_NAME: '\\\\.\\pipe\\MT5_Node_Bridge', // Legacy (Remove later if unused)
    PIPE_NAME_TICKS: '\\\\.\\pipe\\MT5_Node_Ticks',
    PIPE_NAME_COMMANDS: '\\\\.\\pipe\\MT5_Node_Commands',
    PIPE_NAME_HISTORY: '\\\\.\\pipe\\MT5_Node_History',
    PIPE_NAME_HEARTBEAT: '\\\\.\\pipe\\MT5_Node_Heartbeat',
    HTTP_PORT: 3005,
    DB_MARKET_PATH: path.join(__dirname, '..', 'market_data.db'),
    DB_TRADES_PATH: path.join(__dirname, '..', 'trades.db'),

    // Deployment & Restart Configuration
    // PLEASE VERIFY THESE PATHS (Placeholder: Update with actual paths)
    MT5_MQL5_DIR: 'C:\\Users\\Michael\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5',
    MT5_TERMINAL_EXE: 'C:\\Program Files\\MetaTrader 5\\terminal64.exe',
    // Default timeframes we care about if not specified
    DEFAULT_TIMEFRAMES: [
        'M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30',
        'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12',
        'D1', 'W1', 'MN1'
    ],
    // Sync threshold: if gap > X seconds, request backfill
    SYNC_THRESHOLD_SEC: 60 * 60, // 1 hour default

    // Logging
    LOG_DIR: path.join(__dirname, '..', 'logs'),

    // Features / Performance Switches (Defaults)
    DEFAULT_FEATURES: {
        // Task 0210: ENABLE_STARTUP_RESTORATION Removed (Always ON)
        ENABLE_STARTUP_SANITY_CHECK: false,     // 10s Startup Audit
        ENABLE_PERIODIC_SANITY_CHECK: false,    // 5min Heartbeat Audit
        ENABLE_REGISTRATION_SANITY_CHECK: false,// Immediate Check on Connect
        ENABLE_CONSISTENCY_SCHEDULER: false,    // Hourly/Minutely Integrity
        ENABLE_DEEP_HISTORY_SYNC: true,        // Recursive Backward Fill
        ENABLE_TICK_LOGGING: false,            // Verbose Tick Logging
        ENABLE_BAR_DATA_LOGGING: false,        // Verbose Bar Data Logging (User Request)
        ENABLE_INDICATOR_LOGGING: false,       // Detailed Indicator Calculations
        ENABLE_DETAILED_PROTOCOL_LOGGING: false // Detailed Protocol Trace (User Request)
    }
};
