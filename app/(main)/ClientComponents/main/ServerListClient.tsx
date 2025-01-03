"use client"

import { useServerData } from "@/app/lib/server-data-context"
import ServerCard from "@/components/ServerCard"
import ServerCardInline from "@/components/ServerCardInline"
import Switch from "@/components/Switch"
import GlobalLoading from "@/components/loading/GlobalLoading"
import { Loader } from "@/components/loading/Loader"
import getEnv from "@/lib/env-entry"
import { useFilter } from "@/lib/network-filter-context"
import { useStatus } from "@/lib/status-context"
import { cn } from "@/lib/utils"
import { MapIcon, ViewColumnsIcon } from "@heroicons/react/20/solid"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

const ServerGlobal = dynamic(() => import("./Global"), {
  ssr: false,
  loading: () => <GlobalLoading />,
})

export default function ServerListClient() {
  const { status } = useStatus()
  const { filter } = useFilter()
  const t = useTranslations("ServerListClient")
  const containerRef = useRef<HTMLDivElement>(null)
  const defaultTag = "defaultTag"

  const [tag, setTag] = useState<string>(defaultTag)
  const [showMap, setShowMap] = useState<boolean>(false)
  const [inline, setInline] = useState<string>("0")

  useEffect(() => {
    const inlineState = localStorage.getItem("inline")
    if (inlineState !== null) {
      setInline(inlineState)
    }
  }, [])

  useEffect(() => {
    const savedTag = sessionStorage.getItem("selectedTag") || defaultTag
    setTag(savedTag)

    restoreScrollPosition()
  }, [])

  const handleTagChange = (newTag: string) => {
    setTag(newTag)
    sessionStorage.setItem("selectedTag", newTag)
    sessionStorage.setItem("scrollPosition", String(containerRef.current?.scrollTop || 0))
  }

  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem("scrollPosition")
    if (savedPosition && containerRef.current) {
      containerRef.current.scrollTop = Number(savedPosition)
    }
  }

  useEffect(() => {
    const handleRouteChange = () => {
      restoreScrollPosition()
    }

    window.addEventListener("popstate", handleRouteChange)
    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  const { data, error } = useServerData()

  if (error)
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-sm font-medium opacity-40">{error.message}</p>
        <p className="text-sm font-medium opacity-40">{t("error_message")}</p>
      </div>
    )

  if (!data?.result)
    return (
      <div className="flex flex-col items-center min-h-96 justify-center ">
        <div className="font-semibold flex items-center gap-2 text-sm">
          <Loader visible={true} />
          {t("connecting")}...
        </div>
      </div>
    )

  const { result } = data
  const sortedServers = result.sort((a, b) => {
    const displayIndexDiff = (b.display_index || 0) - (a.display_index || 0)
    if (displayIndexDiff !== 0) return displayIndexDiff
    return a.id - b.id
  })

  const filteredServersByStatus =
    status === "all"
      ? sortedServers
      : sortedServers.filter((server) =>
          [status].includes(server.online_status ? "online" : "offline"),
        )

  const allTag = filteredServersByStatus.map((server) => server.tag).filter(Boolean)
  const uniqueTags = [...new Set(allTag)]
  uniqueTags.unshift(defaultTag)

  const filteredServers =
    tag === defaultTag
      ? filteredServersByStatus
      : filteredServersByStatus.filter((server) => server.tag === tag)

  if (filter) {
    filteredServers.sort((a, b) => {
      if (!a.online_status && b.online_status) return 1
      if (a.online_status && !b.online_status) return -1
      if (!a.online_status && !b.online_status) return 0
      return (
        b.status.NetInSpeed + b.status.NetOutSpeed - (a.status.NetInSpeed + a.status.NetOutSpeed)
      )
    })
  }

  const tagCountMap: Record<string, number> = {}
  filteredServersByStatus.forEach((server) => {
    if (server.tag) {
      tagCountMap[server.tag] = (tagCountMap[server.tag] || 0) + 1
    }
  })

  return (
    <>
      <section className="flex items-center gap-2 w-full overflow-hidden">
        <button
          onClick={() => {
            setShowMap(!showMap)
          }}
          className={cn(
            "rounded-[50px] text-white cursor-pointer [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] bg-blue-600 p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
            {
              "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] bg-blue-500": showMap,
            },
          )}
        >
          <MapIcon className="size-[13px]" />
        </button>
        <button
          onClick={() => {
            setInline(inline === "0" ? "1" : "0")
            localStorage.setItem("inline", inline === "0" ? "1" : "0")
          }}
          className={cn(
            "rounded-[50px] text-white cursor-pointer [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] bg-blue-600  p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]  ",
            {
              "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] bg-blue-500": inline === "1",
            },
          )}
        >
          <ViewColumnsIcon className="size-[13px]" />
        </button>
        {getEnv("NEXT_PUBLIC_ShowTag") === "true" && (
          <Switch
            allTag={uniqueTags}
            nowTag={tag}
            tagCountMap={tagCountMap}
            onTagChange={handleTagChange}
          />
        )}
      </section>
      {showMap && <ServerGlobal />}
      {inline === "1" && (
        <section
          ref={containerRef}
          className="flex flex-col gap-2 overflow-x-scroll scrollbar-hidden"
        >
          {filteredServers.map((serverInfo) => (
            <ServerCardInline key={serverInfo.id} serverInfo={serverInfo} />
          ))}
        </section>
      )}

      {inline === "0" && (
        <section ref={containerRef} className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {filteredServers.map((serverInfo) => (
            <ServerCard key={serverInfo.id} serverInfo={serverInfo} />
          ))}
        </section>
      )}
    </>
  )
}
