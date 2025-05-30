import { Request, Response } from "express";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/auth";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/authEmail";
import { generateJWT } from "../utils/jwt";
export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;

      const userExists = await User.findOne({ email });

      if (userExists) {
        const error = new Error("User already exists.");
        return res.status(409).json({ error: error.message });
      }
      const user = new User(req.body);

      // Hash password
      user.password = await hashPassword(password);

      //Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      //Send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      await Promise.allSettled([user.save(), token.save()]);

      res.send("Account created. Check your email to verify it.");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static verifyAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        const error = new Error("Invalid token");
        return res.status(404).json({ error: error.message });
      }

      const user = await User.findById(tokenExists.user);
      user.confirmed = true;

      await Promise.allSettled([user.save(), tokenExists.deleteOne()]);
      res.send("Account verified successfully");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("User not found.");
        return res.status(404).json({ error: error.message });
      }

      if (!user.confirmed) {
        const token = new Token();
        token.user = user.id;
        token.token = generateToken();
        await token.save();

        AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token: token.token,
        });

        const error = new Error(
          "The user's account has not been confirmed. We sended a confirmation e-mail."
        );

        return res.status(401).json({ error: error.message });
      }

      const isPasswordCorrect = await checkPassword(password, user.password);
      if (!isPasswordCorrect) {
        const error = new Error("Incorrect password");

        return res.status(401).json({ error: error.message });
      }

      const token = generateJWT({ id: user.id });

      res.send(token);
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("User hasn't been registered.");
        return res.status(409).json({ error: error.message });
      }

      if (user.confirmed) {
        const error = new Error("User has already been verified.");
        return res.status(403).json({ error: error.message });
      }

      //Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      //Send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      await Promise.allSettled([user.save(), token.save()]);

      res.send("We've sended a new Token to your email.");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("User hasn't been registered.");
        return res.status(409).json({ error: error.message });
      }

      //Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      await token.save();

      //Send email
      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      res.send("We've sended a new Token to your email.");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        const error = new Error("Invalid token");
        return res.status(404).json({ error: error.message });
      }

      res.send("Valid token, write your new password.");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static updatePassword = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const tokenExists = await Token.findOne({ token });
      if (!tokenExists) {
        const error = new Error("Invalid token");
        return res.status(404).json({ error: error.message });
      }

      const user = await User.findById(tokenExists.user);
      user.password = await hashPassword(req.body.password);

      await Promise.allSettled([user.save(), tokenExists.deleteOne()]);

      res.send("Password updated successfully.");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static getMe = async (req: Request, res: Response) => {
    return res.json(req.user);
  };

  static updateProfile = async (req: Request, res: Response) => {
    const { name, email } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists && userExists.id.toString() !== req.user.id.toString()) {
      const error = new Error("This email is already registered.");
      return res.status(409).json({ error: error.message });
    }

    req.user.name = name;
    req.user.email = email;

    try {
      await req.user.save();
      res.send("Profile updated successfully");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body;

    const user = await User.findById(req.user.id);

    const isPasswordCorrect = await checkPassword(
      current_password,
      user.password
    );

    if (!isPasswordCorrect) {
      const error = new Error("Current password is incorrect.");
      return res.status(401).json({ error: error.message });
    }

    try {
      user.password = await hashPassword(password);
      await user.save();
      res.send("Password updated successfully");
    } catch (error) {
      res.status(500).json({ error: "Something went wrong." });
    }
  };

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body;

    const user = await User.findById(req.user.id);

    const isPasswordCorrect = await checkPassword(password, user.password);

    if (!isPasswordCorrect) {
      const error = new Error("Password is incorrect.");
      return res.status(401).json({ error: error.message });
    }

    res.send("Correct password");
  };
}
