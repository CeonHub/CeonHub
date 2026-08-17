import type { RequestHandler } from "express";
import { currentUser } from "../../middleware/auth";
import { JOB_CATEGORIES } from "../../utils/categories";
import { pathParam } from "../../utils/request";
import { sendSuccess } from "../../utils/response";
import { employmentTypeValues } from "../candidates/candidates.schema";
import {
  createJobSchema,
  listJobsSchema,
  listMyJobsSchema,
  updateJobSchema,
} from "./jobs.schema";
import * as jobsService from "./jobs.service";

export const list: RequestHandler = async (req, res) => {
  const input = listJobsSchema.parse(req.query);
  sendSuccess(res, await jobsService.listPublicJobs(input));
};

export const listMine: RequestHandler = async (req, res) => {
  const input = listMyJobsSchema.parse(req.query);
  sendSuccess(res, await jobsService.listEmployerJobs(currentUser(req), input));
};

export const getById: RequestHandler = async (req, res) => {
  const job = await jobsService.getJob(req.user ?? null, pathParam(req, "id"));
  sendSuccess(res, { job });
};

export const create: RequestHandler = async (req, res) => {
  const input = createJobSchema.parse(req.body);
  sendSuccess(res, { job: await jobsService.createJob(currentUser(req), input) }, 201);
};

export const update: RequestHandler = async (req, res) => {
  const input = updateJobSchema.parse(req.body);
  const job = await jobsService.updateJob(currentUser(req), pathParam(req, "id"), input);
  sendSuccess(res, { job });
};

export const remove: RequestHandler = async (req, res) => {
  await jobsService.deleteJob(currentUser(req), pathParam(req, "id"));
  sendSuccess(res, { deleted: true });
};

/** Static option lists for the job form and the search filters. */
export const meta: RequestHandler = (_req, res) => {
  sendSuccess(res, { categories: JOB_CATEGORIES, employmentTypes: employmentTypeValues });
};
