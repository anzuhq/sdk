// THIS FILE WAS AUTO-GENERATED, DO NOT EDIT IT MANUALLY

export interface Account {
  id: string;
  name: string;
  email: string;
  gravatar_url: string | null;
  created_at: string;
  updated_at: string | null;
  early_access_enabled: boolean;
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
  currency: Currency;
}

export interface MonetaryValueExchangeRate {
  environment: string;
  from_currency: Currency;
  to_currency: Currency;
  rate: number;
  created_at: string;
  updated_at: string | null;
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

  // denormalized data
  actor_kind: EventActorKind;
  actor_id: string;
  primary_resource_kind: EventResourceKind;
  primary_resource_id: string;
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

export interface DatabaseView extends DatabaseViewBase {
  id: string;
  environment: string;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export enum Currency {
  USDollar = 'USD',
  Euro = 'EUR',
  BritishPound = 'GBP',
  JapaneseYen = 'JPY',
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

export enum DatabaseViewKind {
  UserManagementUserIdentities = 'user_management_user_identities',

  CRMContacts = 'crm_contacts',
  CRMCompanies = 'crm_companies',
  CRMDeals = 'crm_deals',
}

export enum DatabaseViewLayout {
  Table = 'table',
  Board = 'board',
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

export interface EventWorkspaceMemberActor {
  kind: EventActorKind.WorkspaceMember;
  id: string;
}

export interface EventSystemActor {
  kind: EventActorKind.System;
}

export interface EventResource<T extends EventResourceKind> {
  kind: T;
  id: string;
}

export interface IEvent<T extends EventKind = EventKind> {
  id: string;
  kind: T;
  payload: unknown;
  createdAt: string;
  version: string;
  actor: EventActor;
  resource?: EventResource<EventResourceKind>;
}

export enum EventKind {
  WebhookCreated = 'webhook.created',
  WebhookEnabled = 'webhook.enabled',

  UserIdentityCreated = 'user_management.user_identity_created',
  UserIdentitySuspended = 'user_management.user_identity_suspended',
  UserIdentityUnsuspended = 'user_management.user_identity_unsuspended',
  UserIdentityDeleted = 'user_management.user_identity_deleted',

  CRMContactCreated = 'crm.contact_created',
  CRMContactUpdated = 'crm.contact_updated',
  CRMContactDeleted = 'crm.contact_deleted',
  CRMContactAssigned = 'crm.contact_assigned',
  CRMContactUnassigned = 'crm.contact_unassigned',

  CRMCompanyCreated = 'crm.company_created',
  CRMCompanyUpdated = 'crm.company_updated',
  CRMCompanyDeleted = 'crm.company_deleted',
  CRMCompanyAssigned = 'crm.company_assigned',
  CRMCompanyUnassigned = 'crm.company_unassigned',

  CRMDealCreated = 'crm.deal_created',
  CRMDealUpdated = 'crm.deal_updated',
  CRMDealDeleted = 'crm.deal_deleted',
  CRMDealAssigned = 'crm.deal_assigned',
  CRMDealUnassigned = 'crm.deal_unassigned',

  CRMCommentCreated = 'crm.comment_created',

  CRMNotesCreated = 'crm.notes_created',
  CRMNotesUpdated = 'crm.notes_updated',
}

export enum EventActorKind {
  System = 'system',
  WorkspaceMember = 'workspace_member',
}

export enum EventResourceKind {
  Webhook = 'webhook',
  UserIdentity = 'user_management.user_identity',
  CRMContact = 'crm.contact',
  CRMCompany = 'crm.company',
  CRMDeal = 'crm.deal',
  CRMNotes = 'crm.notes',
  CRMComment = 'crm.comment',
}

export type AllEvents =
  | WebhookCreatedEvent
  | WebhookEnabledEvent
  | CRMContactAssignedEvent
  | CRMContactUnassignedEvent
  | CRMCompanyAssignedEvent
  | CRMCompanyUnassignedEvent
  | CRMDealAssignedEvent
  | CRMDealUnassignedEvent
  | CRMCompanyCreatedEvent
  | CRMContactCreatedEvent
  | CRMDealCreatedEvent
  | CRMCommentCreatedEvent
  | CRMNotesCreatedEvent
  | CRMNotesUpdatedEvent;

export type EventActor = EventWorkspaceMemberActor | EventSystemActor;

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

export interface AccountResponse {
  id: string;
  name: string;
  earlyAccessEnabled: boolean;
}

export interface ProfileResponse {
  id: string;
  name: string;
  gravatar_url: string | null;
}

export interface WebhookCreatedEvent extends IEvent<EventKind.WebhookCreated> {
  resource: EventResource<EventResourceKind.Webhook>;
}

export interface WebhookEnabledEvent extends IEvent<EventKind.WebhookEnabled> {
  resource: EventResource<EventResourceKind.Webhook>;
}

export interface RenderableIcon {
  name: DatabaseIcon;
  color: DatabaseColor;
}

export interface QueryArgs {
  pagination: PaginationArgs;
  filters: DatabaseFilter[];
  sort: DatabaseSort | null;
  search: DatabaseSearch | null;
  groupBy: DatabaseGroupBy | null;
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
  Red = 'red',
}

export enum DatabaseStringValueType {
  Email = 'email',
  Avatar = 'avatar',
  URL = 'url',
  PhoneNumber = 'phone_number',
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

  storage?: DatabaseFieldStorageMode;

  isRequired?: boolean;
  allowedFilterOperators?: DatabaseFilterOperator[];
  isSortable?: boolean;
  defaultSortDirection?: DatabaseSortDirection;
  isComputed?: boolean;
  isTitle?: boolean;
  isSearchable?: boolean;
  isGroupable?: boolean;
  isUserEditable?: boolean;
}

export interface DatabaseStringField extends DatabaseBaseField {
  kind: DatabaseFieldKind.String;

  valueType?: DatabaseStringValueType;
  isMultiline?: boolean;
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

export interface DatabaseMonetaryValueField extends DatabaseBaseField {
  kind: DatabaseFieldKind.MonetaryValue;
}

export enum DatabaseFieldKind {
  String = 'string',
  DateTime = 'datetime',
  Enum = 'enum',
  ID = 'id',
  Number = 'number',
  Boolean = 'boolean',
  MonetaryValue = 'monetary_value',
}

export enum DatabaseFieldStorageMode {
  Normal = 'normal',
  Embedded = 'embedded',
}

export enum DatabaseRelatedEntity {
  CRMCompany = 'crm_company',
  CRMContact = 'crm_contact',
  CRMDeal = 'crm_deal',
  UserManagementUserIdentity = 'user_management_user_identity',
  WorkspaceMember = 'workspace_member',
}

export type DatabaseField =
  | DatabaseStringField
  | DatabaseDateTimeField
  | DatabaseEnumField
  | DatabaseIDField
  | DatabaseNumberField
  | DatabaseBooleanField
  | DatabaseMonetaryValueField;

export interface DatabaseFilter {
  field: string;
  operator: DatabaseFilterOperator;
  value: string | '@anzu_current_workspace_member';
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

export interface DatabaseGroupBy {
  // stored: field to group by
  field: string;

  // state: current group, null for no assigned group, undefined for all groups
  currentGroup?: string | null;
}

export interface DatabaseMonetaryValue {
  value: number;
  currency: Currency;
}

export interface PaginationArgs {
  // values in here are state-only (no value of storing them in the database)
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

export interface PaginatedResult<T> {
  data: T[];
  pageInfo: PageInfo;
}

export interface DatabaseSchema {
  allowedViewLayouts?: DatabaseViewLayout[];
  fields: DatabaseField[];
}

export interface DatabaseSearch {
  value: string;
}

export interface DatabaseSort {
  field: string;
  direction: DatabaseSortDirection;
}

export enum DatabaseSortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

export interface DatabaseViewFieldConfig {
  name: string;
  isHidden?: boolean;
}

export interface DatabaseViewBase {
  kind: DatabaseViewKind;
  layout: DatabaseViewLayout;
  name: string;
  is_system: boolean;
  is_public: boolean;

  filters: DatabaseFilter[];
  sort: DatabaseSort | null;

  fields: DatabaseViewFieldConfig[];

  // TODO re-check if pagination should actually be stored in the view,
  // TODO we may want page size but don't care about cursor values in stored views
  pagination: PaginationArgs | null;
  group_by: DatabaseGroupBy | null;
}

export interface DatabaseTableView extends DatabaseViewBase {
  layout: DatabaseViewLayout.Table;
  pagination: PaginationArgs | null;

  // TODO may allow grouping on table view in the future
  group_by: null;
}

export interface DatabaseBoardView extends DatabaseViewBase {
  layout: DatabaseViewLayout.Board;
  pagination: null;
  group_by: DatabaseGroupBy | null;
}

export interface ParagraphNode {
  kind: RichTextNodeKind.Paragraph;
  content: TextNode[];
}

export interface TextNode {
  kind: RichTextNodeKind.Text;
  content: string;
}

export interface RootNode {
  kind: RichTextNodeKind.Root;
  version: string;
  content: ContentNode[];
}

export interface ICRMComment {
  id: string;
  environment: string;
  kind: CRMCommentKind;

  company: string | null;
  contact: string | null;
  deal: string | null;
  notes: string | null;

  reply_to: string | null;

  created_by: string;
  created_at: string;
  updated_at: string | null;

  content: RootNode;
}

export interface CRMCommentCreatedEvent extends IEvent<EventKind.CRMCommentCreated> {
  payload: {
    id: string;
    kind: CRMCommentKind;
    company: string | null;
    contact: string | null;
    deal: string | null;
    notes: string | null;
    reply_to: string | null;
    created_by: string;
    content: RootNode;
  };
  resource: EventResource<EventResourceKind.CRMComment>;
}

export enum RichTextNodeKind {
  Paragraph = 'paragraph',
  Text = 'text',
  Root = 'root',
}

export enum CRMCommentKind {
  Company = 'company',
  Contact = 'contact',
  Deal = 'deal',
  Notes = 'notes',
}

export type ContentNode = ParagraphNode;

export interface ICRMCompany {
  id: string;
  environment: string;

  name: string;
  description: string | null;
  domain: string | null;
  industry: string | null;
  number_of_employees: number | null;
  annual_revenue: DatabaseMonetaryValue | null;
  linkedin_url: string | null;
  timezone: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;

  created_at: string;
  updated_at: string | null;

  stage: string | null;
  assigned_to: string | null;

  // we should flatten properties on the contact object
  // so that fetching and updating happens on one layer
  // and there's no different between "immediate" and "nested" properties
  // properties: Record<string, unknown>;
}

export interface CRMCompanyCreatedEvent extends IEvent<EventKind.CRMCompanyCreated> {
  payload: {
    id: string;
    name: string;
    description: string | null;
    domain: string | null;
    industry: string | null;
    number_of_employees: number | null;
    annual_revenue: DatabaseMonetaryValue | null;
    linkedin_url: string | null;
    timezone: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    stage: string | null;
    assigned_to: string | null;
  };
  resource: EventResource<EventResourceKind.CRMCompany>;
}

export interface CRMCompanyAssignedEvent extends IEvent<EventKind.CRMCompanyAssigned> {
  payload: {
    from: string | null;
    to: string;
  };
  resource: EventResource<EventResourceKind.CRMCompany>;
}

export interface CRMCompanyUnassignedEvent extends IEvent<EventKind.CRMCompanyUnassigned> {
  payload: {
    from: string;
  };
  resource: EventResource<EventResourceKind.CRMCompany>;
}

export interface ICRMContact {
  environment: string;
  id: string;

  company: string | null;
  job_title: string | null;

  // COMPUTED
  name: string;

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

  source: string | null;
  referrer: string | null;

  linkedin_url: string | null;

  // we should flatten properties on the contact object
  // so that fetching and updating happens on one layer
  // and there's no different between "immediate" and "nested" properties
  // properties: Record<string, unknown>;
}

export interface CRMContactCreatedEvent extends IEvent<EventKind.CRMContactCreated> {
  payload: {
    id: string;
    company?: string | null;
    email?: string | null;
    phone_number?: string | null;
    job_title?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    full_name?: string | null;
    user_identity?: string | null;
    lead_status?: string | null;
    stage?: string | null;
    assigned_to?: string | null;
    source?: string | null;
    referrer?: string | null;
  };
  resource: EventResource<EventResourceKind.CRMContact>;
}

export interface CRMContactAssignedEvent extends IEvent<EventKind.CRMContactAssigned> {
  payload: {
    from: string | null;
    to: string;
  };
  resource: EventResource<EventResourceKind.CRMContact>;
}

export interface CRMContactUnassignedEvent extends IEvent<EventKind.CRMContactUnassigned> {
  payload: {
    from: string;
  };
  resource: EventResource<EventResourceKind.CRMContact>;
}

export interface ICRMDealPipeline {
  id: string;
  environment: string;

  name: string;
  description: string | null;

  stages: DatabaseEnumValue[];

  created_at: string;
  updated_at: string | null;
}

export interface ICRMDeal {
  id: string;
  environment: string;

  pipeline: string;

  name: string;
  description: string | null;

  company: string | null;
  contact: string | null;
  kind: string | null;
  stage: string;
  priority: string | null;
  value: DatabaseMonetaryValue | null;

  created_at: string;
  updated_at: string | null;
  closed_at: string | null;

  assigned_to: string | null;

  // we should flatten properties on the contact object
  // so that fetching and updating happens on one layer
  // and there's no different between "immediate" and "nested" properties
  // properties: Record<string, unknown>;
}

export interface CRMDealCreatedEvent extends IEvent<EventKind.CRMDealCreated> {
  payload: {
    id: string;
    name: string;
    description: string | null;
    company: string | null;
    contact: string | null;
    kind: string | null;
    stage: string;
    priority: string | null;
    value: DatabaseMonetaryValue | null;
    closed_at: string | null;
    assigned_to: string | null;
  };
  resource: EventResource<EventResourceKind.CRMDeal>;
}

export interface CRMDealAssignedEvent extends IEvent<EventKind.CRMDealAssigned> {
  payload: {
    from: string | null;
    to: string;
  };
  resource: EventResource<EventResourceKind.CRMDeal>;
}

export interface CRMDealUnassignedEvent extends IEvent<EventKind.CRMDealUnassigned> {
  payload: {
    from: string;
  };
  resource: EventResource<EventResourceKind.CRMDeal>;
}

export interface CRMEnvironmentConfig {
  environment: string;
  workspace: string;

  contact_schema: DatabaseSchema;
  company_schema: DatabaseSchema;
  deal_schema: DatabaseSchema;
  notes_schema: Record<CRMNotesKind, DatabaseSchema>;

  created_at: string;
  updated_at: string | null;
}

export interface CRMConfigResp {
  config: CRMEnvironmentConfig;
}

export interface ICRMNotes {
  id: string;
  environment: string;

  kind: CRMNotesKind;

  title: string;

  primary_resource: CRMNotesPrimaryResource;
  company: string | null;
  contact: string | null;
  deal: string | null;

  created_at: string;
  updated_at: string | null;

  created_by: string | null;

  content: RootNode;

  // properties are flattened
  // properties: Record<string, unknown>;
}

export interface CRMNotesCreatedEvent extends IEvent<EventKind.CRMNotesCreated> {
  payload: {
    id: string;
    kind: CRMNotesKind;

    created_at: string;

    content: RootNode;
  };
  resource: EventResource<EventResourceKind.CRMNotes>;
}

export interface CRMNotesUpdatedEvent extends IEvent<EventKind.CRMNotesUpdated> {
  payload: {
    id: string;
    kind: CRMNotesKind;
    content?: RootNode;
    title?: string;
  };
  resource: EventResource<EventResourceKind.CRMNotes>;
}

export enum CRMNotesPrimaryResource {
  Contact = 'contact',
  Company = 'company',
  Deal = 'deal',
}

export enum CRMNotesKind {
  Meeting = 'meeting',
  Call = 'call',
  Email = 'email',
  SMS = 'sms',
  WhatsAppMessage = 'whatsapp_message',
  LinkedInMessage = 'linkedin_message',
  PostalMail = 'postal_mail',
}

export interface InsightsEvent {
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

export interface InsightsTimeRange {
  relative?: InsightsRelativeTimeRange;
  from?: string;
  to?: string;
}

export interface InsightsEventFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface InsightsCountBucket {
  bucket: string;
  count: number;
}

export interface InsightsCategoryCountBucket {
  category: string;
  results: InsightsCountBucket[];
}

export enum InsightsRelativeTimeRange {
  Last24Hours = 'last_24_hours',
  Last7Days = 'last_7_days',
  Last30Days = 'last_30_days',
  Last90Days = 'last_90_days',
}

export interface InsightsEnvironmentConfig {
  environment: string;
  workspace: string;

  allowed_origins: string[];

  created_at: string;
  updated_at: string | null;
}

export interface InsightsConfigResp {
  config: InsightsEnvironmentConfig;
  scriptUrl: string;
}

export interface InsightsSchemaResp {
  insightsEventFilterableFields: Array<{
    name: string;
    displayName: string;
    type: string;
  }>;
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

export interface IUserManagementEventUserIdentityCreated extends IEvent<EventKind.UserIdentityCreated> {
  payload: {
    provisionedWith: ProvisionedWith;
    isSecondaryIdentity?: boolean;
    identity: {
      id: string;
      email?: string;
      provider: AuthProviderKind;
      fullName?: string;
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

  // COMPUTED
  name: string;

  email: string | null;
  full_name: string | null;
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
