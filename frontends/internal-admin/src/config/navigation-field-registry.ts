import type { IdType, ViewerType } from '@/types/navigation'

/**
 * Field Configuration
 * - Defines how to render a specific ID field in viewers
 * - Inspired by Kafka Event Registry pattern
 */
export interface FieldConfig {
  // Field Identity
  idType: IdType // Type of ID this field represents
  fieldName: string // Property name in API response

  // Display Configuration
  label: string // UI label (e.g., "Process ID:", "Order ID:")
  viewerType: ViewerType // Which viewer to open on click

  // Service Association
  service: 'payment' | 'gateway' | 'ecommerce'

  // Rendering Rules
  optional: boolean // Is this field optional? (affects conditional rendering)
  displayOrder: number // Order in "Related IDs" section
  section?: string // Custom section name (default: "Related IDs")

  // Validation
  format?: 'uuid' | 'nanoid' | 'custom' // ID format validation
}

/**
 * Viewer Field Mapping
 * - Defines which fields each viewer should display
 */
export interface ViewerFieldMapping {
  viewerType: ViewerType
  fields: string[] // Array of fieldNames to display (in order)
  excludeFields?: string[] // Fields to hide even if present in data
}

/**
 * Complete Field Registry Configuration
 */
export interface FieldRegistryConfig {
  fields: FieldConfig[]
  viewerMappings: ViewerFieldMapping[]
}
