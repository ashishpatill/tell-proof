/**
 * Canonical registered MCP tool names — must match `@tell/schema` MCP_TOOL_NAMES.
 * Drift test reads this file / the live server registration.
 */
export const REGISTERED_MCP_TOOLS = [
  "tell_capture",
  "tell_diagnose",
  "tell_redesign",
  "tell_apply",
  "tell_capture_matrix",
  "tell_proof_verify",
  "tell_proof_revert",
  "tell_design_from_features",
  "tell_voice",
  "tell_install_info",
] as const;

export type RegisteredMcpTool = (typeof REGISTERED_MCP_TOOLS)[number];
