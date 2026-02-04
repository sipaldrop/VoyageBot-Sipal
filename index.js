/**
 * ═══════════════════════════════════════════════════════════
 * SIPAL VOYAGE BOT V1.0
 * OnVoyage Daily Check-in Automation
 * 
 * Author: Sipal Airdrop
 * License: MIT
 * ═══════════════════════════════════════════════════════════
 */

const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// ═══════════════════════════════════════════════════════════
// CONFIGURATION (NO CONFIG.JSON - ALL CONSTANTS HERE)
// ═══════════════════════════════════════════════════════════
const BASE_URL = 'https://onvoyage-backend-954067898723.us-central1.run.app/api/v1';
const APP_ORIGIN = 'https://app.onvoyage.ai';

const ENDPOINTS = {
    CHECKIN: '/task/checkin',
    CHECKIN_STATUS: '/task/checkin/status',
    POINTS_BALANCE: '/points/balance',
    WALLET_BALANCE: '/wallet/balance',
    USER_PROFILE: '/user/profile',
    INVITE_STATS: '/task/invite/stats'
};

const SCHEDULE = {
    CHECK_INTERVAL_MINUTES: 60,
    DAILY_RESET_HOUR_UTC: 0,
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 60000
};

const STEALTH = {
    MIN_DELAY_MS: 2000,
    MAX_DELAY_MS: 5000,
    DUMMY_TRAFFIC_ENABLED: true
};

const LOG_LIMIT = 15;

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE FOR DASHBOARD UI
// ═══════════════════════════════════════════════════════════
const state = {
    accounts: [], // { index, status, nextRun, lastRun, info, ip, points, streak }
    logs: [],
    isRunning: true
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════
function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function logToState(msg) {
    const timestamp = new Date().toLocaleTimeString();
    state.logs.push(`${chalk.gray(`[${timestamp}]`)} ${msg}`);
    if (state.logs.length > LOG_LIMIT) {
        state.logs.shift();
    }
    renderTable();
}

// ═══════════════════════════════════════════════════════════
// LOGGER (SIPAL STANDARD)
// ═══════════════════════════════════════════════════════════
const logger = {
    info: (msg, context = '') => {
        const ctx = context ? `[${context}]` : '';
        logToState(`ℹ️  ${chalk.cyan(ctx.padEnd(12))} ${msg}`);
    },
    success: (msg, context = '') => {
        const ctx = context ? `[${context}]` : '';
        logToState(`✅ ${chalk.cyan(ctx.padEnd(12))} ${chalk.green(msg)}`);
    },
    warn: (msg, context = '') => {
        const ctx = context ? `[${context}]` : '';
        logToState(`⚠️  ${chalk.cyan(ctx.padEnd(12))} ${chalk.yellow(msg)}`);
    },
    error: (msg, context = '') => {
        const ctx = context ? `[${context}]` : '';
        logToState(`❌ ${chalk.cyan(ctx.padEnd(12))} ${chalk.red(msg)}`);
    },
    task: (msg, context = '') => {
        const ctx = context ? `[${context}]` : '';
        logToState(`🎯 ${chalk.cyan(ctx.padEnd(12))} ${chalk.magenta(msg)}`);
    }
};

// ═══════════════════════════════════════════════════════════
// UI RENDERER (DASHBOARD STYLE - PINNED HEADER)
// ═══════════════════════════════════════════════════════════
function renderTable() {
    console.clear();

    // Banner
    console.log(chalk.blue(`
               / \\
              /   \\
             |  |  |
             |  |  |
              \\  \\
             |  |  |
             |  |  |
              \\   /
               \\ /
    `));
    console.log(chalk.bold.cyan('    ======SIPAL AIRDROP======'));
    console.log(chalk.bold.cyan('  =====SIPAL VOYAGE V1.0====='));
    console.log('');

    // Summary Table
    const table = new Table({
        head: ['Account', 'Status', 'Points', 'Streak', 'Last Run', 'Next Run', 'Activity'],
        colWidths: [12, 12, 10, 8, 12, 12, 30],
        style: { head: ['cyan'], border: ['grey'] }
    });

    state.accounts.forEach(acc => {
        let statusText = acc.status;
        if (acc.status === 'SUCCESS') statusText = chalk.green(acc.status);
        else if (acc.status === 'FAILED') statusText = chalk.red(acc.status);
        else if (acc.status === 'PROCESSING') statusText = chalk.yellow(acc.status);
        else if (acc.status === 'WAITING') statusText = chalk.blue(acc.status);
        else if (acc.status === 'EXPIRED') statusText = chalk.redBright(acc.status);

        let nextRunStr = '-';
        if (acc.nextRun) {
            const diff = acc.nextRun - Date.now();
            if (diff > 0) nextRunStr = formatDuration(diff);
            else nextRunStr = chalk.green('Ready');
        }
        if (acc.status === 'EXPIRED') nextRunStr = chalk.red('TOKEN EXP');

        let lastRunStr = '-';
        if (acc.lastRun) {
            lastRunStr = new Date(acc.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        table.push([
            `Account ${acc.index}`,
            statusText,
            chalk.green(acc.points || 0),
            chalk.magenta(acc.streak || 0),
            lastRunStr,
            nextRunStr,
            chalk.gray((acc.info || '-').substring(0, 28))
        ]);
    });

    console.log(table.toString());

    // Logs Area
    console.log(chalk.yellow('\n📜 EXECUTION LOGS:'));
    state.logs.forEach(log => console.log(log));
    console.log(chalk.gray('─'.repeat(96)));
    console.log(chalk.gray(`Press Ctrl+C to stop | Last update: ${new Date().toLocaleTimeString()}`));
}

// ═══════════════════════════════════════════════════════════
// RANDOM USER AGENTS
// ═══════════════════════════════════════════════════════════
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/121.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomChromeVersion() {
    const versions = ['120', '121', '122', '123', '144'];
    return versions[Math.floor(Math.random() * versions.length)];
}

// ═══════════════════════════════════════════════════════════
// STEALTH HEADERS
// ═══════════════════════════════════════════════════════════
function getStealthHeaders(token) {
    const chromeVersion = getRandomChromeVersion();
    return {
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'authorization': `Bearer ${token}`,
        'origin': APP_ORIGIN,
        'referer': `${APP_ORIGIN}/`,
        'sec-ch-ua': `"Not(A:Brand";v="8", "Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}"`,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': getRandomUserAgent()
    };
}

// ═══════════════════════════════════════════════════════════
// PROXY SUPPORT
// ═══════════════════════════════════════════════════════════
function createProxyAgent(proxyUrl) {
    if (!proxyUrl) return null;
    try {
        if (proxyUrl.startsWith('socks')) {
            return new SocksProxyAgent(proxyUrl);
        }
        return new HttpsProxyAgent(proxyUrl);
    } catch (error) {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════
// DELAYS & BACKOFF
// ═══════════════════════════════════════════════════════════
function randomDelay(minMs = STEALTH.MIN_DELAY_MS, maxMs = STEALTH.MAX_DELAY_MS) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
}

function getBackoffDelay(retryCount) {
    return Math.min(
        SCHEDULE.BASE_DELAY_MS * Math.pow(2, retryCount) + Math.random() * 1000,
        SCHEDULE.MAX_DELAY_MS
    );
}

// ═══════════════════════════════════════════════════════════
// API CLIENT CLASS
// ═══════════════════════════════════════════════════════════
class VoyageAPI {
    constructor(token, proxy) {
        this.token = token;
        this.proxyAgent = createProxyAgent(proxy);
    }

    async request(method, endpoint, data = null) {
        const axiosConfig = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: getStealthHeaders(this.token),
            timeout: 30000
        };

        if (this.proxyAgent) {
            axiosConfig.httpsAgent = this.proxyAgent;
        }

        if (data) {
            axiosConfig.data = data;
        }

        try {
            const response = await axios(axiosConfig);
            return response.data;
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401 || status === 403) {
                    throw new Error('TOKEN_EXPIRED');
                }
                if (status === 429) {
                    throw new Error('RATE_LIMITED');
                }
                throw new Error(`HTTP ${status}: ${error.response.data?.message || 'Unknown'}`);
            }
            throw error;
        }
    }

    async withRetry(method, endpoint, data = null) {
        for (let i = 0; i <= SCHEDULE.MAX_RETRIES; i++) {
            try {
                return await this.request(method, endpoint, data);
            } catch (error) {
                if (error.message === 'TOKEN_EXPIRED') throw error;
                if (i < SCHEDULE.MAX_RETRIES) {
                    const delay = getBackoffDelay(i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    async getUserProfile() {
        return this.withRetry('GET', ENDPOINTS.USER_PROFILE);
    }

    async getPointsBalance() {
        return this.withRetry('GET', ENDPOINTS.POINTS_BALANCE);
    }

    async getCheckinStatus() {
        return this.withRetry('GET', ENDPOINTS.CHECKIN_STATUS);
    }

    async doCheckin() {
        return this.withRetry('POST', ENDPOINTS.CHECKIN);
    }

    async visitDummyEndpoints() {
        if (!STEALTH.DUMMY_TRAFFIC_ENABLED) return;
        const endpoints = [ENDPOINTS.USER_PROFILE, ENDPOINTS.POINTS_BALANCE, ENDPOINTS.INVITE_STATS];
        const shuffled = endpoints.sort(() => Math.random() - 0.5);
        const visitCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < visitCount; i++) {
            try {
                await this.request('GET', shuffled[i]);
                await randomDelay(500, 1500);
            } catch (e) { }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// ACCOUNT PROCESSOR
// ═══════════════════════════════════════════════════════════
async function processAccount(accountData, index) {
    const accName = `Account ${index}`;
    const stateAcc = state.accounts[index - 1];

    stateAcc.status = 'PROCESSING';
    stateAcc.info = 'Starting cycle...';
    renderTable();

    const api = new VoyageAPI(accountData.Token_Bearer, accountData.Proxy);

    try {
        // Check token expiry
        const tokenExpiry = parseTokenExpiry(accountData.Token_Bearer);
        if (tokenExpiry && new Date() > tokenExpiry) {
            stateAcc.status = 'EXPIRED';
            stateAcc.info = 'Token has expired!';
            logger.error('Token has expired! Please update.', accName);
            scheduleNextRun(stateAcc, 60);
            return;
        }

        // Dummy traffic
        logger.info('Visiting dummy endpoints...', accName);
        await api.visitDummyEndpoints();
        await randomDelay();

        // Get user profile
        const profileRes = await api.getUserProfile();
        if (profileRes.code === 0) {
            const username = profileRes.data.display_name || profileRes.data.username;
            stateAcc.info = `User: ${username}`;
            logger.success(`Logged in as: ${username}`, accName);
        }
        await randomDelay(1000, 2000);

        // Get points
        const pointsRes = await api.getPointsBalance();
        if (pointsRes.code === 0) {
            stateAcc.points = pointsRes.data.balance;
        }
        await randomDelay(1000, 2000);

        // Check checkin status
        const statusRes = await api.getCheckinStatus();
        const alreadyCheckedIn = statusRes.code === 0 && statusRes.data.checked_in;
        await randomDelay(1000, 2000);

        // Perform checkin if not done
        if (!alreadyCheckedIn) {
            logger.task('Performing daily check-in...', accName);
            stateAcc.info = 'Claiming daily...';
            renderTable();
            await randomDelay(2000, 4000);

            const checkinRes = await api.doCheckin();
            if (checkinRes.code === 0) {
                stateAcc.streak = checkinRes.data.streak_days;
                logger.success(`Check-in OK! +${checkinRes.data.reward} pts | Streak: ${checkinRes.data.streak_days}`, accName);
                stateAcc.info = `Claimed +${checkinRes.data.reward} pts`;

                // Update points
                await randomDelay(1000, 2000);
                const newPoints = await api.getPointsBalance();
                if (newPoints.code === 0) {
                    stateAcc.points = newPoints.data.balance;
                }
            } else {
                logger.warn(`Check-in response: ${checkinRes.message}`, accName);
                stateAcc.info = checkinRes.message;
            }
        } else {
            logger.info('Already checked in today', accName);
            stateAcc.info = 'Already claimed today';
        }

        stateAcc.status = 'SUCCESS';
        stateAcc.lastRun = Date.now();
        scheduleUntilReset(stateAcc);

    } catch (error) {
        stateAcc.status = 'FAILED';
        if (error.message === 'TOKEN_EXPIRED') {
            stateAcc.status = 'EXPIRED';
            stateAcc.info = 'Token expired!';
            logger.error('Token expired! Please update.', accName);
        } else {
            stateAcc.info = error.message.substring(0, 28);
            logger.error(`Error: ${error.message}`, accName);
        }
        scheduleNextRun(stateAcc, 30);
    }

    renderTable();
}

// ═══════════════════════════════════════════════════════════
// SCHEDULING HELPERS
// ═══════════════════════════════════════════════════════════
function parseTokenExpiry(token) {
    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (payload.exp) return new Date(payload.exp * 1000);
        }
    } catch (e) { }
    return null;
}

function scheduleNextRun(stateAcc, minutes) {
    stateAcc.nextRun = Date.now() + minutes * 60 * 1000;
}

function scheduleUntilReset(stateAcc) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(SCHEDULE.DAILY_RESET_HOUR_UTC, 0, 0, 0);
    const randomOffset = Math.floor(Math.random() * 30 * 60 * 1000);
    stateAcc.nextRun = tomorrow.getTime() + randomOffset;
}

// ═══════════════════════════════════════════════════════════
// LOAD ACCOUNTS FROM accounts.json
// ═══════════════════════════════════════════════════════════
function loadAccounts() {
    const accountsFile = path.join(__dirname, 'accounts.json');

    if (!fs.existsSync(accountsFile)) {
        console.log(chalk.red('❌ accounts.json not found!'));
        console.log(chalk.yellow('📝 Copy accounts_tmp.json to accounts.json and add your tokens.'));
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(accountsFile, 'utf8').trim();
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
            console.log(chalk.red('❌ accounts.json must be an array!'));
            process.exit(1);
        }

        // Validate format
        parsed.forEach((acc, i) => {
            if (!acc.Token_Bearer) {
                console.log(chalk.red(`❌ Account ${i + 1} missing Token_Bearer!`));
                process.exit(1);
            }
        });

        return parsed;
    } catch (e) {
        console.log(chalk.red(`❌ Failed to parse accounts.json: ${e.message}`));
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════
// MAIN BOT
// ═══════════════════════════════════════════════════════════
async function main() {
    // Load accounts
    const accounts = loadAccounts();

    // Initialize state for each account
    accounts.forEach((acc, i) => {
        state.accounts.push({
            index: i + 1,
            status: 'WAITING',
            nextRun: Date.now(),
            lastRun: null,
            info: 'Ready',
            points: 0,
            streak: 0
        });
    });

    // Initial render
    renderTable();
    logger.info(`Loaded ${accounts.length} account(s)`, 'SYSTEM');

    // Initial run for all accounts (staggered)
    logger.info('Starting initial cycle...', 'SYSTEM');
    const shuffledIndices = [...Array(accounts.length).keys()].sort(() => Math.random() - 0.5);

    for (const i of shuffledIndices) {
        await processAccount(accounts[i], i + 1);
        if (i < accounts.length - 1) {
            await randomDelay(3000, 6000);
        }
    }

    // Main loop
    logger.info('Entering scheduler loop...', 'SYSTEM');

    while (state.isRunning) {
        for (let i = 0; i < accounts.length; i++) {
            const stateAcc = state.accounts[i];
            if (stateAcc.status !== 'EXPIRED' && stateAcc.nextRun && Date.now() >= stateAcc.nextRun) {
                await processAccount(accounts[i], i + 1);
            }
        }

        // Update table every minute
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
        renderTable();
    }
}

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`, 'SYSTEM');
});

process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`, 'SYSTEM');
});

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Bot stopped by user. Goodbye!'));
    state.isRunning = false;
    process.exit(0);
});

// ═══════════════════════════════════════════════════════════
// START BOT
// ═══════════════════════════════════════════════════════════
main().catch(error => {
    console.log(chalk.red(`💀 Fatal error: ${error.message}`));
    process.exit(1);
});
