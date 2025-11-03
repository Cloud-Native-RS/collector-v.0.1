"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceApi, Attendance } from "@/lib/api/hr";
import { employeesApi, Employee } from "@/lib/api/hr";
import { toast } from "sonner";
import { LogIn, LogOut, Calendar, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttendanceTable from "./attendance-table";

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [selectedEmployee]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, employeesRes] = await Promise.all([
        attendanceApi.list({ employeeId: selectedEmployee !== "all" ? selectedEmployee : undefined, limit: 100 }),
        employeesApi.list({ limit: 100 }),
      ]);
      setAttendances(attendanceRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (selectedEmployee === "all") {
      toast.error("Please select an employee first");
      return;
    }
    try {
      await attendanceApi.checkIn(selectedEmployee);
      toast.success("Checked in successfully");
      loadData();
    } catch (error: any) {
      toast.error(`Failed to check in: ${error.message}`);
    }
  };

  const handleCheckOut = async () => {
    if (selectedEmployee === "all") {
      toast.error("Please select an employee first");
      return;
    }
    try {
      await attendanceApi.checkOut(selectedEmployee);
      toast.success("Checked out successfully");
      loadData();
    } catch (error: any) {
      toast.error(`Failed to check out: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Attendance</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendances.filter(a => {
                const today = new Date().toISOString().split("T")[0];
                return a.date === today && (a.status === "PRESENT" || a.status === "REMOTE");
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check In / Check Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCheckIn} disabled={selectedEmployee === "all"}>
              <LogIn className="mr-2 h-4 w-4" /> Check In
            </Button>
            <Button onClick={handleCheckOut} variant="outline" disabled={selectedEmployee === "all"}>
              <LogOut className="mr-2 h-4 w-4" /> Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <AttendanceTable data={attendances} loading={loading} />
    </div>
  );
}

