"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ImageIcon, X } from "../icons";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Input } from "./input";

export interface ImageUploadProps {
  value?: string | null;
  onChange?: (value: File | null) => void;
  previewClassName?: string;
  fallbackClassName?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  className,
  previewClassName,
  fallbackClassName,
  error,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  // Update preview when value changes
  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        onChange?.(null);
        setPreview(null);
        return;
      }
      onChange?.(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const handleRemove = useCallback(() => {
    onChange?.(null);
    setPreview(null);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className={cn("size-20", previewClassName)}>
            {preview && preview !== "" ? (
              <AvatarImage src={preview} alt="Preview" />
            ) : (
              <AvatarFallback className={cn("bg-muted", fallbackClassName)}>
                <ImageIcon className="text-muted-foreground size-6" />
              </AvatarFallback>
            )}
          </Avatar>
          {preview && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 size-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className={cn("hidden", className)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {preview ? "Change image" : "Upload image"}
          </Button>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
