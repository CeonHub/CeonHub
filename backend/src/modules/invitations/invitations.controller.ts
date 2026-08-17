import type { RequestHandler } from "express";
import { currentUser } from "../../middleware/auth";
import { pathParam } from "../../utils/request";
import { sendSuccess } from "../../utils/response";
import {
  createInvitationSchema,
  listInvitationsSchema,
  updateInvitationSchema,
} from "./invitations.schema";
import * as invitationsService from "./invitations.service";

export const create: RequestHandler = async (req, res) => {
  const input = createInvitationSchema.parse(req.body);
  const invitation = await invitationsService.createInvitation(currentUser(req), input);
  sendSuccess(res, { invitation }, 201);
};

export const list: RequestHandler = async (req, res) => {
  const input = listInvitationsSchema.parse(req.query);
  sendSuccess(res, await invitationsService.listInvitations(currentUser(req), input));
};

export const getById: RequestHandler = async (req, res) => {
  const invitation = await invitationsService.getInvitation(currentUser(req), pathParam(req, "id"));
  sendSuccess(res, { invitation });
};

export const respond: RequestHandler = async (req, res) => {
  const input = updateInvitationSchema.parse(req.body);
  const invitation = await invitationsService.respondToInvitation(
    currentUser(req),
    pathParam(req, "id"),
    input,
  );
  sendSuccess(res, { invitation });
};
