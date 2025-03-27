import { useEffect, useState } from "react"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { storage } from "@/utils/storage/storage"

export const usePersistState = (key: string) => {
  // Initialize state directly from storage
  const [state, setState] = useState<string | undefined>(() => {
    try {
      return storage.getString(key) || undefined
    } catch (error) {
      captureError(new GenericError({ error }))
      return undefined
    }
  })

  // Track if we've completed the initial load
  const [isLoaded, setIsLoaded] = useState(false)

  // Set isLoaded after the first render
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const setValue = (newValue: string) => {
    try {
      storage.set(key, newValue)
      setState(newValue)
    } catch (error) {
      captureError(new GenericError({ error }))
    }
  }

  const removeValue = () => {
    try {
      storage.delete(key)
      setState(undefined)
    } catch (error) {
      captureError(new GenericError({ error }))
    }
  }

  return {
    value: state,
    setValue,
    removeValue,
    isLoaded,
  }
}
