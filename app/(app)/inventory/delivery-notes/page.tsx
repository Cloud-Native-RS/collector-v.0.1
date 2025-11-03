import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { Truck, Package, CheckCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DeliveryNoteList from "./delivery-note-list";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = generateMeta({
  title: "Delivery Notes",
  description: "Track and manage delivery notes",
  canonical: "/inventory/delivery-notes"
});

export default function DeliveryNotesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Notes</h1>
          <p className="text-muted-foreground">
            Track and manage delivery notes and shipments
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/delivery-notes/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Delivery Note
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Pending Deliveries</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">15</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Clock className="mr-1 h-3 w-3 text-orange-600" />
              <span className="text-orange-600">In transit</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Delivered Today</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">42</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">Completed</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Items Shipped</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">1,248</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Package className="mr-1 h-3 w-3 text-blue-600" />
              <span className="text-blue-600">This month</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Vehicles</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">8</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Truck className="mr-1 h-3 w-3 text-purple-600" />
              <span className="text-purple-600">On route</span>
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <DeliveryNoteList />
    </div>
  );
}

