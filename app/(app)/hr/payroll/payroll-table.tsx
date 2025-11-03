"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Payroll } from "@/lib/api/hr";

interface PayrollTableProps {
  data: Payroll[];
  loading: boolean;
}

export default function PayrollTable({ data, loading }: PayrollTableProps) {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSED: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Bonuses</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No payroll records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell>
                  {payroll.employee
                    ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {new Date(payroll.payPeriodStart).toLocaleDateString()} -{" "}
                  {new Date(payroll.payPeriodEnd).toLocaleDateString()}
                </TableCell>
                <TableCell>${payroll.salaryBase.toFixed(2)}</TableCell>
                <TableCell>${payroll.bonuses.toFixed(2)}</TableCell>
                <TableCell>${payroll.deductions.toFixed(2)}</TableCell>
                <TableCell className="font-semibold">${payroll.netPay.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={statusColors[payroll.status] || "bg-gray-100 text-gray-800"}>
                    {payroll.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

