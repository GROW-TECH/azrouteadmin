"use client";

import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
export default function PaymentPage() {
  const payments = [
    {
      id: 1,
      course: "Mastering Chess Openings",
      amount: "₹499",
      status: "Paid",
      date: "2025-08-01",
      method: "UPI"
    },
    {
      id: 2,
      course: "Endgame Strategies Bootcamp",
      amount: "₹699",
      status: "Pending",
      date: "2025-08-05",
      method: "Card"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Review your payment history and pending dues.</p>
      </div>

      <div className="grid gap-6">
        {payments.map((payment) => (
          <Card key={payment.id} className="border shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  {payment.course}
                </CardTitle>
                <Badge variant={payment.status === "Paid" ? "default" : "destructive"}>
                  {payment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Amount:</strong> {payment.amount}</p>
              <p><strong>Payment Method:</strong> {payment.method}</p>
              <p><strong>Date:</strong> {payment.date}</p>
              {payment.status === "Pending" && (
                <Button className="mt-3 bg-[#3b82f6] hover:bg-[#2563eb]">
                  Pay Now
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
