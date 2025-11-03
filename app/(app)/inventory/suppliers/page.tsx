import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { Building2, Phone, Mail, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SupplierList from "./supplier-list";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = generateMeta({
  title: "Suppliers / Vendors",
  description: "Manage suppliers and vendor information",
  canonical: "/inventory/suppliers"
});

export default function SuppliersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers / Vendors</h1>
          <p className="text-muted-foreground">
            Manage your supplier and vendor information
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/suppliers/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Supplier
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Suppliers</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">24</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Building2 className="mr-1 h-3 w-3 text-blue-600" />
              <span className="text-blue-600">Active vendors</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">142</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <span className="text-green-600">This year</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending Deliveries</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">8</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <span className="text-orange-600">In transit</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Relations</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">18</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <span className="text-purple-600">Regular orders</span>
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <SupplierList />
    </div>
  );
}

