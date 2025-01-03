"use client"

import { useTooltip } from "@/app/(main)/ClientComponents/detail/TooltipContext"
import { useTranslations } from "next-intl"
import { memo } from "react"

const MapTooltip = memo(function MapTooltip() {
  const { tooltipData } = useTooltip()
  const t = useTranslations("Global")

  if (!tooltipData) return null

  const sortedServers = tooltipData.servers.sort((a, b) => {
    return a.status === b.status ? 0 : a.status ? 1 : -1
  })

  return (
    <div
      className="absolute hidden lg:block bg-white dark:bg-neutral-800 px-2 py-1 rounded shadow-lg text-sm dark:border dark:border-neutral-700 z-50 tooltip-animate"
      key={tooltipData.country}
      style={{
        left: tooltipData.centroid[0],
        top: tooltipData.centroid[1],
        transform: "translate(10%, -50%)",
      }}
      onMouseEnter={(e) => {
        e.stopPropagation()
      }}
    >
      <div>
        <p className="font-medium">
          {tooltipData.country === "China" ? "Mainland China" : tooltipData.country}
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 mb-1">
          {tooltipData.count} {t("Servers")}
        </p>
      </div>
      <div
        className="border-t dark:border-neutral-700 pt-1"
        style={{
          maxHeight: "200px",
          overflowY: "auto",
        }}
      >
        {sortedServers.map((server, index) => (
          <div key={index} className="flex items-center gap-1.5 py-0.5">
            <span
              className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                server.status ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="text-xs">{server.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

export default MapTooltip
