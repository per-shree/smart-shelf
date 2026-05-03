import emailjs from '@emailjs/browser';

export const emailService = {
  /**
   * Sends an OTP to the specified email address using EmailJS SDK.
   */
  sendOTP: async (email: string, otp: string): Promise<boolean> => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // VERY IMPORTANT: Log OTP to console so user can proceed even if email is blocked
    console.log('%c------------------------------------------', 'color: #FFD700; font-weight: bold;');
    console.log(`%c[SECURITY] YOUR OTP IS: ${otp}`, 'color: #00FF00; font-weight: bold; font-size: 16px;');
    console.log('%c------------------------------------------', 'color: #FFD700; font-weight: bold;');

    if (!serviceId || serviceId === 'your_service_id') {
      console.warn('[EmailService] EmailJS not configured.');
      return true;
    }

    try {
      // Initialize SDK
      emailjs.init(publicKey);
      
      console.log(`[EmailService] Sending real email to ${email}...`);
      
      const result = await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: email,
          email: email,
          otp_code: otp,
          code: otp,
          from_name: "Smart Shelf Security",
          message: `Your verification code is: ${otp}`
        }
      );

      console.log('[EmailService] Success:', result.status, result.text);
      return true;
    } catch (error: any) {
      console.error('[EmailService] Error:', error);
      throw new Error(error.text || error.message || 'Email delivery failed');
    }
  },

  /**
   * Sends a login alert notification to the admin.
   */
  sendLoginAlert: async (targetEmail: string, loginUser: string, role: string): Promise<void> => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_LOGIN_ALERT_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    console.log(`[EmailService] Attempting to send login alert to: ${targetEmail}`);

    if (!serviceId || serviceId === 'your_service_id') {
      console.warn('[EmailService] Service ID not configured.');
      return;
    }
    if (!targetEmail) {
      console.warn('[EmailService] No target email provided for alert.');
      return;
    }

    try {
      emailjs.init(publicKey);
      const result = await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: targetEmail,
          user_email: targetEmail, // Some templates use user_email
          from_name: "Smart Shelf Security",
          login_user: loginUser,
          role: role,
          time: new Date().toLocaleString(),
          message: `Alert: A new login was detected on your Smart Shelf.\n\nUser: ${loginUser}\nRole: ${role}\nTime: ${new Date().toLocaleString()}\n\nIf this wasn't you or an authorized member, please change your shelf password immediately.`
        }
      );
      console.log('[EmailService] Alert Success:', result.status, result.text);
    } catch (error: any) {
      console.error('[EmailService] Alert Delivery Failed:', error);
    }
  }
};
