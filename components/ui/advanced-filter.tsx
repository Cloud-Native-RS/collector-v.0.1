"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Calendar as CalendarIcon, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn"
  | "isNull"
  | "isNotNull";

export type FilterType = "text" | "number" | "date" | "select" | "boolean";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For "between" operator
}

export interface FilterField {
  key: string;
  label: string;
  type: FilterType;
  options?: Array<{ value: string; label: string }>; // For select type
  placeholder?: string;
}

export interface AdvancedFilterProps<T> {
  fields: FilterField[];
  data: T[];
  onFilterChange: (filteredData: T[]) => void;
  className?: string;
}

const operatorsByType: Record<FilterType, FilterOperator[]> = {
  text: ["equals", "notEquals", "contains", "notContains", "startsWith", "endsWith", "isNull", "isNotNull"],
  number: ["equals", "notEquals", "greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual", "between", "isNull", "isNotNull"],
  date: ["equals", "notEquals", "greaterThan", "lessThan", "between", "isNull", "isNotNull"],
  select: ["equals", "notEquals", "in", "notIn", "isNull", "isNotNull"],
  boolean: ["equals"],
};

const operatorLabels: Record<FilterOperator, string> = {
  equals: "Equals",
  notEquals: "Not Equals",
  contains: "Contains",
  notContains: "Not Contains",
  startsWith: "Starts With",
  endsWith: "Ends With",
  greaterThan: "Greater Than",
  lessThan: "Less Than",
  greaterThanOrEqual: "Greater Than or Equal",
  lessThanOrEqual: "Less Than or Equal",
  between: "Between",
  in: "In",
  notIn: "Not In",
  isNull: "Is Empty",
  isNotNull: "Is Not Empty",
};

function getValue<T>(obj: T, path: string): any {
  return path.split(".").reduce((current: any, key) => current?.[key], obj);
}

function matchesCondition<T>(item: T, condition: FilterCondition): boolean {
  const value = getValue(item, condition.field);

  // Handle null/undefined checks
  if (condition.operator === "isNull") {
    return value === null || value === undefined || value === "";
  }
  if (condition.operator === "isNotNull") {
    return value !== null && value !== undefined && value !== "";
  }

  // If value is null/undefined and operator is not null-check, return false
  if (value === null || value === undefined) {
    return false;
  }

  const strValue = String(value).toLowerCase();
  const filterValue = String(condition.value).toLowerCase();

  switch (condition.operator) {
    case "equals":
      return strValue === filterValue;
    case "notEquals":
      return strValue !== filterValue;
    case "contains":
      return strValue.includes(filterValue);
    case "notContains":
      return !strValue.includes(filterValue);
    case "startsWith":
      return strValue.startsWith(filterValue);
    case "endsWith":
      return strValue.endsWith(filterValue);
    case "greaterThan":
      return Number(value) > Number(condition.value);
    case "lessThan":
      return Number(value) < Number(condition.value);
    case "greaterThanOrEqual":
      return Number(value) >= Number(condition.value);
    case "lessThanOrEqual":
      return Number(value) <= Number(condition.value);
    case "between":
      return Number(value) >= Number(condition.value) && Number(value) <= Number(condition.value2);
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(strValue);
    case "notIn":
      return Array.isArray(condition.value) && !condition.value.includes(strValue);
    default:
      return true;
  }
}

export function AdvancedFilter<T>({
  fields,
  data,
  onFilterChange,
  className,
}: AdvancedFilterProps<T>) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const applyFilters = (newConditions: FilterCondition[]) => {
    if (newConditions.length === 0) {
      onFilterChange(data);
      return;
    }

    const filtered = data.filter((item) =>
      newConditions.every((condition) => matchesCondition(item, condition))
    );

    onFilterChange(filtered);
  };

  const addCondition = (field: FilterField) => {
    const defaultOperator = operatorsByType[field.type][0];
    const newCondition: FilterCondition = {
      field: field.key,
      operator: defaultOperator,
      value: "",
    };

    const newConditions = [...conditions, newCondition];
    setConditions(newConditions);
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition
    );
    setConditions(newConditions);
    applyFilters(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    applyFilters(newConditions);
  };

  const clearAllFilters = () => {
    setConditions([]);
    onFilterChange(data);
  };

  const renderValueInput = (condition: FilterCondition, index: number) => {
    const field = fields.find((f) => f.key === condition.field);
    if (!field) return null;

    // Don't show value input for null checks
    if (condition.operator === "isNull" || condition.operator === "isNotNull") {
      return null;
    }

    switch (field.type) {
      case "select":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {condition.value || "Select..."}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {field.options?.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={
                    condition.operator === "in" || condition.operator === "notIn"
                      ? Array.isArray(condition.value) && condition.value.includes(option.value)
                      : condition.value === option.value
                  }
                  onCheckedChange={(checked) => {
                    if (condition.operator === "in" || condition.operator === "notIn") {
                      const currentValues = Array.isArray(condition.value) ? condition.value : [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value);
                      updateCondition(index, { value: newValues });
                    } else {
                      updateCondition(index, { value: option.value });
                    }
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );

      case "date":
        return (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {condition.value ? format(new Date(condition.value), "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={condition.value ? new Date(condition.value) : undefined}
                  onSelect={(date) => updateCondition(index, { value: date?.toISOString() })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {condition.operator === "between" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {condition.value2 ? format(new Date(condition.value2), "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={condition.value2 ? new Date(condition.value2) : undefined}
                    onSelect={(date) => updateCondition(index, { value2: date?.toISOString() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        );

      case "number":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={condition.value || ""}
              onChange={(e) => updateCondition(index, { value: e.target.value })}
              placeholder={field.placeholder || "Enter value"}
              className="flex-1"
            />
            {condition.operator === "between" && (
              <Input
                type="number"
                value={condition.value2 || ""}
                onChange={(e) => updateCondition(index, { value2: e.target.value })}
                placeholder="End value"
                className="flex-1"
              />
            )}
          </div>
        );

      case "boolean":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {condition.value === "true" ? "Yes" : condition.value === "false" ? "No" : "Select..."}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateCondition(index, { value: "true" })}>
                Yes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateCondition(index, { value: "false" })}>
                No
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );

      default: // text
        return (
          <Input
            type="text"
            value={condition.value || ""}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            placeholder={field.placeholder || "Enter value"}
          />
        );
    }
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {conditions.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {conditions.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Advanced Filters</h4>
              {conditions.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </div>

            {conditions.length === 0 && (
              <p className="text-sm text-muted-foreground">No filters applied. Add a filter to get started.</p>
            )}

            {conditions.map((condition, index) => {
              const field = fields.find((f) => f.key === condition.field);
              if (!field) return null;

              return (
                <div key={index} className="space-y-2 p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{field.label}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start">
                          {operatorLabels[condition.operator]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {operatorsByType[field.type].map((op) => (
                          <DropdownMenuItem key={op} onClick={() => updateCondition(index, { operator: op })}>
                            {operatorLabels[op]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="col-span-2">{renderValueInput(condition, index)}</div>
                  </div>
                </div>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Add Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Select Field</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {fields.map((field) => (
                  <DropdownMenuItem key={field.key} onClick={() => addCondition(field)}>
                    {field.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
