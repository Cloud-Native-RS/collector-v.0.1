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
import { Attendance } from "@/lib/api/hr";

interface AttendanceTableProps {
  data: Attendance[];
  loading: boolean;
}

export default function AttendanceTable({ data, loading }: AttendanceTableProps) {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-800",
    ABSENT: "bg-red-100 text-red-800",
    ON_LEAVE: "bg-blue-100 text-blue-800",
    REMOTE: "bg-purple-100 text-purple-800",
    SICK_LEAVE: "bg-yellow-100 text-yellow-800",
    VACATION: "bg-cyan-100 text-cyan-800",
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((attendance) => (
              <TableRow key={attendance.id}>
                <TableCell>
                  {attendance.employee
                    ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                    : "N/A"}
                </TableCell>
                <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {attendance.checkInTime
                    ? new Date(attendance.checkInTime).toLocaleTimeString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {attendance.checkOutTime
                    ? new Date(attendance.checkOutTime).toLocaleTimeString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[attendance.status] || "bg-gray-100 text-gray-800"}>
                    {attendance.status.replace("_", " ")}
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

