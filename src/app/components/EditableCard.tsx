import { Pencil, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

interface EditableCardProps {
  title: string;
  value: string;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  className?: string;
}

export function EditableCard({
  title,
  value,
  isEditing,
  editValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  className
}: EditableCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {!isEditing && (
            <Button
              onClick={onStartEdit}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <Textarea
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="min-h-[100px] text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={onSaveEdit}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Check className="size-4" />
                Save
              </Button>
              <Button
                onClick={onCancelEdit}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-700">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
