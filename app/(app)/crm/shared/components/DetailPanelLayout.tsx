import { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, X as XIcon, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailPanelLayoutProps {
  open: boolean;
  onClose: (open: boolean) => void;
  title: string;
  isEditMode: boolean;
  isNewEntity?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
  headerContent?: ReactNode; // Avatar, status badge, etc.
  className?: string;
}

export function DetailPanelLayout({
  open,
  onClose,
  title,
  isEditMode,
  isNewEntity = false,
  onEdit,
  onSave,
  onCancel,
  children,
  headerContent,
  className,
}: DetailPanelLayoutProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className={cn("w-full sm:w-[540px] sm:max-w-[540px] p-0 flex flex-col", className)}
      >
        <SheetHeader className="px-6 py-4 border-b space-y-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              {headerContent}
              <div className="flex-1">
                <SheetTitle className="text-xl">{title}</SheetTitle>
              </div>
            </div>
            {!isEditMode && !isNewEntity && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="shrink-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">{children}</div>
        </ScrollArea>

        {isEditMode && (
          <SheetFooter className="px-6 py-4 border-t flex-row gap-2">
            <Button onClick={onSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isNewEntity ? "Create" : "Save Changes"}
            </Button>
            {!isNewEntity && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                <XIcon className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
