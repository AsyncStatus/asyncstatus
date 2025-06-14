"use client";

import * as React from "react";
import { Button } from "@asyncstatus/ui/components/button";
import { Calendar } from "@asyncstatus/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@asyncstatus/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { cn } from "@asyncstatus/ui/lib/utils";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

export function DatePickerWithPresets({
  value,
  onSelect,
}: {
  value: DateRange;
  onSelect: (date: DateRange) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "LLL dd, y")} -{" "}
                {format(value.to, "LLL dd, y")}
              </>
            ) : (
              format(value.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-auto flex-col space-y-2 p-2"
      >
        <Select
          onValueChange={(value) => {
            if (value === "0") {
              onSelect({
                from: new Date(),
                to: new Date(),
              });
            } else {
              onSelect({
                from: addDays(new Date(), -parseInt(value)),
                to: new Date(),
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Yesterday</SelectItem>
            <SelectItem value="3">Last 3 days</SelectItem>
            <SelectItem value="7">Last week</SelectItem>
            <SelectItem value="14">Last 2 weeks</SelectItem>
            <SelectItem value="30">Last month</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-md border">
          <Calendar
            mode="range"
            selected={value}
            onSelect={(range) => {
              if (!range) {
                return;
              }
              onSelect(range);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
