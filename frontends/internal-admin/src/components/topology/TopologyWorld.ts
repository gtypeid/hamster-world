import type { TopologyResponse, TraceContext } from '@/types/topology'
import type { TopologyTraceContext } from '@/types/topologyTraceContext'
import { TopologyWorldItem } from './items/TopologyWorldItem.tsx'
import { ServiceItem } from './items/ServiceItem.tsx'
import { PublisherItem } from './items/PublisherItem.tsx'
import { ConsumerItem } from './items/ConsumerItem.tsx'
import { TopicItem } from './items/TopicItem.tsx'
import { EventItem } from './items/EventItem.tsx'
import { EdgeRelationItem } from './items/EdgeRelationItem.tsx'
import { RootEntryPointItem } from './items/RootEntryPointItem.tsx'
import { StatusIndicatorItem } from './items/StatusIndicatorItem.tsx'
import { EventSuccessIndicatorItem } from './items/EventSuccessIndicatorItem.tsx'
import { EventFailureIndicatorItem } from './items/EventFailureIndicatorItem.tsx'

/**
 * 토폴로지 월드
 * - 모든 렌더링 가능한 아이템들을 관리
 * - TopologyResponse 데이터로부터 아이템들을 생성
 */
export class TopologyWorld {
  private items: TopologyWorldItem[] = []
  private eventMode: 'single' | 'multi' = 'multi'
  private topologyTraceContext?: TopologyTraceContext

  constructor(
    topology: TopologyResponse,
    eventMode: 'single' | 'multi' = 'multi',
    traceContext?: TraceContext,
    topologyTraceContext?: TopologyTraceContext
  ) {
    this.eventMode = eventMode
    this.topologyTraceContext = topologyTraceContext
    this.buildItems(topology, traceContext)
  }

  setEventMode(mode: 'single' | 'multi'): void {
    this.eventMode = mode
    // TopologyResponse가 있다면 다시 빌드
    // (현재는 TopologyViewer에서 eventMode 변경 시 world를 새로 생성하므로 필요 없음)
  }

  /**
   * 모든 아이템 반환
   */
  getItems(): TopologyWorldItem[] {
    return this.items
  }

  /**
   * 특정 타입의 아이템만 필터링
   */
  getItemsByType<T extends TopologyWorldItem>(type: new (...args: any[]) => T): T[] {
    return this.items.filter((item) => item instanceof type) as T[]
  }

  /**
   * TopologyResponse로부터 아이템들 생성
   */
  private buildItems(topology: TopologyResponse, traceContext?: TraceContext) {
    const items: TopologyWorldItem[] = []

    // Publisher, Consumer ID 맵핑 (TopicItem에서 필요)
    const topicPublishers = new Map<string, { serviceName: string; publisherId: string }[]>()
    const topicConsumers = new Map<string, { serviceName: string; consumerId: string }[]>()

    // 토픽 → 발행 서비스 맵핑 (EventItem의 ownerService 결정용)
    const topicOwnerMap = new Map<string, string>()
    topology.services.forEach((service) => {
      service.publishes.forEach((pub) => {
        topicOwnerMap.set(pub.topic, service.serviceName)
      })
    })

    // 1. 서비스별 아이템 생성
    topology.services.forEach((service) => {
      // 서비스 노드
      items.push(ServiceItem.fromTopologyData(service.serviceName, traceContext))

      // Publisher 노드들
      service.publishes.forEach((pub) => {
        const publisherItem = new PublisherItem(service.serviceName, pub.topic, traceContext)
        items.push(publisherItem)

        // Topic 연결을 위한 매핑 저장
        if (!topicPublishers.has(pub.topic)) {
          topicPublishers.set(pub.topic, [])
        }
        topicPublishers.get(pub.topic)!.push({
          serviceName: service.serviceName,
          publisherId: publisherItem.getId(),
        })

        // Service → Publisher 엣지
        items.push(
          new EdgeRelationItem('service-publisher', `service-${service.serviceName}`, publisherItem.getId(), traceContext)
        )

        // Publisher의 이벤트들
        pub.events.forEach((eventName) => {
          // 이 Topic을 구독하는 모든 Consumer ID 찾기 (나중에 할당)
          const subscribingConsumerIds: string[] = []
          items.push(
            new EventItem(
              eventName,
              publisherItem.getId(),
              pub.topic,
              service.serviceName, // ownerService
              subscribingConsumerIds,
              traceContext
            )
          )
        })
      })

      // Consumer 노드들
      service.subscribes.forEach((sub) => {
        const consumerItem = new ConsumerItem(service.serviceName, sub.topic, traceContext)
        items.push(consumerItem)

        // Topic 연결을 위한 매핑 저장
        if (!topicConsumers.has(sub.topic)) {
          topicConsumers.set(sub.topic, [])
        }
        topicConsumers.get(sub.topic)!.push({
          serviceName: service.serviceName,
          consumerId: consumerItem.getId(),
        })

        // Consumer → Service 엣지
        items.push(
          new EdgeRelationItem('consumer-service', consumerItem.getId(), `service-${service.serviceName}`, traceContext)
        )

        // Consumer의 이벤트들 (항상 생성, render()에서 mode 처리)
        sub.events.forEach((eventName) => {
          const ownerService = topicOwnerMap.get(sub.topic) || 'unknown'
          items.push(
            new EventItem(
              eventName,
              consumerItem.getId(),
              sub.topic,
              ownerService, // 토픽의 발행자 서비스
              [],
              traceContext
            )
          )
        })
      })
    })

    // 2. 토픽 노드 생성
    const allTopics = new Set<string>()
    topology.services.forEach((service) => {
      service.publishes.forEach((pub) => allTopics.add(pub.topic))
      service.subscribes.forEach((sub) => allTopics.add(sub.topic))
    })

    allTopics.forEach((topic) => {
      const publishers = topicPublishers.get(topic) || []
      const consumers = topicConsumers.get(topic) || []
      items.push(new TopicItem(topic, publishers, consumers, traceContext))

      // Publisher → Topic 엣지
      publishers.forEach(({ publisherId }) => {
        items.push(
          new EdgeRelationItem('publisher-topic', publisherId, `topic-${topic}`, traceContext)
        )
      })

      // Topic → Consumer 엣지
      consumers.forEach(({ consumerId }) => {
        items.push(
          new EdgeRelationItem('topic-consumer', `topic-${topic}`, consumerId, traceContext)
        )
      })
    })

    // Event → Consumer 정보 할당
    const publisherEventItems = items.filter(
      (item) => item instanceof EventItem && (item as EventItem).isOwnedByPublisher()
    ) as EventItem[]
    publisherEventItems.forEach((eventItem) => {
      const topic = (eventItem as any).topic
      const eventName = (eventItem as any).eventName
      // Publisher Event → Event 엣지 생성 (publisher-event, 항상)
      items.push(
        new EdgeRelationItem('publisher-event', (eventItem as any).parentId, eventItem.getId(), traceContext)
      )

      // Event → Consumer Node 엣지 생성 (event-consumer)
      // multi mode: 체인 구조로 연결 (각 Event에서 1개 엣지만)
      if (this.eventMode === 'multi') {
        // 이 토픽을 구독하는 모든 Consumer Node 찾기
        const consumerNodes = items.filter(
          (item) => item instanceof ConsumerItem &&
            (item as any).topic === topic
        ) as ConsumerItem[]

        // Publisher Event → 첫 번째 Consumer Node (1개 엣지만)
        if (consumerNodes.length > 0) {
          items.push(
            new EdgeRelationItem('event-consumer', eventItem.getId(), consumerNodes[0].getId(), traceContext)
          )
        }

        // 각 Consumer Event → 다음 Consumer Node (체인 구조)
        const consumerEventItems = items.filter(
          (item) => item instanceof EventItem &&
            !(item as EventItem).isOwnedByPublisher() &&
            (item as any).topic === topic &&
            (item as any).eventName === eventName
        ) as EventItem[]

        consumerEventItems.forEach((consumerEventItem, index) => {
          // 같은 순서의 다음 Consumer Node로 연결
          if (index < consumerNodes.length - 1) {
            items.push(
              new EdgeRelationItem('event-consumer', consumerEventItem.getId(), consumerNodes[index + 1].getId(), traceContext)
            )
          }
        })
      }
    })

    // 단일 소스 모드: Consumer → Publisher Event 참조 엣지 생성
    if (this.eventMode === 'single') {
      const consumerEventItems = items.filter(
        (item) => item instanceof EventItem && !(item as EventItem).isOwnedByPublisher()
      ) as EventItem[]
      consumerEventItems.forEach((consumerEventItem) => {
        // Consumer의 parentId = consumer-xxx
        // 해당 Event를 발행하는 Publisher Event ID 계산
        const topic = (consumerEventItem as any).topic
        const eventName = (consumerEventItem as any).eventName
        const ownerService = (consumerEventItem as any).ownerService
        const canonicalEventId = `event-publisher-${ownerService}-${topic}-${eventName}`

        // Consumer → Publisher Event 참조 엣지 (event-consumer로 필터링 가능)
        items.push(
          new EdgeRelationItem('event-consumer', (consumerEventItem as any).parentId, canonicalEventId, traceContext)
        )
      })
    }

    // TopologyTraceContext 기반 마커 아이템 추가
    // - Root Entry Point 커서 (시작점)
    // - Status Indicator 커서 (서비스 단위 성공/실패)
    // - Event Status Indicator 마커 (이벤트 단위 성공/실패)
    if (this.topologyTraceContext) {
      items.push(
        new RootEntryPointItem(this.topologyTraceContext.rootService, traceContext)
      )

      // 실패한 이벤트가 있으면 해당 서비스의 상태 표시
      let failedService: string | undefined
      if (this.topologyTraceContext.traceEventIds && this.topologyTraceContext.traceEventIds.length > 0) {
        const lastEventId = this.topologyTraceContext.traceEventIds[this.topologyTraceContext.traceEventIds.length - 1]

        // 마지막 이벤트 아이템 찾기
        const lastEventItem = items.find(
          (item) => item instanceof EventItem && item.getId() === lastEventId
        ) as EventItem | undefined

        if (lastEventItem) {
          // EventItem의 parentId에서 Consumer/Publisher 아이템을 찾아 serviceName 추출
          const parentId = (lastEventItem as any).parentId

          // Consumer 또는 Publisher 아이템 찾기
          const parentItem = items.find((item) => {
            if (item instanceof ConsumerItem && item.getId() === parentId) return true
            if (item instanceof PublisherItem && item.getId() === parentId) return true
            return false
          })

          if (parentItem instanceof ConsumerItem) {
            failedService = (parentItem as any).serviceName
          } else if (parentItem instanceof PublisherItem) {
            failedService = (parentItem as any).serviceName
          }
        }
      }

      // Status Indicator 커서 (성공/실패)
      if (failedService) {
        items.push(
          new StatusIndicatorItem('failed', failedService, traceContext)
        )
      } else {
        items.push(
          new StatusIndicatorItem('success', 'All Services', traceContext)
        )
      }

      // 이벤트 단위 성공/실패 마커
      // traceEventIds 배열 기반으로 마커 표시
      // - 배열의 마지막 이벤트: 실패 (큰 ❌)
      // - 그 전까지: 성공 (작은 ✅)
      // - 리스트에 없는 이벤트: 마커 없음 (트레이스와 무관)
      if (this.topologyTraceContext.traceEventIds && this.topologyTraceContext.traceEventIds.length > 0) {
        const traceEventIds = this.topologyTraceContext.traceEventIds
        const lastEventId = traceEventIds[traceEventIds.length - 1] // 마지막 = 실패
        const successEventIds = traceEventIds.slice(0, -1) // 그 전까지 = 성공

        // 성공한 이벤트들 (마지막 제외)
        successEventIds.forEach((eventId) => {
          const eventItem = items.find((item) => item instanceof EventItem && item.getId() === eventId)
          if (eventItem) {
            items.push(
              new EventSuccessIndicatorItem(eventId, traceContext)
            )
          }
        })

        // 실패한 이벤트 (마지막)
        const failedEventItem = items.find((item) => item instanceof EventItem && item.getId() === lastEventId)
        if (failedEventItem) {
          items.push(
            new EventFailureIndicatorItem(lastEventId, traceContext)
          )
        }
      }
    }

    this.items = items
  }
}
