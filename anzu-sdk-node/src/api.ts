import { errors } from "./errors";

export namespace api {
  export interface Client {
    mustWorkspace(): void;
    mustEnvironment(): void;

    post: <T>(path: string, body: any) => Promise<T>;
    get: <T>(path: string) => Promise<T>;
    patch: <T>(path: string, body: any) => Promise<T>;
    delete: <T>(path: string) => Promise<T>;
  }

  export interface ClientOptions {
    token: string;

    workspaceId?: string;
    environmentId?: string;

    apiUrl: string;
    version: string;

    abortSignal?: AbortSignal;
  }

  const defaultOptions: ClientOptions = {
    apiUrl: "https://api.anzuhq.com",
    version: "2022.8",
    token: process.env.ANZU_API_TOKEN || "",
  };

  function mergeOptions(
    previous: ClientOptions,
    options: Partial<ClientOptions>
  ) {
    const finalOptions: ClientOptions = {
      apiUrl: options.apiUrl || previous.apiUrl,
      version: options.version || previous.version,
      token: options.token || previous.token,
      abortSignal: options.abortSignal || previous.abortSignal,
      environmentId: options.environmentId || previous.environmentId,
      workspaceId: options.workspaceId || previous.workspaceId,
    };
    if (!finalOptions.token) {
      throw new errors.SDKError(
        "Missing API token",
        errors.ErrorCode.ApiClientMissingToken
      );
    }

    return finalOptions;
  }

  export function createClient(options: Partial<ClientOptions>): Client {
    const finalOptions = mergeOptions(defaultOptions, options);

    const sendRequest = async <T>(
      method: "GET" | "POST" | "PATCH" | "DELETE",
      path: string,
      body?: unknown,
      tempOptions: Partial<ClientOptions> = {}
    ) => {
      const requestLevelOptions = mergeOptions(finalOptions, tempOptions);

      let url = `${requestLevelOptions.apiUrl}/${requestLevelOptions.version}`;

      if (requestLevelOptions.workspaceId) {
        url += `/workspaces/${requestLevelOptions.workspaceId}`;
      }

      if (requestLevelOptions.environmentId) {
        url += `/environments/${requestLevelOptions.environmentId}`;
      }

      url += path;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${requestLevelOptions.token}`,
      };
      let reqBody;
      switch (method) {
        case "POST":
        case "PATCH":
          reqBody = JSON.stringify(body);
          headers["Content-Type"] = "application/json";
          break;
        case "GET":
        case "DELETE":
          if (body) {
            throw new Error("GET and DELETE requests cannot have a body");
          }
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _exhaustiveCheck: never = method;
          break;
      }

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: reqBody ? JSON.stringify(body) : undefined,
          // @ts-ignore
          signal: requestLevelOptions.abortSignal || null,
        });
        return handleResponse<T>(res);
      } catch (err) {
        throw new errors.SDKError(
          err instanceof Error ? err.message : (err as any),
          errors.ErrorCode.ApiClientRequestFailed
        );
      }
    };

    const client: Client = {
      post: <T>(path: string, body: any) => sendRequest<T>("POST", path, body),
      get: <T>(path: string) => sendRequest<T>("GET", path),
      patch: <T>(path: string, body: any) =>
        sendRequest<T>("PATCH", path, body),
      delete: <T>(path: string) => sendRequest<T>("DELETE", path),
      mustWorkspace() {
        if (!finalOptions.workspaceId) {
          throw new errors.SDKError(
            "Missing workspace ID",
            errors.ErrorCode.ApiClientMissingWorkspaceId
          );
        }
      },
      mustEnvironment() {
        if (!finalOptions.environmentId) {
          throw new errors.SDKError(
            "Missing environment ID",
            errors.ErrorCode.ApiClientMissingEnvironmentId
          );
        }
      },
    };

    return client;
  }

  async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let body;
      try {
        body = await res.json();
      } catch (err) {
        throw new ApiError(null, "Failed to fetch, invalid body", res);
      }

      if ("error" in body && "code" in body.error && "message" in body.error) {
        throw new ApiError(body.error.code, body.error.message, res);
      }

      throw new ApiError(null, "Failed to fetch, missing error", res);
    }

    const body: T = await res.json();
    return body;
  }

  export class ApiError extends Error {
    constructor(
      public code: string | null,
      message: string,
      public response: Response
    ) {
      super(message);
      this.name = "ApiError";
    }
  }
}
