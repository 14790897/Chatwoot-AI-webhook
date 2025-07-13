// Chatwoot Webhook Types
// Based on official Chatwoot webhook documentation

export interface Account {
  id: number;
  name: string;
}

export interface Inbox {
  id: number;
  name: string;
}

export interface Contact {
  id: number;
  name: string;
  avatar?: string;
  type: "contact";
  account: Account;
}

export interface User {
  id: number;
  name: string;
  email: string;
  type: "user";
}

export interface Browser {
  device_name: string;
  browser_name: string;
  platform_name: string;
  browser_version: string;
  platform_version: string;
}

export interface ContactInbox {
  id: number;
  contact_id: number;
  inbox_id: number;
  source_id: string;
  created_at: string;
  updated_at: string;
  hmac_verified: boolean;
}

export interface ConversationMeta {
  sender: Contact;
  assignee?: User;
}

export interface Conversation {
  additional_attributes: {
    browser: Browser;
    referer: string;
    initiated_at: {
      timestamp: string;
    };
  };
  can_reply: boolean;
  channel: string;
  id: number;
  inbox_id: number;
  contact_inbox: ContactInbox;
  messages: Message[];
  meta: ConversationMeta;
  status: string;
  unread_count: number;
  agent_last_seen_at: number;
  contact_last_seen_at: number;
  timestamp: number;
  account_id: number;
  display_id?: number;
}

export interface Message {
  id: number;
  content: string;
  message_type: number | string;
  created_at: number | string;
  private: boolean;
  source_id: string | null;
  content_type: string;
  content_attributes: Record<string, any>;
  sender: {
    type: "contact" | "user";
  } & (Contact | User);
  account: Account;
  conversation: Conversation;
  inbox: Inbox;
}

// Webhook Event Types
export type WebhookEventType = 
  | "conversation_created"
  | "conversation_updated" 
  | "conversation_status_changed"
  | "message_created"
  | "message_updated"
  | "webwidget_triggered"
  | "conversation_typing_on"
  | "conversation_typing_off";

// Base webhook payload structure
export interface BaseWebhookPayload {
  event: WebhookEventType;
}

// Conversation Events
export interface ConversationCreatedPayload extends BaseWebhookPayload {
  event: "conversation_created";
  // Conversation attributes are spread directly
}

export interface ConversationUpdatedPayload extends BaseWebhookPayload {
  event: "conversation_updated";
  changed_attributes: Array<{
    [key: string]: {
      current_value: any;
      previous_value: any;
    };
  }>;
  // Conversation attributes are spread directly
}

export interface ConversationStatusChangedPayload extends BaseWebhookPayload {
  event: "conversation_status_changed";
  // Conversation attributes are spread directly
}

// Message Events
export interface MessageCreatedPayload extends BaseWebhookPayload {
  event: "message_created";
  id: number;
  content: string;
  created_at: string;
  message_type: "incoming" | "outgoing" | "template";
  content_type: "input_select" | "cards" | "form" | "text";
  content_attributes: Record<string, any>;
  source_id: string;
  sender: Contact | User;
  contact: Contact;
  conversation: Conversation;
  account: Account;
}

export interface MessageUpdatedPayload extends BaseWebhookPayload {
  event: "message_updated";
  // Message attributes are spread directly
}

// Widget Events
export interface WebwidgetTriggeredPayload extends BaseWebhookPayload {
  event: "webwidget_triggered";
  id: string;
  contact: Contact;
  inbox: Inbox;
  account: Account;
  current_conversation: Conversation;
  source_id: string;
  event_info: {
    initiated_at: {
      timestamp: string;
    };
    referer: string;
    widget_language: string;
    browser_language: string;
    browser: Browser;
  };
}

// Typing Events
export interface ConversationTypingOnPayload extends BaseWebhookPayload {
  event: "conversation_typing_on";
  conversation: Conversation;
  user: User;
  is_private: boolean;
}

export interface ConversationTypingOffPayload extends BaseWebhookPayload {
  event: "conversation_typing_off";
  conversation: Conversation;
  user: User;
  is_private: boolean;
}

// Union type for all webhook payloads
export type WebhookPayload = 
  | ConversationCreatedPayload
  | ConversationUpdatedPayload
  | ConversationStatusChangedPayload
  | MessageCreatedPayload
  | MessageUpdatedPayload
  | WebwidgetTriggeredPayload
  | ConversationTypingOnPayload
  | ConversationTypingOffPayload;

// AI Configuration
export interface AIConfig {
  aiUrl?: string;
  aiToken?: string;
  systemPrompt: string;
}

// AI Response
export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// Webhook Response
export interface WebhookResponse {
  success: boolean;
  message?: string;
  conversation_id?: number;
  timestamp: string;
  error?: string;
  details?: string;
}
