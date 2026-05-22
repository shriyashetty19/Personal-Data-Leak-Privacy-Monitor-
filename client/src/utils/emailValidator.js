import validator from 'validator';

const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com','tempmail.com','guerrillamail.com','throwam.com',
    'yopmail.com','trashmail.com','10minutemail.com','sharklasers.com',
    'guerrillamailblock.com','grr.la','guerrillamail.info','spam4.me',
    'binkmail.com','bob.email','discard.email','discardmail.com',
    'fakeinbox.com','fakeinbox.net','filzmail.com','getnada.com',
    'getonemail.com','harakirimail.com','mailnull.com','maildrop.cc',
    'mintemail.com','mohmal.com','mytemp.email','pookmail.com',
    'safetymail.info','spamevader.com','spamfree24.org','spamgourmet.com',
    'spamspot.com','tempalias.com','tempe-mail.com','tempinbox.com',
    'tempmail2.com','temporaryemail.net','trash-mail.at',
    'trashmail.at','trashmail.me','trashmail.net','trbvm.com',
    'wegwerfmail.de','whyspam.me','zetmail.com','mailnesia.com',
    'spamgourmet.net','spamhereplease.com','spoofmail.de',
    'fakemail.net','mailscrap.com','spamfree.eu','tempinbox.net',
    'abc.com','test.com','example.com','fake123.com','dispostable.com',
    'proxypost.net','shortmail.com','whocares.jp','spambox.us',
    'temp-mail.org','tempmailaddress.com','instantemail.org',
    'dropmail.me','disposablemail.com','mail-fake.com'
]);

const FAKE_PATTERNS = [
    /^test@/i, /^fake@/i, /^dummy@/i, /^temp@/i,
    /^no@/i, /^noreply@/i, /^user@/i, /^admin@/i,
    /^(aaa|bbb|ccc|xxx|yyy|zzz)@/i,
    /^(123|456|789)@/i, /^asdf@/i, /^qwerty@/i,
    /@(test|fake|dummy|example|sample)\./i
];

/**
 * Validate an email address on the client side.
 * Uses validator.js for RFC-compliant format checking, plus:
 *  - disposable domain blocklist
 *  - fake-pattern detection
 *  - TLD length check
 * @param {string} email
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmail(email) {
    if (!email || !validator.isEmail(email))
        return { valid: false, error: 'Invalid email format' };

    const domain = email.split('@')[1].toLowerCase();

    if (DISPOSABLE_DOMAINS.has(domain))
        return { valid: false, error: 'Disposable email addresses are not accepted' };

    if (FAKE_PATTERNS.some(p => p.test(email)))
        return { valid: false, error: 'Please enter a real email address' };

    if (!domain.includes('.') || domain.split('.').pop().length < 2)
        return { valid: false, error: "This email domain doesn't appear to exist" };

    return { valid: true, error: null };
}

/**
 * Deterministic mock breaches based on email hash (same email → same result).
 * Used as fallback when HIBP API is unavailable.
 */
export function getMockBreaches(email) {
    const seed = email.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const allBreaches = [
        { Name: 'Adobe',    BreachDate: '2013-10-04', DataClasses: ['Email addresses', 'Passwords', 'Usernames'],           PwnCount: 152445165 },
        { Name: 'LinkedIn', BreachDate: '2012-05-05', DataClasses: ['Email addresses', 'Passwords'],                         PwnCount: 164611595 },
        { Name: 'Canva',    BreachDate: '2019-05-24', DataClasses: ['Email addresses', 'Names', 'Usernames'],                PwnCount: 137272116 },
        { Name: 'Dropbox',  BreachDate: '2012-07-01', DataClasses: ['Email addresses', 'Passwords'],                         PwnCount: 68648009  },
        { Name: 'Twitter',  BreachDate: '2022-07-22', DataClasses: ['Email addresses', 'Names'],                             PwnCount: 211524284 },
        { Name: 'Twitch',   BreachDate: '2021-10-06', DataClasses: ['Email addresses', 'Names', 'Usernames'],                PwnCount: 5000000   },
        { Name: 'Uber',     BreachDate: '2016-10-01', DataClasses: ['Email addresses', 'Names', 'Phone numbers'],            PwnCount: 25000000  },
    ];
    const count = (seed % 4) + 1; // 1–4 breaches
    return allBreaches.slice(0, count);
}

/**
 * Compute a security score (0–100) based on breach severity.
 * Password leaks incur -15, credit card leaks -20, others -8.
 */
export function computeSecurityScore(breaches) {
    if (!breaches || breaches.length === 0) return 100;
    const penalty = breaches.reduce((total, b) => {
        const severity = b.DataClasses?.includes('Credit card numbers') ? 20
            : b.DataClasses?.includes('Passwords') ? 15
            : 8;
        return total + severity;
    }, 0);
    return Math.max(0, 100 - penalty);
}

/**
 * Download array of events as a CSV file.
 */
export function downloadCSV(events) {
    const header = 'Event,Location/IP,Timestamp,Status\n';
    const rows = events.map(e =>
        `"${e.event}","${e.ip}","${e.timestamp}","${e.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download array of events as a .txt audit log file.
 */
export function downloadAuditLog(events) {
    const header = `=== PrivacyMonitor Audit Log ===\nGenerated: ${new Date().toISOString()}\n${'='.repeat(50)}\n\n`;
    const content = events.map(e =>
        `[${e.timestamp}] ${e.event} | IP: ${e.ip} | Status: ${e.status}`
    ).join('\n');
    const blob = new Blob([header + content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
