import type { RequestHandler } from "express";
import { currentUser } from "../../middleware/auth";
import { pathParam } from "../../utils/request";
import { sendSuccess } from "../../utils/response";
import {
  listAdminJobsSchema,
  listUsersSchema,
  updateJobStatusSchema,
  updateUserStatusSchema,
} from "./admin.schema";
import * as adminService from "./admin.service";

export const listUsers: RequestHandler = async (req, res) => {
  sendSuccess(res, await adminService.listUsers(listUsersSchema.parse(req.query)));
};

export const setUserStatus: RequestHandler = async (req, res) => {
  const { status } = updateUserStatusSchema.parse(req.body);
  const user = await adminService.setUserStatus(currentUser(req), pathParam(req, "id"), status);
  sendSuccess(res, { user });
};

export const listJobs: RequestHandler = async (req, res) => {
  sendSuccess(res, await adminService.listJobs(listAdminJobsSchema.parse(req.query)));
};

export const setJobStatus: RequestHandler = async (req, res) => {
  const { status } = updateJobStatusSchema.parse(req.body);
  const job = await adminService.setJobStatus(currentUser(req), pathParam(req, "id"), status);
  sendSuccess(res, { job });
};

export const stats: RequestHandler = async (_req, res) => {
  sendSuccess(res, { stats: await adminService.getStats() });
};
