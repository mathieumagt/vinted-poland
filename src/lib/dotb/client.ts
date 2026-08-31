import {
  DotbApiError,
  type DotbAccountsResponse,
  type DotbErrorResponse,
  type DotbNormalizedStatus,
  type DotbOrder,
  type DotbOrdersListResponse,
} from "./types";

const BASE_URL = "https://dotb.io/api/public/v1";
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getToken(): string {
  const token = process.env.DOTB_API_TOKEN;
  if (!token) {
    throw new Error("DOTB_API_TOKEN env var is not set");
  }
  return token;
}

async function request<T>(path: string, init?: RequestInit, attempt = 1): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (res.status === 429 && attempt <= MAX_RETRIES) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt;
    await sleep(delayMs);
    return request<T>(path, init, attempt + 1);
  }

  if (!res.ok) {
    let body: DotbErrorResponse | null = null;
    try {
      body = (await res.json()) as DotbErrorResponse;
    } catch {
      // response body wasn't JSON — leave body null, fall back to status text
    }
    throw new DotbApiError(res.status, body, res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listAccounts(): Promise<DotbAccountsResponse> {
  return request<DotbAccountsResponse>("/accounts");
}

export type ListOrdersParams = {
  accountId?: string;
  status?: DotbNormalizedStatus;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
  include?: Array<"items" | "buyer" | "account">;
  sort?: "order_date" | "shipping_deadline_date";
};

export function listOrders(params: ListOrdersParams = {}): Promise<DotbOrdersListResponse> {
  const search = new URLSearchParams();
  if (params.accountId) search.set("account_id", params.accountId);
  if (params.status) search.set("status", params.status);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.include?.length) search.set("include", params.include.join(","));
  if (params.sort) search.set("sort", params.sort);

  const query = search.toString();
  return request<DotbOrdersListResponse>(`/orders${query ? `?${query}` : ""}`);
}

export function getOrder(id: string, include?: Array<"items" | "buyer" | "account">): Promise<DotbOrder> {
  const query = include?.length ? `?include=${include.join(",")}` : "";
  return request<DotbOrder>(`/orders/${id}${query}`);
}

export function orderShippingLabel(
  id: string,
  labelType: "printable" | "digital" = "printable"
): Promise<{ label_ready: boolean; label_type: string | null; order: DotbOrder }> {
  return request(`/orders/${id}/shipping-label`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label_type: labelType }),
  });
}

export function packOrder(id: string): Promise<DotbOrder> {
  return request<DotbOrder>(`/orders/${id}/pack`, { method: "POST" });
}

export { DotbApiError };
