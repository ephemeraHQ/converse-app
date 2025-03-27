import { useEffect } from "react"
import { getRandomId } from "./general"
import logger from "./logger"

const timestamps: { [timestampId: string]: { start: number; last: number } } = {}

export const debugTimeSpent = ({
  start,
  noReset,
  actionToLog,
  id,
}: {
  start?: boolean
  noReset?: boolean
  actionToLog?: string
  id?: string
}) => {
  const now = new Date().getTime()
  const timestampId = id || "DEFAULT_TIMESTAMP"
  if (start) {
    logger.debug("\n")
  }
  if (!(timestampId in timestamps) || start) {
    timestamps[timestampId] = { start: now, last: now }
  }
  if (actionToLog) {
    const timeSpentSinceLast = (now - timestamps[timestampId].last) / 1000
    const timeSpentSinceStart = (now - timestamps[timestampId].start) / 1000
    logger.debug(
      `    ⌛  [${timestampId}] “${actionToLog}” took ${timeSpentSinceLast} seconds (since start: ${timeSpentSinceStart} seconds)`,
    )
  }
  if (!noReset) {
    timestamps[timestampId].last = now
    if (!actionToLog) {
      logger.debug(`    ⌛  [${timestampId}] timestamp reset`)
    }
  }
}

const componentRenderCount: {
  [componentName: string]: { total: number; byId: { [id: string]: number } }
} = {}

export const useLogRenderCount = (componentName: string, id: string) => {
  useEffect(() => {
    componentRenderCount[componentName] = componentRenderCount[componentName] || {
      total: 0,
      byId: {},
    }
    componentRenderCount[componentName].total += 1
    componentRenderCount[componentName].byId[id] =
      (componentRenderCount[componentName].byId[id] || 0) + 1
    logger.warn(
      `${componentName} rendered - for ${id} ${componentRenderCount[componentName].byId[id]} - total ${componentRenderCount[componentName].total}`,
    )
  })
}

export const componentKeyDebug = () => {
  return {
    key: getRandomId(),
  }
}
