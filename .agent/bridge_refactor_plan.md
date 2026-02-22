# Bridge Refactoring Plan
1. [x] Create connection manager struct/class in C#.
2. [ ] Modify WS_Init to return handle (int).
3. [ ] Modify WS_Send/WS_SendBin to accept handle.
4. [ ] Modify WS_GetNext to accept handle.

# MQL5 Refactoring Plan
1. [ ] Update DLL Import signatures.
2. [ ] Update CWebSocketClient to store handle.
3. [ ] Update Connect/Send/GetNext methods.
