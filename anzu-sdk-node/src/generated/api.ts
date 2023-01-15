// THIS FILE WAS AUTO-GENERATED, DO NOT EDIT IT MANUALLY

export interface Account {
  id: string;
  name: string;
  email: string;
  gravatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
}

export interface WorkspaceRole {
  id: string;
  workspace: string;
  name: string;
  description: string | null;
  scopes: string[];
  created_at: string;
  updated_at: string | null;
  is_system: boolean;
}

export interface WorkspaceMember {
  id: string;

  name: string;

  workspace: string;
  account: string;

  created_at: string;
  updated_at: string | null;

  is_suspended: boolean;
}

export interface WorkspaceMemberRole {
  member: string;
  role: string;
}

export interface WorkspaceInvite {
  id: string;
  workspace: string;
  email: string;
  created_at: string;
  accepted_at: string | null;
  role: string;
  invited_by: string | null;
}

export interface Environment {
  id: string;
  name: string;
  display_name: string;
  workspace: string;
  is_production: boolean;
  created_at: string;
  updated_at: string | null;
  staging_webhook_secret: string | null;
}

export interface AccessTokenBase {
  id: string;
  description: string;
  token: string;

  scopes: string[];
  expires_at: string;

  kind: AccessTokenKind;

  account: string | null;
  workspace: string | null;

  created_at: string;
  updated_at: string | null;

  is_enabled: boolean;
}

export interface PersonalAccessToken extends AccessTokenBase {
  kind: AccessTokenKind.Account;

  account: string;
  workspace: null;
}

export interface WorkspaceAccessToken extends AccessTokenBase {
  kind: AccessTokenKind.Workspace;

  account: null;
  workspace: string;
}

export interface AuthAttempt {
  id: string;
  email: string;
  code: string;
  created_at: string;
  accepted_at: string | null;
  magic_link_clicked_at: string | null;
}

export interface Webhook {
  id: string;
  environment: string;
  name: string;
  event_kinds: EventKind[];
  endpoint: string;
  headers: Record<string, string>;
  secret: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Event {
  id: string;
  environment: string;
  kind: EventKind;
  data: IEvent;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook: string;

  created_at: string;
  started_at: string;
  finished_at: string | null;

  event: string;

  status: WebhookDeliveryStatus;

  request_url: string | null;
  request_headers: Record<string, string> | null;
  request_body: string | null;

  response_status_code: number | null;
  response_headers: unknown | null;
  response_body: string | null;
}

export enum AccessTokenKind {
  Account = 'account',
  Workspace = 'workspace',
}

export enum WebhookDeliveryStatus {
  Pending = 'pending',
  Success = 'success',
  Failure = 'failure',
  Timeout = 'timeout',
  Forwarded = 'forwarded',
}

export type AccessToken = PersonalAccessToken | WorkspaceAccessToken;

export enum ErrorCode {
  None = 'NONE',
  NotFound = 'NOT_FOUND',
  RateLimit = 'RATE_LIMIT',
  Invalid = 'INVALID',

  NotAllowed = 'NOT_ALLOWED',

  UserManagementExistingTenantAlias = 'USER_MANAGEMENT_EXISTING_TENANT_ALIAS',
  UserManagementExistingTenantDomain = 'USER_MANAGEMENT_EXISTING_TENANT_DOMAIN',
  UserManagementUserIdentitySuspended = 'USER_MANAGEMENT_USER_IDENTITY_SUSPENDED',

  AuthRequiresSignup = 'AUTH_REQUIRES_SIGNUP',
  AuthUnauthorized = 'AUTH_UNAUTHORIZED',
  AuthMagicLinkNotClicked = 'AUTH_MAGIC_LINK_NOT_CLICKED',
  AuthAttemptAlreadyAccepted = 'AUTH_ATTEMPT_ALREADY_ACCEPTED',
  AuthAccountExists = 'AUTH_ACCOUNT_EXISTS',
  AuthProviderError = 'AUTH_PROVIDER_ERROR',

  FeatureNotEnabled = 'FEATURE_NOT_ENABLED',

  UnknownEventKind = 'UNKNOWN_EVENT_KIND',
  TriggerUnsupportedEventKind = 'TRIGGER_UNSUPPORTED_EVENT_KIND',
}

export interface IEvent {
  id: string;
  kind: EventKind;
  payload: unknown;
  createdAt: string;
  version: string;
}

export enum EventKind {
  WebhookCreated = 'webhook.created',
  WebhookEnabled = 'webhook.enabled',

  UserIdentityCreated = 'user_management.user_identity_created',
  UserIdentitySuspended = 'user_management.user_identity_suspended',
  UserIdentityUnsuspended = 'user_management.user_identity_unsuspended',
  UserIdentityDeleted = 'user_management.user_identity_deleted',
}

export interface IWebhookDeliveryContent extends IEvent {
  // event scope
  scope: {
    workspaceId: string;
    environmentId: string;
  };

  // delivery details
  delivery: {
    webhookId: string;
    deliveryId: string;
  };
}

export interface ProfileResponse {
  id: string;
  name: string;
  gravatar_url: string | null;
}

export interface RenderableIcon {
  name: DatabaseIcon;
  color: DatabaseColor;
}

export interface QueryArgs {
  pagination: PaginationArgs;
  filters: DatabaseFilter[];
  sort: DatabaseSort | null;
}

export enum DatabaseIcon {
  Type = 'type',
  Database = 'database',
  Circle = 'circle',
  CheckCircle = 'check-circle',
  Box = 'box',
  Email = 'email',
  Calendar = 'calendar',
  Hash = 'hash',
  Toggle = 'toggle',
  User = 'user',
  Link = 'link',
  Currency = 'currency',
  Map = 'map',

  BrandGoogle = 'brand-google',
  BrandGitHub = 'brand-github',
}

export enum DatabaseColor {
  Black = 'gray',
  Orange = 'orange',
  Green = 'green',
}

export enum DatabaseCellRenderer {
  Email = 'email',
  Avatar = 'avatar',
  UserIdentity = 'user_identity',
  WorkspaceMember = 'workspace_member',
  URL = 'url',
}

export interface DatabaseStorageSettings {
  mode: DatabaseFieldStorageMode;
}

export interface DatabaseBaseField {
  kind: DatabaseFieldKind;
  name: string;

  icon: RenderableIcon;
  label: string;
  labelColor?: DatabaseColor;

  isRequired?: boolean;
  allowedFilterOperators?: DatabaseFilterOperator[];
  isSortable?: boolean;
  storage?: DatabaseFieldStorageMode;
  isComputed?: boolean;

  cellRenderer?: DatabaseCellRenderer;
}

export interface DatabaseStringField extends DatabaseBaseField {
  kind: DatabaseFieldKind.String;
}

export interface DatabaseIDField extends DatabaseBaseField {
  kind: DatabaseFieldKind.ID;
  relatedEntity?: DatabaseRelatedEntity;
}

export interface DatabaseDateTimeField extends DatabaseBaseField {
  kind: DatabaseFieldKind.DateTime;
}

export interface DatabaseNumberField extends DatabaseBaseField {
  kind: DatabaseFieldKind.Number;
}

export interface DatabaseEnumValue {
  icon: RenderableIcon;
  value: string;
  label: string;
  labelColor?: DatabaseColor;
  isDefault?: boolean;
}

export interface DatabaseEnumField extends DatabaseBaseField {
  kind: DatabaseFieldKind.Enum;
  enumValues: DatabaseEnumValue[];
}

export interface DatabaseBooleanField extends DatabaseBaseField {
  kind: DatabaseFieldKind.Boolean;
}

export enum DatabaseFieldKind {
  String = 'string',
  DateTime = 'datetime',
  Enum = 'enum',
  ID = 'id',
  Number = 'number',
  Boolean = 'boolean',
}

export enum DatabaseFieldStorageMode {
  Normal = 'normal',
  Embedded = 'embedded',
}

export enum DatabaseRelatedEntity {
  CRMCompany = 'crm_company',
  CRMContact = 'crm_contact',
  CRMDeal = 'crm_deal',
  CRMNote = 'crm_note',
  UserManagementUserIdentity = 'user_management_user_identity',
}

export type DatabaseField =
  | DatabaseStringField
  | DatabaseDateTimeField
  | DatabaseEnumField
  | DatabaseIDField
  | DatabaseNumberField
  | DatabaseBooleanField;

export interface DatabaseFilter {
  field: string;
  operator: DatabaseFilterOperator;
  value: string;
}

export enum DatabaseFilterOperator {
  Equals = 'eq',
  NotEquals = 'neq',
  Contains = 'contains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',
  IsBefore = 'isBefore',
  IsAfter = 'isAfter',
  IsEmpty = 'isEmpty',
  IsNotEmpty = 'isNotEmpty',
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  LessThan = 'lt',
  LessThanOrEqual = 'lte',
}

export interface PaginationArgs {
  after: string | null;
  first: number | null;
  before: string | null;
  last: number | null;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface DatabaseSchema {
  fields: DatabaseField[];
}

export interface DatabaseSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseView {
  id: string;
  name: string;
  filters?: DatabaseFilter[];
  visibleFields: string[];
  sort?: DatabaseSort;
}

export interface AnalyticsEvent {
  workspace_id: string;
  environment_id: string;

  event_id: string;

  category: string;
  kind: string;

  created_at: string;
  page_duration: number | null;
  received_at: string;
  ingested_at: string;

  user_id: string;
  user_identity: string | null;
  session_id: string;

  user_agent: string;
  url: string;
  referrer: string;
  ip_address: string;

  country: string;

  attributes: [string, string][];
}

export interface AnalyticsTimeRange {
  relative?: AnalyticsRelativeTimeRange;
  from?: string;
  to?: string;
}

export interface AnalyticsEventFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface AnalyticsCountBucket {
  bucket: string;
  count: number;
}

export interface AnalyticsCategoryCountBucket {
  category: string;
  results: AnalyticsCountBucket[];
}

export enum AnalyticsRelativeTimeRange {
  Last24Hours = 'last_24_hours',
  Last7Days = 'last_7_days',
  Last30Days = 'last_30_days',
  Last90Days = 'last_90_days',
}

export interface AnalyticsEnvironmentConfig {
  environment: string;
  workspace: string;

  allowed_origins: string[];

  created_at: string;
  updated_at: string | null;
}

export interface AnalyticsConfigResp {
  config: AnalyticsEnvironmentConfig;
  scriptUrl: string;
}

export interface ICRMContact {
  environment: string;
  id: string;

  company: string | null;
  job_title: string | null;

  full_name: string | null;
  given_name: string | null;
  family_name: string | null;

  email: string | null;
  phone_number: string | null;

  user_identity: string | null;

  created_at: string;
  updated_at: string | null;

  last_contacted_at: string | null;
  lead_status: string | null;

  stage: string | null;
  assigned_to: string | null;

  properties: Record<string, unknown>;
}

export interface CRMEnvironmentConfig {
  environment: string;
  workspace: string;

  contact_schema: DatabaseSchema;
  company_schema: DatabaseSchema;
  deal_schema: DatabaseSchema;
  note_schema: Record<CRMNoteKind, DatabaseSchema>;

  created_at: string;
  updated_at: string | null;
}

export enum CRMNoteKind {
  Meeting = 'meeting',
  Call = 'call',
  Email = 'email',
  SMS = 'sms',
  WhatsAppMessage = 'whatsapp_message',
  LinkedInMessage = 'linkedin_message',
  PostalMail = 'postal_mail',
}

export interface CRMConfigResp {
  config: CRMEnvironmentConfig;
}

export interface IUserAuthAttempt {
  environment: string;
  id: string;
  provider: AuthProviderKind;

  status: UserAuthAttemptStatus;

  email: string | null;
  phone_number: string | null;

  code: string;

  referrer: string | null;
  ip_address: string | null;
  user_agent: string | null;

  redirect_uri: string | null;

  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  magic_link_clicked_at: string | null;

  failure_reason: UserAuthAttemptFailureReason | null;
  failure_provider_error: string | null;
}

export enum UserAuthAttemptStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Failed = 'failed',
}

export enum UserAuthAttemptFailureReason {
  UserSuspended = 'user_suspended',
}

export interface IUserManagementEventUserIdentityCreated extends IEvent {
  kind: EventKind.UserIdentityCreated;
  payload: {
    provisionedWith: ProvisionedWith;
    isSecondaryIdentity?: boolean;
    identity: {
      id: string;
      email?: string;
      provider: AuthProviderKind;
      name?: string;
      givenName?: string;
      familyName?: string;
      userName?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      primaryIdentity?: string;
    };
    authAttempt: {
      id: string;
      createdAt: string;
      referrer?: string;
      ipAddress?: string;
      userAgent?: string;
      redirectUri?: string;
      acceptedAt?: string;
    } | null;
  };
}

export interface IProviderConfig {
  isEnabled: boolean;
  kind: AuthProviderKind;
}

export interface IGoogleProviderConfig extends IProviderConfig {
  kind: AuthProviderKind.Google;
  clientId: string;
  clientSecret: string;

  // Optimize for G Suite
  hostedDomain: string | null;
}

export interface IGitHubProviderConfig extends IProviderConfig {
  kind: AuthProviderKind.GitHub;
  clientId: string;
  clientSecret: string;
}

export interface IEmailProviderConfig extends IProviderConfig {
  kind: AuthProviderKind.Email;
}

export interface HostedPageAppearance {
  logoUrl: string | null;
  subtitle: string | null;
  applicationName: string | null;
}

export interface EnvironmentConfig {
  workspace: string;
  environment: string;
  tenant_default_alias: string;
  tenant_custom_alias: string | null;
  tenant_custom_domain: string | null;
  auth_providers: ProviderConfig[];

  user_provisioning_mode: UserProvisioningMode;

  default_redirect_uri: string | null;
  allowed_redirect_uris: string[] | null;

  access_token_secret: string;

  // configuration for hosted page
  hosted_page_appearance: HostedPageAppearance | null;
}

export enum UserProvisioningMode {
  RedirectImmediately = 'redirect_immediately',
  WaitOnAuthPage = 'wait_on_auth_page',
}

export enum AuthProviderKind {
  Google = 'google',
  GitHub = 'github',
  Email = 'email',
}

export type ProviderConfig = IGoogleProviderConfig | IGitHubProviderConfig | IEmailProviderConfig;

export interface HostedPagePublicConfig {
  providers: AuthProviderKind[];
  appearance: HostedPageAppearance | null;
}

export interface UserManagementConfig {
  tenant_custom_alias: string | null;
  tenant_custom_domain: string | null;
  auth_providers: ProviderConfig[];
  user_provisioning_mode: UserProvisioningMode;
  default_redirect_uri: string | null;
  hosted_page_appearance: HostedPageAppearance | null;
  allowed_redirect_uris: string[] | null;
}

export interface UserManagementConfigResp {
  hosted_page_domain: string;
  tenant_default_alias: string;
  config: UserManagementConfig;
  hostedPageUrl: string;
  providerRedirectUri: Array<{
    provider: AuthProviderKind;
    redirectUri: string;
  }>;
  accessTokenSecret: string;
}

export interface IUserAccessToken {
  environment: string;
  id: string;

  description: string;
  token: string;

  created_at: string;
  updated_at: string | null;

  expires_at: string | null;

  is_enabled: boolean;

  user_identity: string;
}

export interface IUserIdentity {
  environment: string;
  id: string;

  provider: AuthProviderKind;
  provider_config: unknown | null;

  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;

  email: string | null;
  name: string | null;
  given_name: string | null;
  family_name: string | null;
  username: string | null;
  phone_number: string | null;
  avatar_url: string | null;

  login_count: number;
  is_suspended: boolean;

  provisioning_status: UserProvisioningStatus;
  primary_identity: string | null;
}

export enum ProvisionedWith {
  Email = 'email',
  PhoneNumber = 'phone_number',
}

export enum UserProvisioningStatus {
  Pending = 'pending',
  Complete = 'complete',
}