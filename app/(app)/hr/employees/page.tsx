"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { employeesApi, Employee } from "@/lib/api/hr";
import { toast } from "sonner";
import EmployeesDataTable from "./employees-data-table";
import CreateEmployeeDialog from "./create-employee-dialog";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesApi.list({ limit: 100 });
      setEmployees(response.data || []);
    } catch (error: any) {
      toast.error(`Failed to load employees: ${error.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeCreated = () => {
    setOpenDialog(false);
    loadEmployees();
    toast.success("Employee created successfully");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Employees</h1>
        <Button onClick={() => setOpenDialog(true)}>
          <PlusIcon className="mr-2" /> Add Employee
        </Button>
      </div>
      <EmployeesDataTable data={employees} loading={loading} onRefresh={loadEmployees} />
      <CreateEmployeeDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSuccess={handleEmployeeCreated}
      />
    </div>
  );
}

