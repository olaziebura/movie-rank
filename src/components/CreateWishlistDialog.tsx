"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateWishlistDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWishlistDialogProps) {
  const [wishlistName, setWishlistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!wishlistName.trim()) {
      toast.error("Please enter a wishlist name");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: wishlistName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create wishlist");
      }

      await response.json();
      toast.success("Wishlist created successfully!");
      setWishlistName("");
      onOpenChange(false);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create wishlist"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setWishlistName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new wishlist</DialogTitle>
          <DialogDescription>
            Enter a name for your new wishlist. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Wishlist name</Label>
            <Input
              id="name"
              placeholder="e.g., Movies to watch this weekend"
              value={wishlistName}
              onChange={(e) => setWishlistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSave();
                }
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isLoading || !wishlistName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
