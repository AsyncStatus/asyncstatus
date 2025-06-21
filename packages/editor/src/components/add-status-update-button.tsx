import { Button } from "@asyncstatus/ui/components/button";
import { useCurrentEditor } from "@tiptap/react";
import { Plus } from "lucide-react";

export const AddStatusUpdateButton = () => {
  const { editor } = useCurrentEditor();

  if (!editor) return null;

  const addBlockableTodoItem = () => {
    // Use the existing command to add a blockable todo item
    editor.commands.addBlockableTodoItem();
  };

  return (
    <Button
      onClick={addBlockableTodoItem}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Add update item
    </Button>
  );
};
