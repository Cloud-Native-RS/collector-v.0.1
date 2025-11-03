import { generateMeta } from "@/lib/utils";
import { Download, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import CreditCards from "./components/my-wallet";
import Revenue from "./components/revenue";
import MonthlyExpenses from "./components/monthly-expenses";
import Summary from "./components/summary";
import SavingGoal from "./components/saving-goal";
import KPICards from "./components/kpi-cards";

export async function generateMetadata() {
  return generateMeta({
    title: "Finance Admin Dashboard",
    description:
      "A finance dashboard is an admin panel that visualizes key financial data such as income, expenses, cash flow, budget, and profit. Built with shadcn/ui, Tailwind CSS, Next.js.",
    canonical: "/finance"
  });
}

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Finance Dashboard</h1>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker />
          <Button size="icon">
            <Download />
          </Button>
        </div>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Revenue />
        <MonthlyExpenses />
        <Summary />
      </div>

      <div className="grid-cols-2 gap-4 space-y-4 lg:grid lg:space-y-0">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>View and manage all your financial transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recent Transactions</span>
                <span className="text-sm font-medium">7 transactions</span>
              </div>
              <div className="text-2xl font-bold">$3,451.29</div>
              <p className="text-xs text-muted-foreground">Total amount in the last 30 days</p>
            </div>
            <Link href="/finance/transactions">
              <Button className="w-full" variant="outline">
                View All Transactions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <SavingGoal />
          <CreditCards />
        </div>
      </div>
    </div>
  );
}
