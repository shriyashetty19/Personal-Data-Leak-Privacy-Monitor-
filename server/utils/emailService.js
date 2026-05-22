import nodemailer from 'nodemailer';

/**
 * Email Service - OTP and Notification management
 * Uses NodeMailer with Ethereal/Console fallback for demo
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.isReady = false;
        this.init();
    }

    async init() {
        try {
            // For this demo, we'll try Ethereal (mock SMTP for developers)
            // If it fails, we fall back to Console Logging.
            const account = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
            this.isReady = true;
            console.log('📬 Email Service: Initialized with Ethereal (Mock SMTP)');
        } catch (error) {
            console.log('⚠️ Email Service: Failing back to Console Logging');
            this.isReady = false;
        }
    }

    async sendVerificationEmail(email, otp) {
        const mailOptions = {
            from: '"Privacy Shield PRO" <security@privacymonitor.ai>',
            to: email,
            subject: '🔐 Verify Your Identity - Privacy Shield PRO',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #9333ea; font-size: 24px; font-weight: 800;">PRIVACY SHIELD PRO</h2>
                    <p style="color: #475569; font-size: 16px;">Welcome! To activate your enterprise security account, please enter the following verification code:</p>
                    <div style="background: #f8fafc; padding: 30px; text-align: center; border-radius: 12px; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #020617;">${otp}</span>
                    </div>
                    <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        if (this.isReady) {
            try {
                const info = await this.transporter.sendMail(mailOptions);
                console.log('📧 Verification Email Sent: %s', info.messageId);
                console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
                console.log('🔑 OTP FOR DEMO: ', otp);
            } catch (error) {
                console.error('❌ Error sending mock email:', error);
                this.logOTP(email, otp);
            }
        } else {
            this.logOTP(email, otp);
        }
    }

    logOTP(email, otp) {
        console.log('\n----------------------------------------');
        console.log('🔑 VERIFICATION OTP FOR', email);
        console.log('CODE:', otp);
        console.log('----------------------------------------\n');
    }

    async sendBreachAlert(email, breachData) {
        // Implementation for future use
        console.log('🚀 Breach Alert Sent to ', email);
    }
}

const emailService = new EmailService();
export default emailService;
