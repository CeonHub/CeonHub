import type { RequestHandler } from "express";
import { currentUser } from "../../middleware/auth";
import { pathParam } from "../../utils/request";
import { sendSuccess } from "../../utils/response";
import {
  createCompanySchema,
  listCompaniesSchema,
  updateCompanySchema,
} from "./companies.schema";
import * as companiesService from "./companies.service";

export const list: RequestHandler = async (req, res) => {
  const input = listCompaniesSchema.parse(req.query);
  sendSuccess(res, await companiesService.listCompanies(input));
};

export const getById: RequestHandler = async (req, res) => {
  sendSuccess(res, { company: await companiesService.getCompany(pathParam(req, "id")) });
};

export const getMine: RequestHandler = async (req, res) => {
  sendSuccess(res, { company: await companiesService.getMyCompany(currentUser(req)) });
};

export const create: RequestHandler = async (req, res) => {
  const input = createCompanySchema.parse(req.body);
  const company = await companiesService.createCompany(currentUser(req), input);
  sendSuccess(res, { company }, 201);
};

export const update: RequestHandler = async (req, res) => {
  const input = updateCompanySchema.parse(req.body);
  const company = await companiesService.updateCompany(
    currentUser(req),
    pathParam(req, "id"),
    input,
  );
  sendSuccess(res, { company });
};
