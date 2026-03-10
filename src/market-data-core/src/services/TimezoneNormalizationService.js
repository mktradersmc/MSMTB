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

    /**
     * Converts a Broker Time (Seconds timestamp) to True UTC Seconds.
     */
    convertBrokerToUtc(botId, brokerSeconds) {
        let validSeconds = Number(brokerSeconds);
        if (validSeconds > 10000000000) validSeconds = Math.floor(validSeconds / 1000);

        if (botId && botId.startsWith('NT8')) return validSeconds;

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

        if (botId && botId.startsWith('NT8')) return validSeconds;

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
