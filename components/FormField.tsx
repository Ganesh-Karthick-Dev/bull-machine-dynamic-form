"use client";

import React, { useState } from 'react';
import { Control, Controller, UseFormRegister } from 'react-hook-form';
import { FormField as FormFieldType } from '@/lib/schema-parser';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface FormFieldProps {
  field: FormFieldType;
  register: UseFormRegister<any>;
  control: Control<any>;
  error?: { message?: string };
}

export const FormField: React.FC<FormFieldProps> = ({ field, register, control, error }) => {
  const isError = !!error;
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="space-y-2 w-full animate-fadeIn">
      {field.type !== 'checkbox' && (
        <Label 
          htmlFor={field.id} 
          className={`text-sm font-semibold tracking-tight transition-colors ${
            isError ? 'text-destructive dark:text-red-400' : 'text-foreground'
          }`}
        >
          {field.label}
          {field.required && <span className="text-destructive dark:text-red-400 ml-1 font-bold">*</span>}
        </Label>
      )}

      {field.type === 'textarea' ? (
        <Textarea
          id={field.id}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          {...register(field.id)}
          className={`min-h-[110px] w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border focus-visible:ring-2 focus-visible:ring-primary/20 ${
            isError 
              ? 'border-destructive focus-visible:border-destructive' 
              : 'border-border focus-visible:border-primary'
          }`}
        />
      ) : field.type === 'select' ? (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger 
                className={`w-full h-10 px-3.5 text-base sm:text-sm rounded-lg border text-left bg-transparent ${
                  isError 
                    ? 'border-destructive focus-visible:border-destructive' 
                    : 'border-border focus-visible:border-primary'
                }`}
              >
                <SelectValue placeholder={field.placeholder || "Select an option..."} />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-32px)]">
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      ) : field.type === 'checkbox' ? (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className={`
              flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 select-none
              bg-card hover:bg-muted/30
              ${isError ? 'border-destructive/30 bg-destructive/5 dark:bg-destructive/5' : 'border-border'}
            `}>
              <div className="flex items-center h-5 mt-0.5">
                <Checkbox
                  id={field.id}
                  checked={!!value}
                  onCheckedChange={onChange}
                  className="rounded"
                />
              </div>
              <Label 
                htmlFor={field.id} 
                className="text-sm font-semibold leading-relaxed cursor-pointer text-gray-700 dark:text-zinc-300"
              >
                {field.label}
                {field.required && <span className="text-destructive dark:text-red-400 ml-1 font-bold">*</span>}
              </Label>
            </div>
          )}
        />
      ) : field.type === 'radio' ? (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <RadioGroup 
              value={value || ''} 
              onValueChange={onChange} 
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 mt-1.5"
            >
              {field.options?.map((option) => (
                <Label
                  key={option}
                  htmlFor={`${field.id}-${option}`}
                  className={`
                    flex items-center gap-3 p-4 border rounded-xl bg-card hover:bg-muted/40 
                    transition-all duration-150 cursor-pointer select-none group border-border
                    ${value === option ? 'border-primary ring-1 ring-primary' : 'border-border'}
                    ${isError ? 'border-destructive/30 bg-destructive/5' : ''}
                  `}
                >
                  <div className="flex items-center h-5">
                    <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 group-hover:text-gray-950 dark:group-hover:text-white transition-colors duration-150 leading-none">
                    {option}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      ) : field.type === 'date' ? (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => {
            const date = value ? parseISO(value) : undefined;
            const displayValue = date && isValid(date) ? format(date, "PPP") : (field.placeholder || "Pick a date");

            return (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full h-10 px-3.5 text-left font-normal justify-start gap-2 bg-transparent rounded-lg border",
                    !value && "text-muted-foreground",
                    isError 
                      ? 'border-destructive focus-visible:border-destructive' 
                      : 'border-border focus-visible:border-primary'
                  )}
                  type="button"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{displayValue}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        onChange(format(selectedDate, "yyyy-MM-dd"));
                      } else {
                        onChange("");
                      }
                      setDateOpen(false); // Close calendar popover on date select
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            );
          }}
        />
      ) : (
        <Input
          id={field.id}
          type={field.type}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          {...register(field.id)}
          className={`h-10 w-full text-base sm:text-sm px-3.5 py-2 rounded-lg border focus-visible:ring-2 focus-visible:ring-primary/20 ${
            isError 
              ? 'border-destructive focus-visible:border-destructive' 
              : 'border-border focus-visible:border-primary'
          }`}
        />
      )}

      {error?.message && (
        <p className="text-xs text-destructive dark:text-red-400 font-semibold flex items-center gap-1.5 mt-1 animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive dark:bg-red-400" />
          {error.message}
        </p>
      )}
    </div>
  );
};
