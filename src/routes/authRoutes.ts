import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
const router = Router();

router.post(
  "/create-account",
  body("name").notEmpty().withMessage("Name field is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be 8 characters long"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords doesn't match");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Invalid e-mail"),
  handleInputErrors,
  AuthController.createAccount
);

router.post(
  "/verify-account",
  body("token").notEmpty().withMessage("Token is required"),
  handleInputErrors,
  AuthController.verifyAccount
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Invalid e-mail"),
  body("password").notEmpty().withMessage("Password is required"),
  handleInputErrors,
  AuthController.login
);

router.post(
  "/request-code",
  body("email").isEmail().withMessage("Invalid e-mail"),
  handleInputErrors,
  AuthController.requestConfirmationCode
);

router.post(
  "/forgot-password",
  body("email").isEmail().withMessage("Invalid e-mail"),
  handleInputErrors,
  AuthController.forgotPassword
);

router.post(
  "/validate-token",
  body("token").notEmpty().withMessage("Token is required"),
  handleInputErrors,
  AuthController.validateToken
);

router.patch(
  "/update-password/:token",
  param("token").isNumeric().withMessage("Invalid Token"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be 8 characters long"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords doesn't match");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.updatePassword
);

router.get("/getMe", authenticate, AuthController.getMe);

/** Profile */
router.put(
  "/profile",
  authenticate,
  body("name").notEmpty().withMessage("Name field is required"),
  body("email").isEmail().withMessage("Invalid e-mail"),
  handleInputErrors,
  AuthController.updateProfile
);

router.post(
  "/update-password",
  authenticate,
  body("current_password")
    .notEmpty()
    .withMessage("Actual password is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be 8 characters long"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords doesn't match");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.updateCurrentUserPassword
);

router.post(
  "/check-password",
  authenticate,
  body("password").notEmpty().withMessage("Actual password is required"),
  handleInputErrors,
  AuthController.checkPassword
);
export default router;
