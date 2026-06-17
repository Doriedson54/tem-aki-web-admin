import api from "./api";
import type { BusinessEventType } from "../types";

type TrackBusinessEventPayload = {
  business_id: string;
  event_type: BusinessEventType;
  source: string;
  metadata?: Record<string, unknown>;
};

export async function trackBusinessEvent(payload: TrackBusinessEventPayload): Promise<void> {
  try {
    await api.post("/business-events", {
      business_id: payload.business_id,
      event_type: payload.event_type,
      source: payload.source,
      metadata: payload.metadata || {},
    });
  } catch (error) {
    console.error("Falha ao registrar evento de negocio", error);
  }
}
