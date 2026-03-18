/**
 * Topology API Types
 * - notification-service의 GET /api/topology 응답
 */

export interface TopologyResponse {
  services: EventRegistryResponse[]
}

export interface EventRegistryResponse {
  serviceName: string
  subscribes: TopicSubscription[]
  publishes: TopicPublication[]
}

export interface TopicSubscription {
  topic: string
  events: string[]
}

export interface TopicPublication {
  topic: string
  events: string[]
}

/**
 * Trace Context
 * - 특정 Trace와 관련된 서비스/토픽 필터링용
 */
export interface TraceContext {
  traceId: string
  involvedServices: Set<string>
  involvedTopics: Set<string>
}
