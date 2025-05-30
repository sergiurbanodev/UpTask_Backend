import { transporter } from "../config/nodemailer";

interface IEmail {
  email: string;
  name: string;
  token: string;
}

export class AuthEmail {
  static sendConfirmationEmail = async (user: IEmail) => {
    const info = await transporter.sendMail({
      from: "UpTask <admin@uptask.com>",
      to: user.email,
      subject: "UpTask - Verify your account",
      text: "UpTask - Verify your account",
      html: `<p> Hello: ${user.name}, your UpTask account has been created. You're almost done—please confirm your account.</p>
      <p>Click the link below</p>
      <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Verify your account</a>
      <p>And enter the next verification code: <b>${user.token}</b>
      <p>This token expires in 10 minutes.</p>
      `,
    });
  };

  static sendPasswordResetToken = async (user: IEmail) => {
    const info = await transporter.sendMail({
      from: "UpTask <admin@uptask.com>",
      to: user.email,
      subject: "UpTask - Reset your password",
      text: "UpTask - Reset your password",
      html: `<p> Hello: ${user.name}, we received a request to reset your password.</p>
      <p>Click the link below</p>
      <a href="${process.env.FRONTEND_URL}/auth/new-password">Reset password</a>
      <p>And enter the next verification code: <b>${user.token}</b>
      <p>This token expires in 10 minutes.</p>
      `,
    });
  };
}
