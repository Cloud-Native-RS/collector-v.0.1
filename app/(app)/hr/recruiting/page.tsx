"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recruitingApi, JobPosting, Applicant } from "@/lib/api/hr";
import { toast } from "sonner";
import JobPostingsTable from "./job-postings-table";
import ApplicantsTable from "./applicants-table";

export default function RecruitingPage() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postingsRes, applicantsRes] = await Promise.all([
        recruitingApi.listJobPostings({ limit: 100 }),
        recruitingApi.listApplicants({ limit: 100 }),
      ]);
      setJobPostings(postingsRes.data || []);
      setApplicants(applicantsRes.data || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Recruiting</h1>
      </div>
      <Tabs defaultValue="postings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="postings">Job Postings</TabsTrigger>
          <TabsTrigger value="applicants">Applicants</TabsTrigger>
        </TabsList>
        <TabsContent value="postings">
          <JobPostingsTable data={jobPostings} loading={loading} onRefresh={loadData} />
        </TabsContent>
        <TabsContent value="applicants">
          <ApplicantsTable data={applicants} loading={loading} onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

