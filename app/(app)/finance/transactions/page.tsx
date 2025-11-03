import { generateMeta } from "@/lib/utils";
import Transactions from "../components/transactions";

export async function generateMetadata() {
  return generateMeta({
    title: "Finance Transactions",
    description:
      "View and manage all your financial transactions including income, expenses, and transfers.",
    canonical: "/finance/transactions"
  });
}

export default function TransactionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your financial transactions
          </p>
        </div>
      </div>

      <Transactions />
    </div>
  );
}

