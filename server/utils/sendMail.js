import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      pool: true, // Keep connection pool open for fast subsequent deliveries
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 7000,
      socketTimeout: 15000,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });
  }
  return cachedTransporter;
};

const sendMail = async (otp, email) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"CogniFlow" <${process.env.EMAIL}>`,
      to: email,
      subject: "Verify Your Email Address With CogniFlow!",
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin: 0;">
          <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
            <div style="height: 6px; background: linear-gradient(to right, #22d3ee, #3b82f6);"></div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #0f172a; margin: 0 0 15px 0; font-weight: 800; font-size: 26px;">
                Cogni<span style="color: #3b82f6;">Flow</span>
              </h2>
              <p style="color: #475569; font-size: 16px; margin: 0 0 30px 0; line-height: 1.5;">
                Hello! Here is your secure verification code to access your account:
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; margin: 0 auto 30px auto; display: inline-block;">
                <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 8px; white-space: nowrap;">
                  ${otp}
                </h1>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0;">
                This code will expire in <strong>15 minutes</strong>.
              </p>
              <div style="border-top: 1px solid #e2e8f0; margin: 20px 0; padding-top: 20px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                  If you didn't request this code, you can safely ignore this email. Someone might have typed their email address incorrectly.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", email, "MessageId:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email to", email, ":", error.message);
    throw error;
  }
};

export default sendMail;
