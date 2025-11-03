"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Package,
  Printer,
  Truck,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ordersApi, Order } from "@/lib/api/orders";
import { toast } from "sonner";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELED";

export default function SalesOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getById(orderId);
      setOrder(response.data);
    } catch (error: any) {
      toast.error(`Failed to load order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild className="mt-4">
          <Link href="/sales/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const statusSteps: Record<OrderStatus, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELED: "Canceled"
  };

  const currentStepIndex = Object.keys(statusSteps).indexOf(order.status);

  const getStatusIcon = (status: OrderStatus, index: number) => {
    if (index < currentStepIndex) {
      return <CheckCircle className="size-4 lg:size-5" />;
    }
    switch (status) {
      case "PENDING":
      case "CONFIRMED":
      case "PROCESSING":
        return <Package className="size-4 lg:size-5" />;
      case "SHIPPED":
        return <Truck className="size-4 lg:size-5" />;
      case "DELIVERED":
        return <CheckCircle2 className="size-4 lg:size-5" />;
      default:
        return <Package className="size-4 lg:size-5" />;
    }
  };

  return (
    <div className="mx-auto max-w-screen-lg space-y-4 lg:mt-10">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/sales/orders">
            <ChevronLeft /> Back
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer />
            Print
          </Button>
          {order.status !== 'CANCELED' && order.status !== 'DELIVERED' && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await ordersApi.cancel(order.id, 'Canceled from detail page');
                  toast.success('Order canceled');
                  loadOrder();
                } catch (error: any) {
                  toast.error(`Failed to cancel order: ${error.message}`);
                }
              }}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Order {order.orderNumber}</CardTitle>
            <p className="text-muted-foreground text-sm">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {order.shippingAddress ? (
                <div className="space-y-2">
                  <h3 className="font-medium">Customer Information</h3>
                  <p className="text-muted-foreground text-sm">{order.shippingAddress.fullName}</p>
                  <p className="text-muted-foreground text-sm">{order.shippingAddress.email || '-'}</p>
                  <p className="text-muted-foreground text-sm">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {order.shippingAddress.country}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-medium">Customer Information</h3>
                  <p className="text-muted-foreground text-sm">No shipping address provided</p>
                </div>
              )}
              {order.payments && order.payments.length > 0 && (
                <div className="bg-muted flex items-center justify-between space-y-2 rounded-md border p-4">
                  <div className="space-y-1">
                    <h4 className="font-medium">Payment Method</h4>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <CreditCard className="size-4" /> {order.payments[0].provider}
                      {order.payments[0].last4 && ` ending in **** ${order.payments[0].last4}`}
                    </div>
                    <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{order.currency} {typeof order.subtotal === 'number' ? order.subtotal.toFixed(2) : Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{order.currency} {typeof order.taxTotal === 'number' ? order.taxTotal.toFixed(2) : Number(order.taxTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.currency} {typeof order.shippingCost === 'number' ? order.shippingCost.toFixed(2) : Number(order.shippingCost).toFixed(2)}</span>
            </div>
            {(typeof order.discountAmount === 'number' ? order.discountAmount : Number(order.discountAmount)) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{order.currency} {typeof order.discountAmount === 'number' ? order.discountAmount.toFixed(2) : Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{order.currency} {typeof order.grandTotal === 'number' ? order.grandTotal.toFixed(2) : Number(order.grandTotal).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.status !== 'CANCELED' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">Delivery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-6 pt-1">
              <div className="mb-2 flex items-center justify-between">
                {Object.keys(statusSteps).map((step, index) => (
                  <div key={index} className="text-center">
                    <div
                      className={`mx-auto flex size-10 items-center justify-center rounded-full text-lg lg:size-12 ${
                        index <= currentStepIndex && order.status !== 'CANCELED'
                          ? "bg-green-500 text-white dark:bg-green-900"
                          : "bg-muted border"
                      }`}>
                      {getStatusIcon(step as OrderStatus, index)}
                    </div>
                    <div className="mt-2 text-xs">{statusSteps[step as OrderStatus]}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <Progress
                  className="w-full"
                  value={(currentStepIndex / (Object.keys(statusSteps).length - 1)) * 100}
                />
                <div className="text-muted-foreground text-xs">
                  <Badge variant="info" className="me-1">
                    {statusSteps[order.status]}
                  </Badge>
                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <span>
                      {" "}on {new Date(order.statusHistory[0].createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Unit Price</TableHead>
                <TableHead className="text-end">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <span className="font-medium">{item.description}</span>
                        {item.sku && (
                          <p className="text-muted-foreground text-xs">SKU: {item.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">
                    {order.currency} {typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : Number(item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-end">
                    {order.currency} {typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : Number(item.totalPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

