const EventEmitter = require('events');
const db = require('./DatabaseService');

class AssetMappingService extends EventEmitter {
    constructor() {
        super();
        this.cache = new Map(); // original_symbol -> { datafeed_symbol, mappings }
        this.brokerCache = new Map(); // botId -> [symbols]
        this.IGNORE_SENTINEL = '__IGNORE__';
        this.loadMappings();
    }


    loadMappings() {
        try {
            const rows = db.marketDb.prepare('SELECT * FROM asset_mappings').all();
            rows.forEach(row => {
                this.cache.set(row.original_symbol, {
                    datafeed_symbol: row.datafeed_symbol,
                    mappings: JSON.parse(row.mappings || '{}'),
                    news_currency: row.news_currency || 'AUTO'
                });
            });
            console.log(`[AssetMapping] Loaded ${this.cache.size} mappings.`);
        } catch (e) {
            console.error('[AssetMapping] Failed to load mappings:', e);
        }
    }

    getAllMappings() {
        const result = [];
        this.cache.forEach((val, key) => {
            result.push({
                originalSymbol: key,
                datafeedSymbol: val.datafeed_symbol,
                brokerMappings: val.mappings,
                newsCurrency: val.news_currency
            });
        });
        return result;
    }

    saveMapping(originalSymbol, datafeedSymbol, brokerMappings, newsCurrency = 'AUTO') {
        try {
            // Check if column exists, we rely on DatabaseService having created it.
            db.marketDb.prepare(`
                INSERT OR REPLACE INTO asset_mappings (original_symbol, datafeed_symbol, mappings, updated_at, news_currency)
                VALUES (?, ?, ?, ?, ?)
            `).run(originalSymbol, datafeedSymbol, JSON.stringify(brokerMappings), Date.now(), newsCurrency);

            this.cache.set(originalSymbol, {
                datafeed_symbol: datafeedSymbol,
                mappings: brokerMappings,
                news_currency: newsCurrency
            });

            return true;
        } catch (e) {
            console.error('[AssetMapping] Save Error:', e);
            return false;
        }
    }

    /**
     * Synchronize Asset Mappings with the provided Datafeed Configuration.
     * Ensures every configured symbol has a mapping entry.
     * Removes mappings for symbols NOT in the config.
     * @param {Array} configuredSymbols - List of { symbol, botId, originalName? }
     */
    syncWithConfig(configuredSymbols) {
        if (!configuredSymbols) return;

        const validOriginalNames = [];

        configuredSymbols.forEach(s => {
            const botId = s.botId || 'Default';
            const symbol = s.symbol || s.name; // handle variations

            // 1. Determine Original Name (User defined or Default)
            const origName = s.originalName || symbol;
            const datafeedSymbol = `${botId}:${symbol}`;

            // 2. Ensure Limit exists
            // We check if we already have a mapping for this Original Name
            if (!this.cache.has(origName)) {
                console.log(`[AssetMapping] Sync: Creating default mapping for '${origName}' -> '${datafeedSymbol}'`);
                // Create with empty broker mappings
                this.saveMapping(origName, datafeedSymbol, {}, 'AUTO');
            }

            validOriginalNames.push(origName);
        });

        // 3. Prune orphaned (if any were removed from config directly)
        this.pruneMappings(validOriginalNames);
    }

    deleteMapping(originalSymbol) {
        try {
            db.marketDb.prepare('DELETE FROM asset_mappings WHERE original_symbol = ?').run(originalSymbol);
            this.cache.delete(originalSymbol);
            return true;
        } catch (e) {
            console.error('[AssetMapping] Delete Error:', e);
            return false;
        }
    }

    pruneMappings(validOriginalNames) {
        try {
            if (!validOriginalNames || validOriginalNames.length === 0) {
                // Safety check: Avoid deleting everything unless explicitly intended. 
                // But if config is empty, we should arguably clear everything?
                // Let's assume if array is passed, it's authoritative.
                // Using placeholder '____' to avoid SQL syntax error on empty IN clause
                validOriginalNames = ['____'];
            }

            const placeholders = validOriginalNames.map(() => '?').join(',');
            const stmt = db.marketDb.prepare(`DELETE FROM asset_mappings WHERE original_symbol NOT IN (${placeholders})`);
            const info = stmt.run(...validOriginalNames);

            console.log(`[AssetMapping] Pruned ${info.changes} orphaned mappings.`);

            // Refresh Cache
            // We could just filtering the map, but reloading is safer to ensure consistency with DB
            // Or simpler: iterate keys and delete if not in set.
            const validSet = new Set(validOriginalNames);
            for (const key of this.cache.keys()) {
                if (!validSet.has(key)) {
                    this.cache.delete(key);
                }
            }

            return true;
        } catch (e) {
            console.error('[AssetMapping] Prune Error:', e);
            return false;
        }
    }

    updateDatafeedMapping(originalSymbol, datafeedSymbol, newsCurrency = 'AUTO') {
        // 1. Check if this datafeedSymbol is already mapped to a DIFFERENT originalSymbol (Rename Case)
        let oldOriginalSymbol = null;
        let existingMappings = {};

        // Reverse Lookup in Cache
        for (const [key, val] of this.cache.entries()) {
            if (val.datafeed_symbol === datafeedSymbol) {
                if (key !== originalSymbol) {
                    oldOriginalSymbol = key;
                    existingMappings = val.mappings;
                } else {
                    // Already mapped to self, preserve current mappings
                    existingMappings = val.mappings;
                }
                break;
            }
        }

        // 2. If Rename Detected, Delete Old
        if (oldOriginalSymbol) {
            console.log(`[AssetMapping] Rename Detected: ${oldOriginalSymbol} -> ${originalSymbol}. Migrating mappings.`);
            this.deleteMapping(oldOriginalSymbol);
        }

        // 3. Save (New or Update)
        // If not a rename, we might still want to preserve mappings if the entry exists under the SAME name
        if (!oldOriginalSymbol) {
            const sameEntry = this.cache.get(originalSymbol);
            if (sameEntry) {
                existingMappings = sameEntry.mappings;
            }
        }

        return this.saveMapping(originalSymbol, datafeedSymbol, existingMappings, newsCurrency);
    }

    // --- Broker Symbols ---

    updateBrokerSymbols(botId, symbols) {
        try {
            // RESOLVE BROKER ID
            // DatafeedWorker/TradeWorker should ideally pass brokerId, but legacy calls might pass botId.
            // We'll try to resolve it if possible, or assume it is a brokerId if no bot found?
            // BETTER: Work with what's passed, but the CALLER (Worker) is responsible for passing the CORRECT ID (BrokerID).
            // However, to be safe during transition, let's verify.

            // Actually, the Worker will now pass brokerId effectively when calling this? 
            // TradeWorker/DatafeedWorker logic will change to:
            // const brokerId = db.getBrokerIdForBotId(this.botId);
            // this.assetMappingService.updateBrokerSymbols(brokerId, symbols);

            // So we can assume the first argument IS the key we want to use.
            // Let's rename arg to 'brokerId' for clarity in this method.

            const brokerId = botId; // Semantics change

            db.marketDb.prepare(`
                INSERT OR REPLACE INTO broker_symbols (broker_id, symbols, updated_at)
                VALUES (?, ?, ?)
            `).run(brokerId, JSON.stringify(symbols), Date.now());

            this.brokerCache.set(brokerId, symbols);
            console.log(`[AssetMapping] Updated ${symbols.length} symbols for Broker ${brokerId}`);
        } catch (e) {
            console.error('[AssetMapping] Broker Symbol Update Error:', e);
        }
    }

    getKnownBrokers() {
        try {
            const rows = db.marketDb.prepare('SELECT DISTINCT broker_id FROM broker_symbols').all();
            return rows.map(r => r.broker_id);
        } catch (e) {
            console.error('[AssetMapping] Failed to fetch known brokers:', e);
            return [];
        }
    }

    getBrokerSymbols(botIdOrBrokerId) {
        // HYBRID LOOKUP:
        // Input could be a BotID (old way) or BrokerID (new way).
        // 1. Try to find direct match in cache (BrokerID)
        if (this.brokerCache.has(botIdOrBrokerId)) return this.brokerCache.get(botIdOrBrokerId);

        // 2. Try direct DB lookup (BrokerID)
        try {
            const row = db.marketDb.prepare('SELECT symbols FROM broker_symbols WHERE broker_id = ?').get(botIdOrBrokerId);
            if (row) {
                const symbols = JSON.parse(row.symbols);
                this.brokerCache.set(botIdOrBrokerId, symbols);
                return symbols;
            }
        } catch (e) { }

        // 3. Fallback: Try with _DATAFEED suffix (if frontend passed BrokerID 'ICM', check for 'ICM_DATAFEED')
        const fallbackId = botIdOrBrokerId.includes('_DATAFEED') ? botIdOrBrokerId : `${botIdOrBrokerId}_DATAFEED`;
        try {
            const row = db.marketDb.prepare('SELECT symbols FROM broker_symbols WHERE broker_id = ?').get(fallbackId);
            if (row) {
                const symbols = JSON.parse(row.symbols);
                this.brokerCache.set(botIdOrBrokerId, symbols);
                return symbols;
            }
        } catch (e) { }

        // 4. If failed, it might be a BotID. Resolve to BrokerID.
        // Strip _DATAFEED just in case
        const cleanBotId = botIdOrBrokerId.replace('_DATAFEED', '');
        const resolvedBrokerId = db.getBrokerIdForBotId(cleanBotId);

        if (resolvedBrokerId) {
            if (this.brokerCache.has(resolvedBrokerId)) return this.brokerCache.get(resolvedBrokerId);
            try {
                const row = db.marketDb.prepare('SELECT symbols FROM broker_symbols WHERE broker_id = ?').get(resolvedBrokerId);
                if (row) {
                    const symbols = JSON.parse(row.symbols);
                    this.brokerCache.set(resolvedBrokerId, symbols);
                    return symbols;
                }
            } catch (e) { }
        }

        return [];
    }

    /**
     * Resolve an internal Generic Symbol (e.g. "EURUSD") to Broker Specific Symbol (e.g. "6E" or "EURUSD.pro").
     * STRICT 1:1 LOOKUP ALGORITHM:
     * 1. Check Explicit User Mappings in Database (via cache).
     * 2. If mapping exists for this broker, return it exactly.
     * 3. Do NOT use fuzzy logic during execution; fallback to generic symbol only if unmapped.
     */
    getBrokerSymbol(botId, genericSymbol) {
        // 1. Resolve to actual Broker ID
        const cleanBotId = botId.replace('_DATAFEED', '');
        let brokerId = db.getBrokerIdForBotId(cleanBotId);

        // If we still can't find a brokerId, perhaps botId IS the brokerId. Let's assume so.
        if (!brokerId) {
            brokerId = cleanBotId;
        }

        // 2. Lookup Explicit Mapping
        const mappingObj = this.cache.get(genericSymbol);

        if (mappingObj && mappingObj.mappings) {
            const explicitSymbol = mappingObj.mappings[brokerId];

            if (explicitSymbol) {
                if (explicitSymbol === this.IGNORE_SENTINEL) {
                    console.log(`[AssetMapping] 🛑 Symbol ${genericSymbol} is explicitly IGNORED for ${brokerId}`);
                    return this.IGNORE_SENTINEL;
                }

                console.log(`[AssetMapping] ✅ STRICT MATCH: ${genericSymbol} -> ${explicitSymbol} for Broker ${brokerId}`);
                return explicitSymbol;
            }

            // Try fallback to shorthand if mapping was saved using shorthand
            try {
                const brokerData = db.marketDb.prepare('SELECT shorthand FROM brokers WHERE id = ?').get(brokerId);
                if (brokerData && brokerData.shorthand) {
                    const fallbackSymbol = mappingObj.mappings[brokerData.shorthand];
                    if (fallbackSymbol) {
                        if (fallbackSymbol === this.IGNORE_SENTINEL) {
                            console.log(`[AssetMapping] 🛑 Symbol ${genericSymbol} is explicitly IGNORED for ${brokerId} (via shorthand ${brokerData.shorthand})`);
                            return this.IGNORE_SENTINEL;
                        }
                        console.log(`[AssetMapping] ✅ STRICT MATCH (Fallback Shorthand): ${genericSymbol} -> ${fallbackSymbol} for Broker ${brokerId}`);
                        return fallbackSymbol;
                    }
                }
            } catch (e) { /* ignore db error on shorthand lookup */ }
        }

        console.warn(`[AssetMapping] ⚠️ NO EXPLICIT MAPPING found for ${genericSymbol} on Broker ${brokerId}. Falling back to internal symbol.`);
        return genericSymbol;
    }

    /**
     * Ingests symbols from a broker/bot directly into the DB.
     * Handled via SYMBOLS_LIST command.
     */
    ingestBrokerSymbols(symbols, botId) {
        // FAILSAFE: Unwrap if received Wrapped Payload
        if (!Array.isArray(symbols) && symbols && symbols.symbols && Array.isArray(symbols.symbols)) {
            console.log(`[AssetMapping] ⚠️ Auto-Unwrapping Payload. OldBotId: ${botId}`);
            if (symbols.botId) botId = symbols.botId;
            symbols = symbols.symbols;
            console.log(`[AssetMapping] ✅ Unwrapped. NewBotId: ${botId}`);
        }

        if (!Array.isArray(symbols)) {
            console.warn(`[AssetMapping] ingestBrokerSymbols: Expected array, got ${typeof symbols}`);
            return;
        }

        console.log(`[AssetMapping] Ingesting ${symbols.length} symbols for ${botId}`);
        this.updateBrokerSymbols(botId, symbols);

        // Notify Listeners (SystemOrchestrator)
        this.emit('symbols_ingested', { symbols, botId });
    }
}

module.exports = new AssetMappingService();
