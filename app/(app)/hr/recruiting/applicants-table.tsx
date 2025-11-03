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
import { Applicant } from "@/lib/api/hr";

interface ApplicantsTableProps {
  data: Applicant[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ApplicantsTable({ data, loading, onRefresh }: ApplicantsTableProps) {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    APPLIED: "bg-blue-100 text-blue-800",
    SCREENING: "bg-purple-100 text-purple-800",
    INTERVIEWING: "bg-yellow-100 text-yellow-800",
    OFFERED: "bg-cyan-100 text-cyan-800",
    HIRED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Job Posting</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No applicants found
              </TableCell>
            </TableRow>
          ) : (
            data.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell className="font-semibold">{applicant.applicantName}</TableCell>
                <TableCell>{applicant.email}</TableCell>
                <TableCell>{applicant.jobPosting?.title || "N/A"}</TableCell>
                <TableCell>
                  <Badge className={statusColors[applicant.status] || "bg-gray-100 text-gray-800"}>
                    {applicant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(applicant.appliedDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

