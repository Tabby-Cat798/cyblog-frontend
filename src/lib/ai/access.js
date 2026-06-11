const ALLOWED_ROLES = ["vip", "admin"];

export function isAICopilotAuthRequired() {
  return process.env.NODE_ENV === "production";
}

export function hasAICopilotAccess(user) {
  if (!isAICopilotAuthRequired()) {
    return true;
  }

  const role = String(user?.role || "").toLowerCase();
  return ALLOWED_ROLES.includes(role);
}

export { ALLOWED_ROLES as AI_COPILOT_ALLOWED_ROLES };
