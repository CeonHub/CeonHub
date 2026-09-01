import type { RequestHandler } from "express";
import { clearAuthCookie, setAuthCookie } from "../../config/cookies";
import { currentUser } from "../../middleware/auth";
import { sendSuccess } from "../../utils/response";
import { getSessionUser } from "../users/users.service";
import { adminRegisterSchema, loginSchema } from "./auth.schema";
import * as authService from "./auth.service";

/** Staff sign-up, limited to the configured staff email domain. */
export const registerAdmin: RequestHandler = async (req, res) => {
  const input = adminRegisterSchema.parse(req.body);
  const { token, user } = await authService.registerAdmin(input);

  setAuthCookie(res, token);
  sendSuccess(res, { user }, 201);
};

/** Staff only — candidates and employers sign in through LinkedIn. */
export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { token, user } = await authService.login(input);

  setAuthCookie(res, token);
  sendSuccess(res, { user });
};

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { loggedOut: true });
};

export const me: RequestHandler = async (req, res) => {
  const { id } = currentUser(req);
  sendSuccess(res, { user: await getSessionUser(id) });
};
