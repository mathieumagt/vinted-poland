export type DotbAccount = {
  id: string;
  login: string;
  vinted_id: number;
  country: string | null;
  bridge: {
    connected: boolean;
    last_seen_at: string | null;
  };
};

export type DotbAccountsResponse = {
  data: DotbAccount[];
};

export type DotbNormalizedStatus =
  | "payment_received"
  | "label_ordering"
  | "label_failed"
  | "label_sent"
  | "packed"
  | "shipped"
  | "ready_for_pickup"
  | "delivered"
  | "completed"
  | "returning"
  | "suspended"
  | "cancelled";

export type DotbOrderItem = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  selling_price: string | number | null;
  purchase_price: string | number | null;
  sku: string | null;
  location: string | null;
  catalog_id: string | number | null;
  vinted_id: string | number | null;
  vinted_item_id: string | number | null;
};

export type DotbBuyer = {
  vinted_id: string | number | null;
  login: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
};

export type DotbOrderAccount = {
  id: string;
  login: string;
  vinted_id: number;
  country_code: string | null;
  has_company: boolean;
};

export type DotbOrder = {
  id: string;
  title: string;
  status: string;
  normalized_status: DotbNormalizedStatus;
  order_date: string | null;
  shipping_address: Record<string, unknown> | null;
  shipping_label_url: string | null;
  shipping_deadline_date: string | null;
  carrier_name: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  item_count: number | null;
  vinted_transaction_id: string | number | null;
  vinted_conversation_id: string | number | null;
  note: string | null;
  subtotal: string | number | null;
  shipping: string | number | null;
  currency: string | null;
  payout: string | number | null;
  total_cost: string | number | null;
  status_updated_at: string | null;
  ready_for_pickup_at: string | null;
  items?: DotbOrderItem[];
  buyer?: DotbBuyer;
  account?: DotbOrderAccount;
};

export type DotbOrdersListResponse = {
  data: DotbOrder[];
  has_more: boolean;
  next_cursor: string | null;
};

export type DotbErrorResponse = {
  error: {
    type: string;
    message: string;
    details?: unknown;
    request_id?: string;
  };
};

export class DotbApiError extends Error {
  status: number;
  type?: string;
  details?: unknown;
  requestId?: string;

  constructor(status: number, body: DotbErrorResponse | null, fallbackMessage: string) {
    super(body?.error?.message ?? fallbackMessage);
    this.name = "DotbApiError";
    this.status = status;
    this.type = body?.error?.type;
    this.details = body?.error?.details;
    this.requestId = body?.error?.request_id;
  }
}
