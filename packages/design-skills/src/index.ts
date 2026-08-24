export * from "./types";
export * from "./analyze";
export * from "./route";
export * from "./color";
export * from "./palette";
export * from "./scale";
export * from "./composition";
export * from "./copy";
export * from "./tokens";
export * from "./css";
export * from "./sections";
export * from "./render";
export {
  designFromFeatures,
  designFromFeaturesAuthored,
  resolveTaste,
} from "./orchestrate";
export type {
  DesignFromFeaturesAuthorOptions,
  DesignFromFeaturesOptions,
} from "./orchestrate";
export {
  GeminiContentAuthor,
  DeterministicContentAuthor,
  authorConnectiveTissue,
  authoredDiffersFromFallback,
  briefFactTokens,
  contentContextFromBrief,
  contradictionReason,
  createContentAuthor,
  deterministicAuthored,
  isConnectiveAuthorEligible,
  mergeWithFallback,
  sentenceSharesFactToken,
} from "./author";
export type {
  AuthoredConnectiveTissue,
  AuthoredCta,
  AuthoredFaqItem,
  AuthoredProof,
  AuthoredWorkflowStage,
  ContentAuthor,
  ContentContext,
  GeminiAuthorConfig,
} from "./author";
export {
  DESIGN_TEMPLATES,
  SHOWCASE_BRIEFS,
  getTemplate,
  listTemplates,
  templateToStudioPreset,
} from "./templates";
export type { DesignTemplate, TemplateKey } from "./templates";
export { assertBasics } from "./basics-checklist";
export type { BasicsFinding, BasicsReport } from "./basics-checklist";
export {
  assertSkillWiring,
  formatResearchGateMarkdown,
} from "./skill-wiring";
export type { SkillWiringFinding, SkillWiringReport } from "./skill-wiring";
export {
  applyAgencyPolish,
  applyAgencyPolishSequence,
  agencyPolishAxesPresent,
} from "./agency-polish";
export type { AgencyPolishAxis } from "./agency-polish";
export { assertAgencyDelivery, AGENCY_DEFAULT_BAN_LIST } from "./agency-delivery";
export type { AgencyFinding, AgencyDeliveryReport } from "./agency-delivery";
export { FIG_MONO_PX, miniPageMatter, densitometerStrip } from "./figures";
export {
  SPORT_PACKS,
  SportId,
  getSportPack,
  listSportPacks,
  matchSportFromQuery,
  sportResearchBriefTemplate,
} from "./sport-vernacular";
export type {
  SportAccessMode,
  SportFormatLens,
  SportMultiPageRoute,
  SportPrimaryFact,
  SportShellContract,
  SportVernacularPack,
} from "./sport-vernacular";
export {
  CRICKET_ALL_ROUTES,
  CRICKET_CORE_SIX_ROUTES,
  CRICKET_SECONDARY_ROUTES,
  DOMAIN_RESEARCH_NODE_IDS,
  DomainResearchPack,
  listDomainResearchPacks,
  loadPriorDomain,
  requirementGapDiff,
  routeDomainResearchSkills,
  sportPackToDomainResearch,
} from "./domain-research";
export type {
  DomainControlSpec,
  DomainFooterColumn,
  DomainMultiPageRoute,
  DomainNavItem,
  DomainResearchNodeId,
  DomainResearchRoutePlan,
  DomainResearchTasteSeed,
  DomainShellContract,
  DomainVariantLens,
  RequirementGapDiff,
} from "./domain-research";
