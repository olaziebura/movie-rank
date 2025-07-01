import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AlertDialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

const useAlertDialog = () => {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error("useAlertDialog must be used within an AlertDialog")
  }
  return context
}

interface AlertDialogProps {
  children: React.ReactNode
}

const AlertDialog = ({ children }: AlertDialogProps) => {
  const [open, setOpen] = React.useState(false)
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

interface AlertDialogTriggerProps {
  children: React.ReactNode
}

const AlertDialogTrigger = ({ children }: AlertDialogTriggerProps) => {
  const { setOpen } = useAlertDialog()
  
  return (
    <div onClick={() => setOpen(true)}>
      {children}
    </div>
  )
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => {
  const { open, setOpen } = useAlertDialog()
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => setOpen(false)}
      />
      {/* Content */}
      <div className={cn(
        "relative z-10 w-full max-w-lg mx-4 p-6 bg-white rounded-lg shadow-lg",
        className
      )}>
        {children}
      </div>
    </div>
  )
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
}

const AlertDialogHeader = ({ children }: AlertDialogHeaderProps) => (
  <div className="mb-4">
    {children}
  </div>
)

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => (
  <h2 className={cn("text-lg font-semibold", className)}>
    {children}
  </h2>
)

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => (
  <p className={cn("text-sm text-gray-600", className)}>
    {children}
  </p>
)

interface AlertDialogFooterProps {
  children: React.ReactNode
}

const AlertDialogFooter = ({ children }: AlertDialogFooterProps) => (
  <div className="flex justify-end gap-2 mt-6">
    {children}
  </div>
)

interface AlertDialogCancelProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogCancel = ({ children, className }: AlertDialogCancelProps) => {
  const { setOpen } = useAlertDialog()
  return (
    <Button 
      variant="outline" 
      onClick={() => setOpen(false)}
      className={className}
    >
      {children}
    </Button>
  )
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const AlertDialogAction = ({ children, onClick, className }: AlertDialogActionProps) => {
  const { setOpen } = useAlertDialog()
  return (
    <Button 
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
      className={className}
    >
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
}
