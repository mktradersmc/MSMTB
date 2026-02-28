
import fs from 'fs/promises';
import path from 'path';
import { Broker, TradingAccount } from './types';

import { updateHubConfig, restartHub } from './hub-control';

export async function getSystemConfig() {
    try {
        const response = await fetch('http://127.0.0.1:3005/api/system/config');
        if (response.ok) {
            const data = await response.json();
            if (data && data.config) {
                return data.config;
            }
        }
    } catch(e) { console.error('Failed to get system config', e); }
    return { projectRoot: 'C:\\awesome-cockpit', systemUsername: 'admin' };
}

export const getInstancesRoot = async () => {
    const config = await getSystemConfig();
    return path.join(config.projectRoot, 'metatrader', 'instances');
};

export async function deployInstance(broker: Broker, account: TradingAccount, botId: string): Promise<string> {
    const sysConfig = await getSystemConfig();
    const MASTER_PATH = path.join(sysConfig.projectRoot, 'metatrader', 'master');
    const INSTANCES_ROOT = path.join(sysConfig.projectRoot, 'metatrader', 'instances');
    let instanceName = `MT_${broker.shorthand.replace(/\s+/g, '')}_${account.login}`;
    if (account.accountType === 'DATAFEED') {
        instanceName += '_DATAFEED';
    }
    const instancePath = path.join(INSTANCES_ROOT, instanceName);

    // 1. Clone Master
    await cloneDirectory(MASTER_PATH, instancePath);

    // 2. Isolate Bot Files (Common -> MQL5/Files)
    await isolateBotFiles(instancePath);

    // 3. Determine Startup Symbol
    // Use Broker's default symbol (Internal Name), map it to Broker Name if possible
    let startSymbol = broker.defaultSymbol || "EURUSD";
    if (broker.symbolMappings && broker.symbolMappings[startSymbol]) {
        startSymbol = broker.symbolMappings[startSymbol];
    }

    // 4. Write Startup Config (startup.ini)
    const expertName = account.accountType === 'DATAFEED' ? "DatafeedExpert" : "TradingExpert";
    await writeStartupConfig(instancePath, account.login, account.password, account.server, startSymbol, expertName);

    // 5. Write Bot Properties (bot_properties.txt)
    await writeBotProperties(instancePath, botId, account.accountType === 'DATAFEED');

    // 6. Write Symbol Mappings to environment.txt
    await writeEnvironmentMappings(instancePath, broker.symbolMappings);

    // 7. Deploy TickSpy (Ensure it exists in Indicators) for Datafeed
    if (account.accountType === 'DATAFEED') {
        await deployTickSpy(instancePath);
        await deployHistoryWorker(instancePath);
    }

    // 8. Deploy TradeInfo (Proxy Standard) - For EVERYONE (Datafeed might not need it but safe to have)
    // Actually Datafeed uses DatafeedExpert which doesn't use Proxy yet?
    // User requested "TradeInfo ... redeployment triggers ... copied to Trading Instances".
    // "Trading Instanzen" = Trading Accounts.
    if (account.accountType !== 'DATAFEED') {
        await deployTradeInfo(instancePath);
    }

    // 9. If Master or Datafeed, update Hub (Legacy/Fallback support for isMaster flag if used elsewhere)
    if (account.accountType === 'DATAFEED') {
        await updateHubConfig(instancePath);
        await restartHub();
    }

    return instancePath;
}



async function writeEnvironmentMappings(instancePath: string, mappings?: Record<string, string>) {
    if (!mappings || Object.keys(mappings).length === 0) return;

    let content = "\n[SymbolMapping]\n";
    Object.entries(mappings).forEach(([internal, broker]) => {
        content += `${internal}=${broker}\n`;
    });

    const target = path.join(instancePath, 'MQL5', 'Files', 'environment.txt');
    // Append or Create
    try {
        await fs.access(target);
        await fs.appendFile(target, content, 'utf-8');
    } catch {
        await fs.writeFile(target, content, 'utf-8');
    }
}

async function cloneDirectory(src: string, dest: string) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await cloneDirectory(srcPath, destPath);
        } else {
            // Error handling for locked files?
            try {
                await fs.copyFile(srcPath, destPath);
            } catch (e) {
                console.warn(`Skipped copying ${entry.name}:`, e);
            }
        }
    }
}

async function isolateBotFiles(instancePath: string) {
    const mqlTvFilesPath = path.join(instancePath, 'MQL5', 'Files');
    await fs.mkdir(mqlTvFilesPath, { recursive: true });

    const localCommon = path.join(instancePath, 'MQL5', 'Common', 'Files');

    try {
        await fs.access(localCommon);
        const files = await fs.readdir(localCommon);
        for (const file of files) {
            await fs.rename(path.join(localCommon, file), path.join(mqlTvFilesPath, file));
        }
    } catch (e) {
        // Ignore
    }
}

async function writeStartupConfig(instancePath: string, login: string, pass: string, server: string, symbol: string, expertName: string) {
    // 1. Full Startup (First Run): Opens Chart & Template
    const fullContent = `
[Common]
Login=${login}
Password=${pass}
Server=${server}
Enable=1

[StartUp]
Symbol=${symbol}
Period=H1
Template=default.tpl
Expert=${expertName}

[Experts]
AllowDllImport=1
AllowTrade=1
AllowWebRequest=1
    `.trim();

    await fs.writeFile(path.join(instancePath, 'startup.ini'), fullContent, { encoding: 'utf-8', flag: 'w' });

    // 2. Login Only (Restarts): Logs in AND enforces Expert load (User Request for reliability)
    const loginContent = `
[Common]
Login=${login}
Password=${pass}
Server=${server}
Enable=1

[StartUp]
Symbol=${symbol}
Period=H1
Template=default.tpl
Expert=${expertName}

[Experts]
AllowDllImport=1
AllowTrade=1
AllowWebRequest=1
    `.trim();

    await fs.writeFile(path.join(instancePath, 'login.ini'), loginContent, { encoding: 'utf-8', flag: 'w' });
}

async function writeBotProperties(instancePath: string, botId: string, isMaster?: boolean) {
    // Determine Exchange Path (MQL5/Files in the instance)
    const exchangePath = path.join(instancePath, 'MQL5', 'Files');

    let content = `botId=${botId}\n`;
    content += `apiKey=secret123\n`;

    if (isMaster) {
        content += `communicationMode=PIPE\n`;
        content += `IS_MASTER=true\n`;
    } else {
        content += `communicationMode=PIPE\n`;
    }

    content += `communicationMode=PIPE\n`;
    content += `pollInterval=1\n`;

    const target = path.join(instancePath, 'MQL5', 'Files', 'bot_properties.txt');
    await fs.writeFile(target, content, 'utf-8');
}

async function deployTickSpy(instancePath: string) {
    const sysConfig = await getSystemConfig();
    const MASTER_PATH = path.join(sysConfig.projectRoot, 'metatrader', 'master');
    const indicatorsSource = path.join(MASTER_PATH, 'MQL5', 'Indicators');
    const targetDir = path.join(instancePath, 'MQL5', 'Indicators');

    try {
        await fs.mkdir(targetDir, { recursive: true });

        // 1. Deploy TickSpy.ex5 (CRITICAL)
        const ex5Source = path.join(indicatorsSource, 'TickSpy.ex5');
        const ex5Dest = path.join(targetDir, 'TickSpy.ex5');

        try {
            await fs.copyFile(ex5Source, ex5Dest);
            console.log(`[Deployer] Success: Deployed TickSpy.ex5 to ${targetDir}`);
        } catch (e) {
            console.error(`[Deployer] CRITICAL: Failed to copy TickSpy.ex5 from ${ex5Source} to ${ex5Dest}`, e);
            // Verify if exists
            try {
                await fs.access(ex5Source);
            } catch (missing) {
                console.error(`[Deployer] REASON: TickSpy.ex5 does not exist in Master Image!`);
            }
        }

        // 2. Deploy TickSpy.mq5 (Optional - Source)
        const mq5Source = path.join(indicatorsSource, 'TickSpy.mq5');
        const mq5Dest = path.join(targetDir, 'TickSpy.mq5');

        try {
            await fs.copyFile(mq5Source, mq5Dest);
        } catch (e) {
            // Optional, ignore
        }

    } catch (e) {
        console.error("[Deployer] Failed to deploy TickSpy Helper:", e);
    }
}

export async function deployHistoryWorker(instancePath: string) {
    const sysConfig = await getSystemConfig();
    const MASTER_PATH = path.join(sysConfig.projectRoot, 'metatrader', 'master');
    const indicatorsSource = path.join(MASTER_PATH, 'MQL5', 'Indicators');
    const targetDir = path.join(instancePath, 'MQL5', 'Indicators');

    try {
        await fs.mkdir(targetDir, { recursive: true });

        // 1. Deploy HistoryWorker.ex5 (CRITICAL)
        const ex5Source = path.join(indicatorsSource, 'HistoryWorker.ex5');
        const ex5Dest = path.join(targetDir, 'HistoryWorker.ex5');

        try {
            await fs.copyFile(ex5Source, ex5Dest);
            console.log(`[Deployer] Success: Deployed HistoryWorker.ex5 to ${targetDir}`);
        } catch (e) {
            console.warn(`[Deployer] Warning: HistoryWorker.ex5 not found in Master Image.`);
        }

        // 2. Deploy HistoryWorker.mq5 (Optional)
        const mq5Source = path.join(indicatorsSource, 'HistoryWorker.mq5');
        const mq5Dest = path.join(targetDir, 'HistoryWorker.mq5');

        try {
            await fs.copyFile(mq5Source, mq5Dest);
        } catch (e) {
            // Optional, ignore
        }

    } catch (e) {
        console.error("[Deployer] Failed to deploy HistoryWorker Helper:", e);
    }
}

export async function deployTradeInfo(instancePath: string) {
    const sysConfig = await getSystemConfig();
    const MASTER_PATH = path.join(sysConfig.projectRoot, 'metatrader', 'master');
    const indicatorsSource = path.join(MASTER_PATH, 'MQL5', 'Indicators');
    const targetDir = path.join(instancePath, 'MQL5', 'Indicators');

    try {
        await fs.mkdir(targetDir, { recursive: true });

        // 1. Deploy TradeInfo.ex5 (CRITICAL)
        const ex5Source = path.join(indicatorsSource, 'TradeInfo.ex5');
        const ex5Dest = path.join(targetDir, 'TradeInfo.ex5');

        try {
            await fs.copyFile(ex5Source, ex5Dest);
            console.log(`[Deployer] Success: Deployed TradeInfo.ex5 to ${targetDir}`);
        } catch (e) {
            console.warn(`[Deployer] Warning: TradeInfo.ex5 not found in Master Image.`);
        }

    } catch (e) {
        console.error("[Deployer] Failed to deploy TradeInfo Helper:", e);
    }
}
