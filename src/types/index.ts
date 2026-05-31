export type OrderStatus =
  | 'payment_pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'closed';

export interface OrderItem {
  product_id: string;
  seller_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  zip: string;
}

export interface CreateOrderPayload {
  buyer_id: string;
  store_id: string;
  items: OrderItem[];
  delivery_address: DeliveryAddress;
  delivery_cost: number;
  quote_id: string;
  quote_estimated_minutes: number;
}

export interface Order {
  order_id: string;
  buyer_id: string;
  store_id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_cost: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  items_snapshot: OrderItem[];
  delivery_address_snapshot: DeliveryAddress;
  created_at: string;
  updated_at: string;
}

export interface DeliveryQuote {
  quote_id: string;
  cost: number;
  estimated_minutes: number;
}

export interface ApiError {
  error: string;
}
