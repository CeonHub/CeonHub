import type { RequestHandler } from "express";
import { clearAuthCookie } from "../../config/cookies";
import { currentUser } from "../../middleware/auth";
import { sendSuccess } from "../../utils/response";
import { changePasswordSchema, updateProfileSchema } from "./users.schema";
import * as usersService from "./users.service";

export const updateProfile: RequestHandler = async (req, res) => {
  const user = currentUser(req);
  const input = updateProfileSchema.parse(req.body);
  sendSuccess(res, { user: await usersService.updateProfile(user, input) });
};

export const changePassword: RequestHandler = async (req, res) => {
  const { id } = currentUser(req);
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  await usersService.changePassword(id, currentPassword, newPassword);

  // The old session cookie stays valid until it expires; sign the user out so the
  // password change ends the session everywhere it is easy to end it.
  clearAuthCookie(res);
  sendSuccess(res, { passwordChanged: true });
};
