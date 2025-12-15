"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateWishlistDialog } from "@/components/CreateWishlistDialog";

interface CreateWishlistButtonProps {
  onSuccess?: () => void;
}

export function CreateWishlistButton({ onSuccess }: CreateWishlistButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Wishlist
      </Button>
      <CreateWishlistDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
