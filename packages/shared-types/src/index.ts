import type {
  AddMemberRequest,
  AdminOverviewResponse,
  AuthStatusResponse,
  CacheInvalidateResponse,
  LLMModelResponse,
  OrganizationDetailResponse,
  OrganizationInvitationResponse,
  OrganizationListResponse,
  OrganizationMemberResponse,
  OrganizationResponse,
  PendingInvitationsResponse,
  ProjectCreate,
  ProjectListResponse,
  ProjectResponse,
  ProjectUpdate,
  UserProfileResponse,
  AgentResponse,
  AgentCreate,
  AgentUpdate,
  AgentListResponse,
  AgentToolResponse,
  AgentToolDetailResponse,
  AgentToolCreate,
  AgentToolUpdate,
  AgentToolRunResponse,
  AgentToolRunListResponse,
  AgentSessionResponse,
  AgentSessionDetailResponse,
  AgentSessionListResponse,
  AgentMessageResponse,
  UsageOverviewResponse,
  UsageTimeSeriesDataPoint,
  UsageModelBreakdownItem,
  UsageAgentBreakdownItem,
  UsageToolBreakdownItem,
  OrganizationQuotaResponse,
} from "./generated/api";

export * from "./generated/api";

export type Organization = OrganizationResponse;
export type OrganizationDetail = OrganizationDetailResponse & {
  members: OrganizationMemberResponse[];
  invitations: OrganizationInvitationResponse[];
};
export type OrganizationInvitation = OrganizationInvitationResponse;
export type OrganizationMember = OrganizationMemberResponse;
export type OrganizationMemberInput = AddMemberRequest;
export type OrganizationList = OrganizationListResponse;
export type PendingInvitations = PendingInvitationsResponse;

export type Project = ProjectResponse;
export type ProjectCreateInput = ProjectCreate;
export type ProjectUpdateInput = ProjectUpdate;
export type ProjectList = ProjectListResponse;

export type AdminOverview = AdminOverviewResponse;
export type AdminCacheInvalidate = CacheInvalidateResponse;

export type AuthStatus = AuthStatusResponse;
export type UserProfile = UserProfileResponse;

export type LLMModel = LLMModelResponse;

export type Agent = AgentResponse;
export type AgentCreateInput = AgentCreate;
export type AgentUpdateInput = AgentUpdate;
export type AgentList = AgentListResponse;

export type AgentTool = AgentToolResponse;
export type AgentToolDetail = AgentToolDetailResponse;
export type AgentToolCreateInput = AgentToolCreate;
export type AgentToolUpdateInput = AgentToolUpdate;

export type AgentToolRun = AgentToolRunResponse;
export type AgentToolRunList = AgentToolRunListResponse;

export type AgentSession = AgentSessionResponse;
export type AgentSessionDetail = AgentSessionDetailResponse;
export type AgentSessionList = AgentSessionListResponse;
export type AgentMessage = AgentMessageResponse;

export type UsageOverview = UsageOverviewResponse;
export type UsageTimeSeriesPoint = UsageTimeSeriesDataPoint;
export type UsageModelBreakdown = UsageModelBreakdownItem;
export type UsageAgentBreakdown = UsageAgentBreakdownItem;
export type UsageToolBreakdown = UsageToolBreakdownItem;
export type OrganizationQuota = OrganizationQuotaResponse;
