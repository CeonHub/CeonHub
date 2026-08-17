import type { Role, UserStatus } from "../generated/prisma/enums";

/** The authenticated caller, resolved from the session cookie on every request. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth / optionalAuth. Never populated from request input. */
      user?: AuthUser;
    }
  }
}
