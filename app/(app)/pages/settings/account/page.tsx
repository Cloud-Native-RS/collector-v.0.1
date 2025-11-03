"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon, ArrowUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { getAuthToken, getCurrentUser } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const languages = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh" }
] as const;

const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters."
    })
    .max(30, {
      message: "Name must not be longer than 30 characters."
    }),
  dob: z.date({
    required_error: "A date of birth is required."
  }).optional(),
  language: z.string({
    required_error: "Please select a language."
  }).optional()
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const defaultValues: Partial<AccountFormValues> = {};

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues
  });

  useEffect(() => {
    async function loadAccountSettings() {
      try {
        const token = getAuthToken();
        const currentUser = getCurrentUser();
        
        if (token) {
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
              name: user.name || "",
              dob: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
              language: user.language || "en"
            });
          } else if (currentUser) {
            form.reset({
              name: currentUser.name || "",
              dob: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined,
              language: currentUser.language || "en"
            });
          }
        } else if (currentUser) {
          form.reset({
            name: currentUser.name || "",
            dob: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined,
            language: currentUser.language || "en"
          });
        }
      } catch (error) {
        console.error("Failed to load account settings:", error);
        const currentUser = getCurrentUser();
        if (currentUser) {
          form.reset({
            name: currentUser.name || "",
            dob: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined,
            language: currentUser.language || "en"
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountSettings();
  }, [form]);

  async function onSubmit(data: AccountFormValues) {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please log in to update your account");
        return;
      }

      const updateData: any = {
        name: data.name,
      };

      if (data.dob) {
        updateData.dateOfBirth = data.dob.toISOString();
      }

      if (data.language) {
        updateData.language = data.language;
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
        toast.success("Account settings updated successfully");
        
        if (result.data?.user) {
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(result.data.user));
          }
        }
      } else {
        toast.error(result.error || result.message || "Failed to update account settings");
      }
    } catch (error) {
      console.error("Failed to update account:", error);
      toast.error("Failed to update account settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name that will be displayed on your profile and in emails.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0"
                      align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Your date of birth is used to calculate your age.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Language</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}>
                          {field.value
                            ? languages.find((language) => language.value === field.value)?.label
                            : "Select language"}
                          <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search language..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {languages.map((language) => (
                              <CommandItem
                                value={language.label}
                                key={language.value}
                                onSelect={() => {
                                  form.setValue("language", language.value);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    language.value === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {language.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    This is the language that will be used in the dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Updating..." : "Update account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
