"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@asyncstatus/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { Slider } from "@asyncstatus/ui/components/slider";
import { cn } from "@asyncstatus/ui/lib/utils";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";

import { DotPattern } from "./dot-pattern";
import { MagicCard } from "./magic-card";
import { NumberTicker } from "./number-ticker";

export default function SavingsCalculator() {
  const presets = {
    "yc-startup": {
      teamSize: 4,
      avgSalary: 140000,
      meetingLength: 15,
      workingDays: 31,
      asyncTime: 10,
    },
    "eu-startup": {
      teamSize: 20,
      avgSalary: 80000,
      meetingLength: 20,
      workingDays: 20,
      asyncTime: 8,
    },
    "us-startup": {
      teamSize: 15,
      avgSalary: 110000,
      meetingLength: 30,
      workingDays: 21,
      asyncTime: 10,
    },
    scaleup: {
      teamSize: 40,
      avgSalary: 100000,
      meetingLength: 65,
      workingDays: 20,
      asyncTime: 16,
    },
  } as const;

  const [preset, setPreset] = useState<keyof typeof presets>("yc-startup");

  const form = useForm<{
    teamSize: number;
    avgSalary: number;
    meetingLength: number;
    workingDays: number;
    asyncTime: number;
  }>({
    defaultValues: {
      ...presets[preset],
    },
  });

  const watchedValues = form.watch();
  const { teamSize, avgSalary, meetingLength, workingDays, asyncTime } =
    useDeferredValue(watchedValues);

  // Ensure async follow-up time is always less than stand-up length
  useEffect(() => {
    if (asyncTime >= meetingLength) {
      form.setValue("asyncTime", Math.max(meetingLength - 1, 1));
    }
  }, [asyncTime, meetingLength, form]);

  // Derived calculations memoized for performance
  const {
    hoursStandupPerMonth,
    standupCostMonthly,
    monthlySavings,
    annualSavings,
  } = useMemo(() => {
    const rate = avgSalary / (260 * 8);
    const hrsStandup = (teamSize * meetingLength * workingDays) / 60;
    const minutesSavedPerPersonPerDay = Math.max(meetingLength - asyncTime, 0);
    const hrsSaved =
      (teamSize * minutesSavedPerPersonPerDay * workingDays) / 60;
    const standupCost = hrsStandup * rate;
    const monthlySave = hrsSaved * rate;
    const annualSave = monthlySave * 12;

    return {
      hoursStandupPerMonth: hrsStandup,
      standupCostMonthly: standupCost,
      monthlySavings: monthlySave,
      annualSavings: annualSave,
    };
  }, [avgSalary, teamSize, meetingLength, workingDays, asyncTime]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 max-sm:w-full max-sm:max-w-none max-sm:p-3 max-sm:rounded-md">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-sm:gap-6">
        <Form {...form}>
          <form className="w-full space-y-6 max-sm:space-y-4">
            <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <label className="text-sm font-medium text-gray-700 max-sm:text-xs">
                Choose a preset:
              </label>
              <Select
                value={preset}
                onValueChange={(value) => {
                  const key = value as keyof typeof presets;
                  setPreset(key);
                  form.reset(presets[key]);
                }}
              >
                <SelectTrigger className="min-w-40 max-sm:w-full max-sm:min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yc-startup">YC Startup</SelectItem>
                  <SelectItem value="eu-startup">EU Startup</SelectItem>
                  <SelectItem value="us-startup">US Startup</SelectItem>
                  <SelectItem value="scaleup">Scaleup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="max-sm:text-sm">
                    Team size: {field.value}{" "}
                    {field.value === 1 ? "person" : "people"}
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={50}
                      step={1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>25</span>
                    <span>50</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avgSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="max-sm:text-sm">
                    Average salary: {formatCurrency(field.value)}
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={30000}
                      max={250000}
                      step={10000}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>$30k</span>
                    <span>$140k</span>
                    <span>$250k</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meetingLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="max-sm:text-sm">
                    Daily standup length: {field.value} minutes
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={5}
                      max={65}
                      step={5}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>5 min</span>
                    <span>35 min</span>
                    <span>65 min</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workingDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="max-sm:text-sm">
                    Working days per month: {field.value} days
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={15}
                      max={31}
                      step={1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>15 days</span>
                    <span>23 days</span>
                    <span>31 days</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asyncTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="max-sm:text-sm">
                    Async follow-up time: {field.value} minutes
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={2}
                      max={16}
                      step={1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>2 min</span>
                    <span>9 min</span>
                    <span>16 min</span>
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <MagicCard className="from-primary/10 to-primary/10 relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-bl via-white max-sm:rounded-lg">
          <DotPattern
            width={14}
            height={14}
            className={cn(
              "[mask-image:radial-gradient(350px_circle_at_center,transparent,white)]",
            )}
          />

          <h4 className="text-muted-foreground mt-12 mb-6 text-center text-base max-sm:mt-8 max-sm:mb-4 max-sm:text-sm">
            Your potential savings
          </h4>

          <div className="m-6 flex flex-col items-center gap-12 max-sm:m-4 max-sm:gap-8">
            <p className="from-primary to-primary/90 via-primary/80 bg-gradient-to-r bg-clip-text text-6xl font-extrabold text-transparent max-sm:text-4xl">
              $
              <NumberTicker
                value={annualSavings}
                decimalPlaces={0}
                className="inline"
              />
            </p>

            <div className="flex flex-col gap-2">
              {/* Monthly savings */}
              <div className="flex items-baseline justify-between max-sm:flex-col max-sm:items-center max-sm:text-center max-sm:gap-1">
                <p className="text-muted-foreground flex-none text-xs">
                  Monthly
                </p>
                <p className="text-primary w-[196px] text-right text-xl font-semibold max-sm:w-auto max-sm:text-lg">
                  $
                  <NumberTicker
                    value={monthlySavings}
                    decimalPlaces={0}
                    className="inline"
                  />
                </p>
              </div>

              {/* Time spent */}
              <div className="flex items-baseline justify-between max-sm:flex-col max-sm:items-center max-sm:text-center max-sm:gap-1">
                <p className="text-muted-foreground flex-none text-xs">
                  Time / month
                </p>
                <p className="text-primary w-[164px] text-right text-lg font-medium max-sm:w-auto">
                  <NumberTicker
                    value={hoursStandupPerMonth}
                    decimalPlaces={1}
                    className="inline"
                  />
                  &nbsp;hrs
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="group border-border relative m-6 overflow-hidden rounded-lg border bg-white/70 p-4 backdrop-blur max-sm:m-3 max-sm:p-3"
          >
            {/* Subtle glow on hover */}
            <div className="via-primary/5 pointer-events-none absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <p className="text-base leading-snug text-pretty text-neutral-700 italic max-sm:text-sm max-sm:leading-relaxed">
              Here's why stand-ups suck: {meetingLength} min × {teamSize} devs ={" "}
              {hoursStandupPerMonth.toFixed(0)} h/mo →{" "}
              {formatCurrency(standupCostMonthly)} burn. How many more numbers
              do you need?
            </p>
            <div className="mt-3 flex items-center justify-end gap-2 max-sm:flex-col max-sm:gap-3 max-sm:items-stretch">
              <motion.button
                onClick={() => {
                  const text = `Here's why stand-ups suck: ${meetingLength} min × ${teamSize} devs = ${hoursStandupPerMonth.toFixed(0)} h/mo → ${formatCurrency(standupCostMonthly)} burn. How many more numbers do you need? https://asyncstatus.com`;
                  navigator.clipboard.writeText(text);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors max-sm:justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </motion.button>
              <motion.a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Here's why stand-ups suck: ${meetingLength} min × ${teamSize} devs = ${hoursStandupPerMonth.toFixed(0)} h/mo → ${formatCurrency(standupCostMonthly)} burn. How many more numbers do you need? @asyncstatus`)}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors max-sm:justify-center"
              >
                Share on
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </MagicCard>
      </div>
    </div>
  );
}
