import type { IdType, ViewerType } from '@/types/navigation'
import type { FieldConfig, ViewerFieldMapping } from '@/config/navigation-field-registry'

/**
 * FieldRegistry
 * - Manages field-level configuration for the Navigation System
 * - Replaces hard-coded field rendering logic in viewers
 * - Inspired by Kafka Event Registry pattern
 */
class FieldRegistryClass {
  private fields = new Map<string, FieldConfig>() // fieldName → config
  private idTypeToField = new Map<IdType, FieldConfig>() // idType → config
  private viewerMappings = new Map<ViewerType, ViewerFieldMapping>()

  /**
   * Register a field configuration
   */
  registerField(config: FieldConfig) {
    this.fields.set(config.fieldName, config)
    this.idTypeToField.set(config.idType, config)
  }

  /**
   * Register viewer field mapping
   */
  registerViewerMapping(mapping: ViewerFieldMapping) {
    this.viewerMappings.set(mapping.viewerType, mapping)
  }

  /**
   * Get field config by field name
   */
  getFieldByName(fieldName: string): FieldConfig | undefined {
    return this.fields.get(fieldName)
  }

  /**
   * Get field config by ID type
   */
  getFieldByIdType(idType: IdType): FieldConfig | undefined {
    return this.idTypeToField.get(idType)
  }

  /**
   * Get all fields that should be displayed in a viewer
   * - Returns fields in display order
   * - Filters out excluded fields
   * - Skips optional fields not present in data
   */
  getFieldsForViewer(viewerType: ViewerType, data: any): FieldConfig[] {
    const mapping = this.viewerMappings.get(viewerType)
    if (!mapping) return []

    const fields: FieldConfig[] = []

    for (const fieldName of mapping.fields) {
      const config = this.fields.get(fieldName)
      if (!config) continue

      // Skip if excluded
      if (mapping.excludeFields?.includes(fieldName)) continue

      // Skip if optional and not present in data
      if (config.optional && !data[fieldName]) continue

      fields.push(config)
    }

    // Sort by display order
    return fields.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  /**
   * Infer ViewerType from IdType
   * - Replaces hard-coded switch statement in Navigable.tsx
   */
  inferViewerType(idType: IdType): ViewerType | undefined {
    const config = this.idTypeToField.get(idType)
    return config?.viewerType
  }

  /**
   * Get service for IdType
   * - Replaces hard-coded switch statement in Navigable.tsx
   */
  getServiceForIdType(idType: IdType): 'payment' | 'gateway' | 'ecommerce' | undefined {
    const config = this.idTypeToField.get(idType)
    return config?.service
  }

  /**
   * Get label for IdType
   * - Ensures consistent labeling across all viewers
   */
  getLabelForIdType(idType: IdType): string {
    const config = this.idTypeToField.get(idType)
    return config?.label || idType
  }

  /**
   * Get all registered field names (for debugging)
   */
  getAllFieldNames(): string[] {
    return Array.from(this.fields.keys())
  }

  /**
   * Get all registered ID types (for debugging)
   */
  getAllIdTypes(): IdType[] {
    return Array.from(this.idTypeToField.keys())
  }
}

export const FieldRegistry = new FieldRegistryClass()
