/**
 * EXAMPLE: How to use validated form components with React Hook Form + Zod
 *
 * SETUP:
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import { contactSchema, type ContactFormData } from "@/lib/validations";
 * import { ValidatedInput, ValidatedTextarea, ValidatedSelect } from "@/components/forms";
 *
 * function ContactForm() {
 *   const {
 *     register,
 *     handleSubmit,
 *     formState: { errors, isSubmitting },
 *     setValue,
 *     watch,
 *   } = useForm<ContactFormData>({
 *     resolver: zodResolver(contactSchema),
 *     defaultValues: {
 *       firstName: "",
 *       lastName: "",
 *       email: "",
 *       status: "pending",
 *     },
 *   });
 *
 *   const onSubmit = async (data: ContactFormData) => {
 *     try {
 *       await createContact(data);
 *       toast.success("Contact created!");
 *     } catch (error) {
 *       toast.error("Failed to create contact");
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 *       {/* Text Input */}
 *       <ValidatedInput
 *         id="firstName"
 *         label="First Name"
 *         placeholder="John"
 *         error={errors.firstName?.message}
 *         hint="Enter the contact's first name"
 *         required
 *         {...register("firstName")}
 *       />
 *
 *       {/* Email Input */}
 *       <ValidatedInput
 *         id="email"
 *         type="email"
 *         label="Email Address"
 *         placeholder="john@example.com"
 *         error={errors.email?.message}
 *         required
 *         {...register("email")}
 *       />
 *
 *       {/* Textarea with Character Count */}
 *       <ValidatedTextarea
 *         id="notes"
 *         label="Notes"
 *         placeholder="Additional information..."
 *         error={errors.notes?.message}
 *         hint="Optional notes about this contact"
 *         showCharCount
 *         maxLength={1000}
 *         value={watch("notes")}
 *         {...register("notes")}
 *       />
 *
 *       {/* Select */}
 *       <ValidatedSelect
 *         id="status"
 *         label="Status"
 *         error={errors.status?.message}
 *         required
 *         value={watch("status")}
 *         onValueChange={(value) => setValue("status", value)}
 *         options={[
 *           { value: "active", label: "Active" },
 *           { value: "inactive", label: "Inactive" },
 *           { value: "pending", label: "Pending" },
 *         ]}
 *       />
 *
 *       <Button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? "Creating..." : "Create Contact"}
 *       </Button>
 *     </form>
 *   );
 * }
 * ```
 *
 * FEATURES:
 * - Automatic validation with Zod
 * - Error messages with icons
 * - Accessibility (ARIA attributes)
 * - Required field indicators
 * - Character count for textareas
 * - Consistent styling
 * - Screen reader support
 *
 * BENEFITS:
 * - Type-safe forms
 * - Consistent UX
 * - Better accessibility
 * - Less boilerplate
 * - Automatic error display
 */

export {};
