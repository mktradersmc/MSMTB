const db = require('./DatabaseService');

class TimezoneNormalizationService {
    constructor() {
        this.cache = new Map(); // botId -> Array of { anchor_time, offset_sec }
    }

    _getOffsets(botId) {
        if (!this.cache.has(botId)) {
            const offsets = db.getHistoricalOffsets(botId) || [];
            this.cache.set(botId, offsets);
        }
        return this.cache.get(botId);
    }

    /**
     * Finds the closest preceding offset for a given broker time.
     */
    _getOffsetForBrokerTime(botId, brokerSeconds) {
        const offsets = this._getOffsets(botId);
        if (!offsets || offsets.length === 0) throw new Error("CRITICAL: No timezone anchors loaded!");
        for (let i = offsets.length - 1; i >= 0; i--) {
            if (brokerSeconds >= offsets[i].anchor_time) {
                return offsets[i].offset_sec;
            }
        }
        return offsets[0].offset_sec; // Failsafe for times before year 2000
    }

    _getOffsetForUtcTime(botId, utcSeconds) {
        const offsets = this._getOffsets(botId);
        if (!offsets || offsets.length === 0) throw new Error("CRITICAL: No timezone anchors loaded!");
        for (let i = offsets.length - 1; i >= 0; i--) {
            const utcOfAnchor = offsets[i].anchor_time - offsets[i].offset_sec;
            if (utcSeconds >= utcOfAnchor) {
                return offsets[i].offset_sec;
            }
        }
        return offsets[0].offset_sec;
    }

    _isNativeUtc(botId) {
        if (!botId) return false;

        try {
            const cleanBotId = botId.replace('_DATAFEED', '').replace('_TRADING', '');

            // 1. Resolve Account by BotId or cleaned Name (actually bot_id fallback, since 'name' column doesn't exist in accounts)
            const acc = db.marketDb.prepare("SELECT platform, broker_id FROM accounts WHERE bot_id = ? OR bot_id = ?").get(botId, cleanBotId);

            if (acc) {
                if (acc.platform === 'NT8') return true;

                // 2. Resolve matching Broker for that Account
                if (acc.broker_id) {
                    const brokerFromAcc = db.marketDb.prepare("SELECT type, timezone FROM brokers WHERE id = ?").get(acc.broker_id);
                    if (brokerFromAcc && (brokerFromAcc.type === 'NT8' || brokerFromAcc.timezone === 'UTC')) return true;
                }
            } else {
                // Fallback: Check if botId is directly a Broker ID or Name (some legacy configurations)
                const broker = db.marketDb.prepare("SELECT type, timezone FROM brokers WHERE id = ? OR name = ?").get(botId, cleanBotId);
                if (broker && (broker.type === 'NT8' || broker.timezone === 'UTC')) return true;
            }

        } catch (e) {
            console.error(`[Timezone] Error resolving natively true UTC status for _isNativeUtc(botId: ${botId}):`, e.message);
        }
        return false;
    }

    /**
     * Converts a Broker Time (Seconds timestamp) to True UTC Seconds.
     */
    convertBrokerToUtc(botId, brokerSeconds) {
        let validSeconds = Number(brokerSeconds);
        if (validSeconds > 10000000000) validSeconds = Math.floor(validSeconds / 1000);

        if (this._isNativeUtc(botId)) return validSeconds;

        const offsetSec = this._getOffsetForBrokerTime(botId, validSeconds);
        return validSeconds - offsetSec;
    }

    convertBrokerToUtcMs(botId, brokerSeconds) {
        return Math.floor(this.convertBrokerToUtc(botId, brokerSeconds) * 1000);
    }

    /**
     * Converts a True UTC Timestamp (Seconds) to Broker Time (Seconds).
     */
    convertUtcToBroker(botId, utcSeconds) {
        let validSeconds = Number(utcSeconds);
        if (validSeconds > 10000000000) validSeconds = Math.floor(validSeconds / 1000);

        if (this._isNativeUtc(botId)) return validSeconds;

        const offsetSec = this._getOffsetForUtcTime(botId, validSeconds);
        return validSeconds + offsetSec;
    }

    /**
     * Registers a new dynamic offset (e.g. from Gap detection or Monday anchor).
     */
    registerDynamicOffset(botId, anchorTimeSec, offsetSec) {
        const offsets = this._getOffsets(botId);
        const existing = offsets.find(o => o.anchor_time === anchorTimeSec);
        if (existing && existing.offset_sec === offsetSec) return;

        db.saveTimezoneOffset(botId, anchorTimeSec, offsetSec);

        if (existing) {
            existing.offset_sec = offsetSec;
        } else {
            offsets.push({ anchor_time: anchorTimeSec, offset_sec: offsetSec });
            offsets.sort((a, b) => a.anchor_time - b.anchor_time);
        }

        console.log(`[TimezoneAnchor] ⚓ New Anchor for ${botId}: BrokerTime=${anchorTimeSec}, Offset=${offsetSec / 3600}h`);
    }
}

module.exports = new TimezoneNormalizationService();
