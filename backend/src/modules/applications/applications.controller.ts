import type { RequestHandler } from "express";
import { currentUser } from "../../middleware/auth";
import { pathParam } from "../../utils/request";
import { sendSuccess } from "../../utils/response";
import {
  createApplicationSchema,
  listApplicationsSchema,
  updateApplicationSchema,
} from "./applications.schema";
import * as applicationsService from "./applications.service";

/** Mounted on the jobs router as POST /api/jobs/:id/applications. */
export const create: RequestHandler = async (req, res) => {
  const input = createApplicationSchema.parse(req.body ?? {});
  const application = await applicationsService.apply(
    currentUser(req),
    pathParam(req, "id"),
    input,
  );
  sendSuccess(res, { application }, 201);
};

export const list: RequestHandler = async (req, res) => {
  const input = listApplicationsSchema.parse(req.query);
  sendSuccess(res, await applicationsService.listApplications(currentUser(req), input));
};

export const getById: RequestHandler = async (req, res) => {
  const application = await applicationsService.getApplication(currentUser(req), pathParam(req, "id"));
  sendSuccess(res, { application });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const input = updateApplicationSchema.parse(req.body);
  const application = await applicationsService.updateStatus(
    currentUser(req),
    pathParam(req, "id"),
    input,
  );
  sendSuccess(res, { application });
};
