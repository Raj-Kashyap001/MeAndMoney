
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useCurrency } from "../currency-provider"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  Income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  Expense: {
    label: "Expense",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function OverviewChart({ data }: { data: any[] }) {
  const { currency } = useCurrency()
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
          top: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatCurrency(value, currency).slice(0, -3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            indicator="dot"
            formatter={(value, name) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: name === 'Income' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))'}}></div>
                    <span className="text-muted-foreground">{name}:</span>
                    <span>{formatCurrency(value as number, currency)}</span>
                </div>
            )}
          />}
        />
        <Area
          dataKey="Expense"
          type="natural"
          fill="var(--color-Expense)"
          fillOpacity={0.4}
          stroke="var(--color-Expense)"
          stackId="a"
        />
        <Area
          dataKey="Income"
          type="natural"
          fill="var(--color-Income)"
          fillOpacity={0.4}
          stroke="var(--color-Income)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
