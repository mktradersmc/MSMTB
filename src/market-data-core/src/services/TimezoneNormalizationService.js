const { DateTime } = require("luxon");

class TimezoneNormalizationService {
    constructor() {
        this.botTimezones = new Map(); // BotID -> IANA Zone
        this.defaultZone = "Europe/Athens"; // Default if unknown (EET)
    }

    /**
     * Registers a detected signature and maps it to an IANA zone.
     * @param {string} botId 
     * @param {string} signature - "EET", "EST", "UTC"
     */
    registerBotTimezone(botId, signature) {
        let ianaZone = this.defaultZone;

        const sig = (signature || "").toUpperCase();
        if (sig === "EET") ianaZone = "Europe/Athens";
        else if (sig === "EST") ianaZone = "America/New_York";
        else if (sig === "UTC") ianaZone = "Etc/UTC";
        else if (signature && signature.length > 0) {
            // Allow passing IANA zone directly if robust
            if (signature.includes("/")) ianaZone = signature;
            else console.warn(`[Timezone] Unknown signature '${signature}' for ${botId}. Defaulting to ${ianaZone}.`);
        }

        this.botTimezones.set(botId, ianaZone);
        console.log(`[Timezone] Registered ${botId} -> Signature: ${signature} => Zone: ${ianaZone}`);
    }

    getBotZone(botId) {
        return this.botTimezones.get(botId) || this.defaultZone;
    }

    /**
     * Converts a Broker Time (Seconds timestamp) to True UTC Seconds.
     * @param {string} botId 
     * @param {number} brokerSeconds - Seconds from MQL5 (relative to 1970 Local Server Time)
     * @returns {number} UTC Seconds
     */
    convertBrokerToUtc(botId, brokerSeconds) {
        // MQL5 "Time" is seconds since 1970-01-01 00:00 SERVER TIME.
        // We treat it as UTC Face Value to get the components (yyyy-MM-dd HH:mm:ss)
        // Then re-parse those components in the Broker's Timezone.

        let validSeconds = Number(brokerSeconds);
        // Safety: If passed MS, revert to Seconds
        if (validSeconds > 10000000000) validSeconds = Math.floor(validSeconds / 1000);

        // 1. Get Face Value (Time components) by treating numeric timestamp as UTC
        const faceValue = DateTime.fromSeconds(validSeconds, { zone: 'UTC' });

        // 2. Format to string to lock in "2024-01-01 10:00:00"
        const timeString = faceValue.toFormat("yyyy-MM-dd HH:mm:ss");

        // 3. Re-parse using the actual Broker Zone.
        const zone = this.getBotZone(botId);
        const actualTime = DateTime.fromFormat(timeString, "yyyy-MM-dd HH:mm:ss", { zone: zone });

        // 4. Return True UTC Seconds
        return actualTime.toUTC().toSeconds();
    }

    convertBrokerToUtcMs(botId, brokerSeconds) {
        // Return MS
        return Math.floor(this.convertBrokerToUtc(botId, brokerSeconds) * 1000);
    }

    /**
     * Converts a True UTC Timestamp (Seconds) to Broker Time (Seconds).
     * @param {string} botId 
     * @param {number} utcSeconds 
     * @returns {number} Broker Seconds (Relative to 1970-01-01 Server Time)
     */
    convertUtcToBroker(botId, utcSeconds) {
        // 1. Parse UTC Seconds
        const utcTime = DateTime.fromSeconds(Number(utcSeconds), { zone: 'UTC' });

        // 2. Convert to the Broker's Zone to get local time components
        const zone = this.getBotZone(botId);
        const brokerTime = utcTime.setZone(zone);

        // 3. Get "Face Value" string
        const faceString = brokerTime.toFormat("yyyy-MM-dd HH:mm:ss");

        // 4. Treat as UTC to generate MQL5-compatible timestamp
        const serverFaceValue = DateTime.fromFormat(faceString, "yyyy-MM-dd HH:mm:ss", { zone: 'UTC' });

        const result = serverFaceValue.toSeconds();
        console.log(`[Timezone] convertUtcToBroker(${botId}): UTC=${utcSeconds} (${utcTime.toFormat("HH:mm:ss")}) -> Zone=${zone} -> Broker=${faceString} -> MQL5=${result}`);

        return result;
    }
}

module.exports = new TimezoneNormalizationService();
