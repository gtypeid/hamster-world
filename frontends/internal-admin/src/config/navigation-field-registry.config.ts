import type { FieldRegistryConfig } from './navigation-field-registry'

/**
 * Navigation Field Registry Configuration
 * - Single source of truth for all field rendering logic
 * - Inspired by Kafka Event Registry pattern from backend
 *
 * @see /Users/mac/IdeaProjects/hamster-world/common/src/main/kotlin/com/hamsterworld/common/web/kafka/EventRegistryProperties.kt
 * @see /Users/mac/IdeaProjects/hamster-world/ecommerce-service/src/main/resources/kafka-event-registry.yml
 */
export const FIELD_REGISTRY_CONFIG: FieldRegistryConfig = {
  // ===== FIELD DEFINITIONS =====
  fields: [
    // ==================== Gateway Service ====================
    {
      idType: 'process-id',
      fieldName: 'publicId',
      label: 'Process ID',
      viewerType: 'process-detail',
      service: 'gateway',
      optional: false,
      displayOrder: 100,
      format: 'nanoid',
    },
    {
      idType: 'gateway-payment-id',
      fieldName: 'gatewayPaymentPublicId',
      label: 'Gateway Payment ID',
      viewerType: 'gateway-payment-detail',
      service: 'gateway',
      optional: true,
      displayOrder: 110,
      format: 'nanoid',
    },
    {
      idType: 'event-id',
      fieldName: 'eventId',
      label: 'Event ID',
      viewerType: 'event-timeline',
      service: 'gateway',
      optional: true,
      displayOrder: 120,
      format: 'uuid',
    },
    {
      idType: 'trace-id',
      fieldName: 'traceId',
      label: 'Trace ID',
      viewerType: 'trace-timeline',
      service: 'gateway',
      optional: true,
      displayOrder: 130,
      format: 'uuid',
    },

    // ==================== Payment Service ====================
    {
      idType: 'payment-id',
      fieldName: 'paymentPublicId',
      label: 'Payment ID',
      viewerType: 'payment-detail',
      service: 'payment',
      optional: false,
      displayOrder: 200,
      format: 'nanoid',
    },
    {
      idType: 'product-id',
      fieldName: 'publicId',
      label: 'Product ID',
      viewerType: 'product-detail',
      service: 'payment',
      optional: false,
      displayOrder: 210,
      format: 'nanoid',
    },

    // ==================== Ecommerce Service ====================
    {
      idType: 'order-id',
      fieldName: 'orderPublicId',
      label: 'Order ID',
      viewerType: 'order-detail',
      service: 'ecommerce',
      optional: false,
      displayOrder: 300,
      format: 'nanoid',
    },
    {
      idType: 'user-id',
      fieldName: 'userPublicId',
      label: 'User ID',
      viewerType: 'user-detail',
      service: 'ecommerce',
      optional: true,
      displayOrder: 310,
      format: 'nanoid',
    },
    {
      idType: 'ecommerce-product-id',
      fieldName: 'ecommerceProductId',
      label: 'Ecommerce Product ID',
      viewerType: 'ecommerce-product-detail',
      service: 'ecommerce',
      optional: true,
      displayOrder: 320,
      format: 'nanoid',
    },
  ],

  // ===== VIEWER → FIELD MAPPINGS =====
  viewerMappings: [
    {
      viewerType: 'process-detail',
      fields: ['orderPublicId', 'userPublicId'],
    },
    {
      viewerType: 'gateway-payment-detail',
      fields: ['gatewayPaymentPublicId', 'publicId', 'orderPublicId', 'userPublicId'],
    },
    {
      viewerType: 'payment-detail',
      fields: ['paymentPublicId', 'orderPublicId', 'publicId', 'gatewayPaymentPublicId'],
    },
    {
      viewerType: 'order-detail',
      fields: ['orderPublicId', 'userPublicId', 'gatewayPaymentPublicId'],
    },
    {
      viewerType: 'user-detail',
      fields: ['userPublicId'],
    },
    {
      viewerType: 'product-detail',
      fields: ['publicId', 'ecommerceProductId'],
    },
    {
      viewerType: 'ecommerce-product-detail',
      fields: ['ecommerceProductId'],
    },
  ],
}
