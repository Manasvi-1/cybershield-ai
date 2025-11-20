"use client"

import * as React from "react"

export type ChartConfig = Record<string, any>

const ChartContainer = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} {...props} />
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltip: any = () => null
const ChartTooltipContent: any = (_props: any) => null
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend: any = () => null
const ChartLegendContent: any = (_props: any) => null
ChartLegendContent.displayName = "ChartLegend"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => null

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

