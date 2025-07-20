import { Button } from "@asyncstatus/ui/components/button";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@asyncstatus/ui/components/emoji-picker";
import { PopoverContent } from "@asyncstatus/ui/components/popover";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { useCurrentEditor } from "@tiptap/react";
import { Smile } from "lucide-react";
import { useEffect, useState } from "react";

export const EmojiSelector = () => {
  const [open, setOpen] = useState(false);
  const { editor } = useCurrentEditor();
  const isEditable = editor?.isEditable;

  // Listen for slash command emoji picker trigger
  useEffect(() => {
    const handleOpenEmojiPicker = (event: CustomEvent) => {
      const { editor: eventEditor } = event.detail;
      if (eventEditor === editor) {
        setOpen(true);
      }
    };

    document.addEventListener("openEmojiPicker", handleOpenEmojiPicker as EventListener);

    return () => {
      document.removeEventListener("openEmojiPicker", handleOpenEmojiPicker as EventListener);
    };
  }, [editor]);

  if (!editor || !isEditable) return null;

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <Smile className="h-4 w-4" />
          <p className="text-sm">Emoji</p>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-full p-0" sideOffset={10}>
        <EmojiPicker
          className="h-[342px]"
          onEmojiSelect={(emoji) => {
            editor.chain().focus().insertContent(emoji.emoji).run();
            setOpen(false);
          }}
        >
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
};
