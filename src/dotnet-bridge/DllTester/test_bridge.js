const koffi = require('koffi');
const path = require('path');

// 1. Load DLL
const dllPath = path.resolve(__dirname, '../MT5WebBridge/MT5WebBridge/bin/Release/net10.0-windows/win-x64/publish/MT5WebBridge.dll');
console.log(`[Tester] 🔌 Loading DLL from: ${dllPath}`);

try {
    const lib = koffi.load(dllPath);

    // 2. Define Signatures
    // int WS_Init(const wchar_t* url, const wchar_t* botId);
    // Try passing pointers to buffers directly.
    const WS_Init = lib.func('WS_Init', 'int', ['uint16*', 'uint16*']);

    // int WS_Send(const wchar_t* method, const wchar_t* payload);
    const WS_Send = lib.func('WS_Send', 'void', ['uint16*', 'uint16*']);

    // int WS_GetNext(uint16_t* buffer, int bufferSize);
    // Koffi uses C-style types. 'uint8*' is a pointer to bytes.
    const WS_GetNext = lib.func('WS_GetNext', 'int', ['uint8*', 'int']);

    const WS_Cleanup = lib.func('WS_Cleanup', 'void', []);
    const WS_IsConnected = lib.func('WS_IsConnected', 'int', []);

    // 3. Simulate MT5 Connection
    const url = 'ws://localhost:3000\0';
    const botId = 'RoboForex_67177422_DATAFEED\0'; // REAL BOT ID

    const urlBuf = Buffer.from(url, 'utf16le');
    const botBuf = Buffer.from(botId, 'utf16le');

    console.log(`[Tester] 🔄 Connecting to ${url} as ${botId.trim()}...`);
    console.log(`[Tester] ⏳ Waiting up to 5s for WS_Init...`);
    // Pass the buffer directly (Koffi handles Buffer -> pointer)
    const initRes = WS_Init(urlBuf, botBuf);
    console.log(`[Tester] WS_Init returned: ${initRes}`);

    if (initRes !== 1) {
        console.error('[Tester] ❌ Failed to connect! Verify Backend is running on port 3000.');
        process.exit(1);
    }

    // 3.5 SEND REGISTER COMMAND
    console.log('[Tester] 📤 Sending REGISTER command...');
    const registerMethod = 'REGISTER\0';
    const registerPayload = JSON.stringify({
        type: 'REGISTER',
        id: 'RoboForex_67177422_DATAFEED',
        function: 'DATAFEED',
        symbol: 'EURUSD'
    }) + '\0';

    WS_Send(Buffer.from(registerMethod, 'utf16le'), Buffer.from(registerPayload, 'utf16le'));
    console.log('[Tester] ✅ REGISTER Sent.');

    // 4. Polling Loop
    console.log('[Tester] 👂 Starting Polling Loop (Buffer: 2MB)...');

    // Create Buffer ONCE
    const bufferSizeBytes = 2000000;
    const buffer = Buffer.alloc(bufferSizeBytes); // Raw Buffer (Node.js buffers are Uint8Array)

    setInterval(() => {
        const connected = WS_IsConnected();
        if (connected !== 1) {
            console.log(`[Tester] ⚠️ Logic Disconnected (State: ${connected})`);
            process.exit(0);
        }

        // Pass Buffer Request
        // In MQL5 we pass 'ArraySize * 2'. Here we pass the byte size directly.
        const res = WS_GetNext(buffer, bufferSizeBytes);

        if (res > 0) {
            // Decode (UTF-16LE)
            // The buffer contains the string.
            // Node.js Buffer handling: toString('utf16le')

            // So we read until null terminator.
            const content = buffer.toString('utf16le');
            const nullIndex = content.indexOf('\0');
            const finalMsg = nullIndex >= 0 ? content.substring(0, nullIndex) : content;

            console.log(`[Tester] 📥 WS_GetNext returned: ${res}`);
            console.log(`[Tester] 📜 Payload: ${finalMsg.substring(0, 200)}...`);

            if (finalMsg.startsWith('BIN:')) {
                console.log(`[Tester] 📦 BINARY FRAME DETECTED! Length: ${finalMsg.length}`);
            }
        }
        else if (res < 0) {
            console.error(`[Tester] ❌ WS_GetNext Error: ${res}`);
        }
    }, 100); // Poll every 100ms

    // Handle Exit
    process.on('SIGINT', () => {
        console.log('[Tester] 🛑 Cleaning up...');
        WS_Cleanup();
        process.exit();
    });

} catch (e) {
    console.error('[Tester] 💥 CRTICAL ERROR:', e);
}
