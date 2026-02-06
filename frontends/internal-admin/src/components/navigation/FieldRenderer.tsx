import { FieldRegistry } from './registry/FieldRegistry'
import { Navigable } from './Navigable'
import type { ViewerType } from '@/types/navigation'

interface FieldRendererProps {
  viewerType: ViewerType
  data: any
}

/**
 * FieldRenderer
 * - Generic component for rendering ID fields in viewers
 * - Replaces 150+ lines of duplicate field rendering code across all viewers
 * - Uses FieldRegistry to determine which fields to display
 * - Ensures consistent labels and navigation behavior
 *
 * Usage:
 * ```tsx
 * <FieldRenderer viewerType="process-detail" data={detail.process} />
 * ```
 */
export function FieldRenderer({ viewerType, data }: FieldRendererProps) {
  const fields = FieldRegistry.getFieldsForViewer(viewerType, data)

  // No fields to display
  if (fields.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h4 className="text-lg font-bold text-hamster-brown mb-4">🔗 관련 ID</h4>
      <div className="space-y-2 text-sm font-mono">
        {fields.map((field) => {
          const value = data[field.fieldName]

          // Skip if no value (shouldn't happen due to getFieldsForViewer filtering, but safety check)
          if (!value) return null

          return (
            <div
              key={field.fieldName}
              className="flex items-center gap-3 bg-gray-50 p-2 rounded"
            >
              <span className="text-gray-500 flex-shrink-0">{field.label}:</span>
              <Navigable id={value} type={field.idType} viewerType={field.viewerType} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
