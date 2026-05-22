/**
 * EmailValidator - Realistic email validation logic
 * Blocks disposable domains and simulates existence checks
 */
const DISPOSABLE_DOMAINS = [
    // Common Disposable Providers
    'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'dispostable.com', 'getnada.com', 'sharklasers.com', 'fake123.com',
    'abc.com', 'test.com', 'example.com', 'yopmail.com', 'maildrop.cc',
    'mailnesia.com', 'mailnull.com', 'mytrashmail.com', 'proxypost.net',
    'shortmail.com', 'trashmail.net', 'whocares.jp', 'spambox.us',
    'temp-mail.org', 'tempmailaddress.com', 'instantemail.org', 
    'dropmail.me', 'disposablemail.com', 'mail-fake.com', 'mohmal.com'
];

/**
 * Advanced Syntax & Gibberish Detection
 * Ensures the email doesn't look like an automated random string
 */
const isGibberish = (str) => {
    // 1. Length check for prefix (if it's too long and has no vowels, it's likely random)
    const prefix = str.split('@')[0];
    if (prefix.length > 20) return true;
    
    // 2. Vowel-to-Consonant Ratio (Primitive Check)
    const vowels = prefix.match(/[aeiou]/gi) || [];
    if (prefix.length > 8 && vowels.length === 0) return true; // e.g. "ghjklytr"
    
    // 3. Consecutive digit check (more than 5 digits in a row)
    if (/\d{5,}/.test(prefix)) return true; // e.g. "user123456"
    
    // 4. Repeated character check (e.g. "aaaaa")
    if (/(.)\1{4,}/.test(prefix)) return true;

    return false;
};

export const validateEmailExistence = async (email) => {
    if (!email || !email.includes('@')) {
        return { valid: false, message: 'Invalid email format' };
    }

    const [user, domain] = email.toLowerCase().split('@');

    // 1. Syntax & Reliability Check
    if (isGibberish(user)) {
        return { 
            valid: false, 
            message: 'Email address looks suspicious or randomized. Please use a real handle.' 
        };
    }

    // 2. Basic format check (RFC 5322 approximation)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }

    // 3. Disposable domain check
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return { 
            valid: false, 
            message: 'Disposable or temporary email addresses are not allowed.' 
        };
    }

    // 4. Specific Blacklisted Domains
    if (domain.includes('fake') || domain.includes('temp') || domain.match(/\d{5,}/)) {
        return { 
            valid: false, 
            message: 'Invalid or non-existent email domain. Please use a verified provider.' 
        };
    }

    return { valid: true };
};
