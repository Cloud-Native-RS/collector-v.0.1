import * as React from 'react'
import { useContainerSize } from '../hooks/use-container-size'

interface MeasuredContainerProps<T extends React.ElementType> {
  as: T
  name: string
  children?: React.ReactNode
}

export const MeasuredContainer = React.forwardRef(
  <T extends React.ElementType>(
    { as: Component, name, children, style = {}, className, ...props }: MeasuredContainerProps<T> & React.ComponentProps<T>,
    ref: React.Ref<HTMLElement>
  ) => {
    const innerRef = React.useRef<HTMLElement>(null)
    const rect = useContainerSize(innerRef.current)

    React.useImperativeHandle(ref, () => innerRef.current as HTMLElement)

    const customStyle = {
      [`--${name}-width`]: `${rect.width}px`,
      [`--${name}-height`]: `${rect.height}px`
    }

    // Only pass DOM-valid props (className, style, id, data-*, aria-*, etc.)
    // Filter out any editor-specific props that shouldn't be on the DOM
    const domProps: Record<string, any> = {}
    for (const [key, value] of Object.entries(props)) {
      // Allow only standard DOM attributes
      if (
        key.startsWith('data-') ||
        key.startsWith('aria-') ||
        ['id', 'title', 'role', 'tabIndex'].includes(key)
      ) {
        domProps[key] = value
      }
    }

    return (
      <Component {...domProps} className={className} ref={innerRef} style={{ ...customStyle, ...style }}>
        {children}
      </Component>
    )
  }
)

MeasuredContainer.displayName = 'MeasuredContainer'
