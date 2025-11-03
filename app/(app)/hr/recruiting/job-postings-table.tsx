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
import { JobPosting } from "@/lib/api/hr";

interface JobPostingsTableProps {
  data: JobPosting[];
  loading: boolean;
  onRefresh: () => void;
}

export default function JobPostingsTable({ data, loading, onRefresh }: JobPostingsTableProps) {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    DRAFT: "bg-yellow-100 text-yellow-800",
    FILLED: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applicants</TableHead>
            <TableHead>Posted Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No job postings found
              </TableCell>
            </TableRow>
          ) : (
            data.map((posting) => (
              <TableRow key={posting.id}>
                <TableCell className="font-semibold">{posting.title}</TableCell>
                <TableCell>{posting.department || "-"}</TableCell>
                <TableCell>{posting.location || "-"}</TableCell>
                <TableCell>
                  <Badge className={statusColors[posting.status] || "bg-gray-100 text-gray-800"}>
                    {posting.status}
                  </Badge>
                </TableCell>
                <TableCell>{posting.applicants?.length || 0}</TableCell>
                <TableCell>
                  {posting.postedDate ? new Date(posting.postedDate).toLocaleDateString() : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

