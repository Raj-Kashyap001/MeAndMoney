
"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useCurrency } from "../currency-provider"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  value: {
    label: "Spending",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SpendingBreakdownChart({ data }: { data: any[] }) {
 const { currency } = useCurrency();
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart 
        accessibilityLayer 
        data={data}
        layout="vertical"
        margin={{
            left: 10,
            right: 10,
        }}
      >
        <XAxis type="number" dataKey="value" hide />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="capitalize"
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            hideLabel
            formatter={(value) => formatCurrency(value as number, currency)}
            />} 
        />
        <Bar dataKey="value" layout="vertical" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
