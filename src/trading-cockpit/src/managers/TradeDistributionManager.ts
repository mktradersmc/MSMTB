import { TradingAccount, Broker } from '../lib/mt-manager/types';

interface DistributionConfig {
    brokers: {
        [brokerId: string]: {
            loop_size: number;
            matrix: {
                [step: string]: string[]; // step "1" -> ["accId1", "accId2"]
            }
        }
    };
    test_brokers?: {
        [brokerId: string]: {
            loop_size: number;
            matrix: {
                [step: string]: string[];
            }
        }
    };
}

export interface ExecutionBatch {
    brokerId: string;
    trade: any; // The trade object with mapped symbol
    accounts: any[]; // TradingAccount objects
}

export class TradeDistributionManager {

    // --- Configuration Loading ---
    static async getDistributionConfig(): Promise<DistributionConfig | null> {
        try {
            const res = await fetch('/api/distribution/config', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                console.log("[TradeDistribution] Loaded Config:", data);
                return data;
            } else {
                console.error(`[TradeDistribution] Config fetch failed: ${res.status} ${res.statusText}`);
            }
        } catch (e) {
            console.error("[TradeDistribution] Failed to load config", e);
        }
        return null;
    }

    // --- Core Logic ---
    static distributeTrade(
        baseTrade: any,
        accounts: TradingAccount[],
        brokers: Broker[],
        config: DistributionConfig | null,
        isTestMode: boolean = false,
        previewOnly: boolean = false
    ): ExecutionBatch[] {
        const batches: ExecutionBatch[] = [];

        console.log(`\n======================================================`);
        console.log(`[TradeDistribution] 🚀 DISTRIBUTE TRADE INITIATED`);
        console.log(`[TradeDistribution] Symbol: ${baseTrade?.symbol}, isTestMode: ${isTestMode}, previewOnly: ${previewOnly}`);
        console.log(`[TradeDistribution] Input Config:`, config ? `Loaded (${Object.keys(config.brokers||{}).length} live, ${Object.keys(config.test_brokers||{}).length} test)` : 'NULL');
        console.log(`[TradeDistribution] Input Accounts Count: ${accounts ? accounts.length : 0}`);
        if (accounts && accounts.length > 0) {
            console.log(`[TradeDistribution] Input Accounts Dump:`, accounts.map(a => `${a.login} (ID: ${a.id}, isTest: ${a.isTest}, type: ${a.accountType})`));
        }
        console.log(`======================================================\n`);

        // 1. Group Accounts by Broker (FILTERED by Mode)
        const accountsByBroker: Record<string, TradingAccount[]> = {};

        accounts.forEach(acc => {
            // STRICT CHECK: Only allow TRADING accounts. Explicitly block DATAFEED.
            const typeUpper = (acc.accountType || '').toUpperCase();
            if (typeUpper !== 'TRADING' || acc.isDatafeed) {
                // console.log(`[TradeDistribution] Excluding Datafeed: ${acc.login}`);
                return;
            }

            // MODE CHECK:
            if (isTestMode) {
                // In Test Mode, ONLY accept Test Accounts
                if (!acc.isTest) {
                    console.log(`[TradeDistribution] 🛑 DISCARDING ${acc.login} (ID: ${acc.id}) -> isTestMode=true but acc.isTest=${acc.isTest}`);
                    return;
                }
            } else {
                // In Live Mode, ONLY accept Live Accounts (isTest false/undefined)
                if (acc.isTest) {
                    console.log(`[TradeDistribution] 🛑 DISCARDING ${acc.login} (ID: ${acc.id}) -> isTestMode=false but acc.isTest=${acc.isTest}`);
                    return;
                }
            }

            console.log(`[TradeDistribution] ✅ ACCEPTED into Stage 1 (Mode Filter): ${acc.login} (Broker: ${acc.brokerId})`);

            if (!accountsByBroker[acc.brokerId]) accountsByBroker[acc.brokerId] = [];
            accountsByBroker[acc.brokerId].push(acc);
        });

        // 2. Iterate Brokers
        Object.keys(accountsByBroker).forEach(brokerId => {
            const brokerAccounts = accountsByBroker[brokerId];
            const brokerNode = brokers.find(b => b.id === brokerId);

            if (!brokerNode) {
                console.warn(`[TradeDistribution] ⚠️ Unknown broker ID: ${brokerId} for accounts:`, brokerAccounts.map(a => a.login));
                return;
            }
            
            console.log(`\n[TradeDistribution] --- Processing Broker: ${brokerNode.name} (${brokerId}) ---`);
            console.log(`[TradeDistribution] Accounts surviving Stage 1 for this broker:`, brokerAccounts.map(a => `${a.login} (ID: ${a.id})`));

            // --- Symbol Mapping ---
            // Clone the trade to avoid mutating the original
            const mappedTrade = { ...baseTrade };

            // STRICT MAPPING ENFORCEMENT
            let mappedSym;
            if (brokerNode.symbolMappings) {
                // Perform case-insensitive search
                const targetKey = baseTrade.symbol.toUpperCase().trim();
                const matchedKey = Object.keys(brokerNode.symbolMappings).find(k => k.toUpperCase().trim() === targetKey);
                
                if (matchedKey) {
                    mappedSym = brokerNode.symbolMappings[matchedKey];
                }
            }

            if (mappedSym) {
                if (mappedSym === '__IGNORE__') {
                    console.log(`[TradeDistribution] 🛑 Broker ${brokerNode.name}: Symbol ${baseTrade.symbol} explicitly ignored (__IGNORE__). EXCLUDING BROKER.`);
                    return; // Skip this broker
                }

                mappedTrade.symbol = mappedSym;
                console.log(`[TradeDistribution] Mapped ${baseTrade.symbol} -> ${mappedTrade.symbol} for ${brokerNode.name}`);
            } else {
                console.log(`[TradeDistribution] ❌ Broker ${brokerNode.name} has no mapping for ${baseTrade.symbol}. STRICT EXCLUDE.`);
                return; // Skip this broker entirely
            }

            // --- Distribution Matrix Logic ---
            let targetAccountIds: string[] = [];

            // Select Correct Config Section based on Mode
            const brokerConfigMap = isTestMode ? config?.test_brokers : config?.brokers;
            const prefix = isTestMode ? 'TEST_' : '';

            console.log(`[TradeDistribution] Broker ${brokerNode.name}: Look up config in '${isTestMode ? 'test_brokers' : 'brokers'}' matrix`);

            // Fuzzy Lookup: Try ID -> Name -> Shorthand
            let brokerConfig = brokerConfigMap?.[brokerId];
            if (!brokerConfig && brokerConfigMap && brokerNode) {
                // Determine potential keys provided in config
                brokerConfig = brokerConfigMap[brokerNode.name] || brokerConfigMap[brokerNode.shorthand];

                if (brokerConfig) {
                    console.log(`[TradeDistribution] Found config using name/shorthand fallback for '${brokerNode.name}'`);
                } else {
                    console.log(`[TradeDistribution] DEBUG: Broker Lookup Failed. ID: '${brokerId}', Name: '${brokerNode.name}'`);
                }
            }

            if (brokerConfig) {
                // 1. Load Counter (Separate Counter for Test Mode?)
                // YES, use separate counter keys to avoid messing up live rotation
                const counterKey = `distribution_counter_${prefix}${brokerId}`;
                let currentStep = parseInt(localStorage.getItem(counterKey) || '1');

                // Safety check loop size
                const loopSize = brokerConfig.loop_size || 1;
                if (currentStep > loopSize) currentStep = 1;

                console.log(`[TradeDistribution] Broker ${brokerNode.name} (${isTestMode ? 'TEST' : 'LIVE'}) - Step ${currentStep} of ${loopSize}`);

                // 2. Get Accounts for current step directly from Matrix
                const stepAccounts = brokerConfig.matrix[String(currentStep)];

                if (stepAccounts && stepAccounts.length > 0) {
                    targetAccountIds = stepAccounts;
                    console.log(`[TradeDistribution] Broker ${brokerNode.name}: Config mapped Step ${currentStep} to Account IDs:`, targetAccountIds);
                } else {
                    console.warn(`[TradeDistribution] ⚠️ No accounts configured for Step ${currentStep} in ${brokerNode.name} Matrix.`);
                }

                // 3. Increment Counter for NEXT time (ONLY if not preview)
                if (!previewOnly) {
                    let nextStep = currentStep + 1;
                    if (nextStep > loopSize) nextStep = 1;
                    localStorage.setItem(counterKey, String(nextStep));
                    console.log(`[TradeDistribution] Incremented counter for ${brokerNode.name} to ${nextStep}`);
                } else {
                    console.log(`[TradeDistribution] Preview Mode: Counter remains at ${currentStep} for ${brokerNode.name}`);
                }

            } else {
                // FALLBACK LOGIC
                if (isTestMode) {
                    // Test Mode: Default to ALL available accounts if no config exists
                    // This ensures "Test Environment" switch works out-of-the-box for mapped accounts
                    console.log(`[TradeDistribution] No explicit Test Config for ${brokerNode.name}. Defaulting to ALL available test accounts.`);
                    targetAccountIds = brokerAccounts.map(a => a.id);
                } else {
                    // Live Mode: STRICT. If no config exists, we do NOT distribute.
                    console.warn(`[TradeDistribution] No configuration found for broker ${brokerNode.name} (Live Mode). STRICT: Skipping.`);
                    targetAccountIds = [];
                }
            }

            // Filter out Accounts that might be in config but not in the passed accounts list
            console.log(`[TradeDistribution] Broker ${brokerNode.name}: Filtering surviving accounts against target IDs rules...`);
            const validAccounts = brokerAccounts.filter(a => {
                const isValid = targetAccountIds.includes(a.id);
                if (!isValid) console.log(`[TradeDistribution] 🛑 Filtered out ${a.login} (ID: ${a.id}) - Not in target IDs list:`, targetAccountIds);
                return isValid;
            });

            if (validAccounts.length > 0) {
                console.log(`[TradeDistribution] ✅ SUCCESS: Broker ${brokerNode.name} final execution accounts:`, validAccounts.map(a => a.login));
                batches.push({
                    brokerId: brokerId,
                    trade: mappedTrade,
                    accounts: validAccounts // Send full objects for backend routing
                });
            } else {
                console.log(`[TradeDistribution] ❌ FAIL: Broker ${brokerNode.name} has no valid accounts left after final matrix filtering.`);
            }
        });

        console.log(`[TradeDistribution] 🏁 FINAL RESULT: Returning ${batches.length} execution batches.\n`);
        return batches;
    }
}
