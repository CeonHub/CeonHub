import type { RequestHandler } from "express";
import { currentUser } from "../../middleware/auth";
import { ApiError } from "../../utils/apiError";
import { pathParam } from "../../utils/request";
import { sendSuccess } from "../../utils/response";
import { listCandidatesSchema, updateCandidateSchema } from "./candidates.schema";
import * as candidatesService from "./candidates.service";

export const list: RequestHandler = async (req, res) => {
  const input = listCandidatesSchema.parse(req.query);
  sendSuccess(res, await candidatesService.listCandidates(currentUser(req), input));
};

export const getMine: RequestHandler = async (req, res) => {
  sendSuccess(res, { candidate: await candidatesService.getOwnProfile(currentUser(req)) });
};

export const getById: RequestHandler = async (req, res) => {
  const candidate = await candidatesService.getCandidate(currentUser(req), pathParam(req, "id"));
  sendSuccess(res, { candidate });
};

export const updateMine: RequestHandler = async (req, res) => {
  const user = currentUser(req);
  const input = updateCandidateSchema.parse(req.body);
  sendSuccess(res, { candidate: await candidatesService.updateCandidate(user, user.id, input) });
};

export const updateById: RequestHandler = async (req, res) => {
  const input = updateCandidateSchema.parse(req.body);
  const candidate = await candidatesService.updateCandidate(
    currentUser(req),
    pathParam(req, "id"),
    input,
  );
  sendSuccess(res, { candidate });
};

export const uploadResume: RequestHandler = async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Attach a file in the 'file' field");

  const resume = await candidatesService.addResume(currentUser(req), req.file);
  sendSuccess(res, { resume }, 201);
};

export const listResumes: RequestHandler = async (req, res) => {
  sendSuccess(res, { resumes: await candidatesService.listResumes(currentUser(req)) });
};
