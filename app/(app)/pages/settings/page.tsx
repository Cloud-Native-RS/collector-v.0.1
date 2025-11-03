"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { CircleUserRoundIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { useFileUpload } from "@/hooks/use-file-upload";
import { getAuthToken, getCurrentUser } from "@/lib/auth/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters."
    })
    .max(30, {
      message: "Username must not be longer than 30 characters."
    }),
  email: z
    .string({
      required_error: "Please select an email to display."
    })
    .email(),
  bio: z.string().max(160).min(4).optional().or(z.literal("")),
  urls: z
    .array(
      z.object({
        value: z.string().refine(
          (val) => !val || val === "" || z.string().url().safeParse(val).success,
          { message: "Please enter a valid URL." }
        )
      })
    )
    .optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  bio: "",
  urls: []
};

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [{ files }, { removeFile, openFileDialog, getInputProps }] = useFileUpload({
    accept: "image/*"
  });

  const previewUrl = files[0]?.preview || null;
  const fileName = files[0]?.file.name || null;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    name: "urls",
    control: form.control
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const token = getAuthToken();
        if (!token) {
          toast.error("Please log in to view your profile");
          return;
        }

        const response = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.success && data.data?.user) {
          const user = data.data.user;
          form.reset({
            username: user.name || user.username || "",
            email: user.email || "",
            bio: user.bio || "",
            urls: user.urls?.map((url: string) => ({ value: url })) || []
          });
        } else {
          const currentUser = getCurrentUser();
          if (currentUser) {
            form.reset({
              username: currentUser.name || currentUser.username || "",
              email: currentUser.email || "",
              bio: currentUser.bio || "",
              urls: currentUser.urls?.map((url: string) => ({ value: url })) || []
            });
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        const currentUser = getCurrentUser();
        if (currentUser) {
          form.reset({
            username: currentUser.name || currentUser.username || "",
            email: currentUser.email || "",
            bio: currentUser.bio || "",
            urls: currentUser.urls?.map((url: string) => ({ value: url })) || []
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please log in to update your profile");
        return;
      }

      const updateData: any = {
        name: data.username,
        email: data.email,
      };

      if (data.bio) {
        updateData.bio = data.bio;
      }

      if (data.urls && data.urls.length > 0) {
        updateData.urls = data.urls
          .map((url) => url.value)
          .filter((url) => url && url.trim() !== "");
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Profile updated successfully");
        
        if (result.data?.user) {
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(result.data.user));
          }
        }
      } else {
        toast.error(result.error || result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 align-top">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`${previewUrl}`} />
                  <AvatarFallback>
                    <CircleUserRoundIcon className="opacity-45" />
                  </AvatarFallback>
                </Avatar>
                <div className="relative flex gap-2">
                  <Button type="button" onClick={openFileDialog} aria-haspopup="dialog">
                    {fileName ? "Change image" : "Upload image"}
                  </Button>
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload image file"
                    tabIndex={-1}
                  />
                  {fileName && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => removeFile(files[0]?.id)}>
                      <Trash2Icon />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name. It can be your real name or a pseudonym. You
                    can only change this once every 30 days.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your email address. This will be used for account notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can <span>@mention</span> other users and organizations to link to them.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`urls.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>URLs</FormLabel>
                      <FormDescription className={cn(index !== 0 && "sr-only")}>
                        Add links to your website, blog, or social media profiles.
                      </FormDescription>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}>
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}>
                Add URL
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Updating..." : "Update profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
