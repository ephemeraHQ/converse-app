import React, { ComponentType, useEffect } from "react"

export const withRenderTime = <P extends object>(
  WrappedComponent: ComponentType<P>,
  name: string,
): ComponentType<P> => {
  return (props: P) => {
    const start = performance.now()

    useEffect(() => {
      const end = performance.now()
      console.log(`${name} render time: ${end - start} ms`)
    })

    return <WrappedComponent {...props} />
  }
}
