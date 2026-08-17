import type { RequestHandler } from "express";
import { clearAuthCookie, setAuthCookie } from "../../config/cookies";
import { currentUser } from "../../middleware/auth";
import { sendSuccess } from "../../utils/response";
import { getSessionUser } from "../users/users.service";
import { loginSchema } from "./auth.schema";
import * as authService from "./auth.service";

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
