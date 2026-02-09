import type { TopologyResponse, TraceContext } from '@/types/topology'
import { TopologyWorldItem } from './items/TopologyWorldItem.tsx'
import { ServiceItem } from './items/ServiceItem.tsx'
import { PublisherItem } from './items/PublisherItem.tsx'
import { ConsumerItem } from './items/ConsumerItem.tsx'
import { TopicItem } from './items/TopicItem.tsx'
import { EventItem } from './items/EventItem.tsx'

/**
 * 토폴로지 월드
 * - 모든 렌더링 가능한 아이템들을 관리
 * - TopologyResponse 데이터로부터 아이템들을 생성
 */
export class TopologyWorld {
  private items: TopologyWorldItem[] = []

  constructor(topology: TopologyResponse, traceContext?: TraceContext) {
    this.buildItems(topology, traceContext)
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

        // Publisher의 이벤트들
        pub.events.forEach((eventName) => {
          items.push(
            new EventItem(
              eventName,
              publisherItem.getId(),
              pub.topic,
              service.serviceName, // ownerService
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

        // Consumer의 이벤트들
        sub.events.forEach((eventName) => {
          const ownerService = topicOwnerMap.get(sub.topic) || 'unknown'
          items.push(
            new EventItem(
              eventName,
              consumerItem.getId(),
              sub.topic,
              ownerService, // 토픽의 발행자 서비스
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
    })

    this.items = items
  }
}
