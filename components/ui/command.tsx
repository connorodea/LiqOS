'use client'

import * as React from 'react'
import { type DialogProps } from '@radix-ui/react-dialog'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface CommandContextValue {
  search: string
  setSearch: (search: string) => void
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  items: string[]
  registerItem: (value: string) => void
  unregisterItem: (value: string) => void
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommand() {
  const context = React.useContext(CommandContext)
  if (!context) {
    throw new Error('useCommand must be used within a Command')
  }
  return context
}

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [search, setSearch] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [items, setItems] = React.useState<string[]>([])

  const registerItem = React.useCallback((value: string) => {
    setItems((prev) => (prev.includes(value) ? prev : [...prev, value]))
  }, [])

  const unregisterItem = React.useCallback((value: string) => {
    setItems((prev) => prev.filter((item) => item !== value))
  }, [])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
    },
    [items.length]
  )

  return (
    <CommandContext.Provider
      value={{
        search,
        setSearch,
        selectedIndex,
        setSelectedIndex,
        items,
        registerItem,
        unregisterItem,
      }}
    >
      <div
        ref={ref}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  )
})
Command.displayName = 'Command'

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[data-command-group-heading]]:px-2 [&_[data-command-group-heading]]:font-medium [&_[data-command-group-heading]]:text-muted-foreground [&_[data-command-group]:not([hidden])_~[data-command-group]]:pt-0 [&_[data-command-group]]:px-2 [&_[data-command-input-wrapper]_svg]:h-5 [&_[data-command-input-wrapper]_svg]:w-5 [&_[data-command-input]]:h-12 [&_[data-command-item]]:px-2 [&_[data-command-item]]:py-3 [&_[data-command-item]_svg]:h-5 [&_[data-command-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const { search, setSearch } = useCommand()

  return (
    <div
      className="flex items-center border-b px-3"
      data-command-input-wrapper=""
    >
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        data-command-input=""
        {...props}
      />
    </div>
  )
})
CommandInput.displayName = 'CommandInput'

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
))
CommandList.displayName = 'CommandList'

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const { search } = useCommand()

  if (!search) return null

  return (
    <div ref={ref} className="py-6 text-center text-sm" {...props}>
      {children}
    </div>
  )
})
CommandEmpty.displayName = 'CommandEmpty'

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { heading?: string }
>(({ className, heading, children, ...props }, ref) => {
  const { search } = useCommand()

  // Filter children based on search
  const filteredChildren = React.Children.toArray(children).filter((child) => {
    if (!search) return true
    if (React.isValidElement(child) && child.props.value) {
      return child.props.value.toLowerCase().includes(search.toLowerCase())
    }
    return true
  })

  if (filteredChildren.length === 0 && search) return null

  return (
    <div
      ref={ref}
      data-command-group=""
      className={cn(
        'overflow-hidden p-1 text-foreground',
        className
      )}
      {...props}
    >
      {heading && (
        <div
          data-command-group-heading=""
          className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {heading}
        </div>
      )}
      {filteredChildren}
    </div>
  )
})
CommandGroup.displayName = 'CommandGroup'

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 h-px bg-border', className)}
    {...props}
  />
))
CommandSeparator.displayName = 'CommandSeparator'

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onSelect?: () => void
  }
>(({ className, value, onSelect, children, ...props }, ref) => {
  const { search, selectedIndex, items, registerItem, unregisterItem } =
    useCommand()

  React.useEffect(() => {
    if (value) {
      registerItem(value)
      return () => unregisterItem(value)
    }
  }, [value, registerItem, unregisterItem])

  // Hide if doesn't match search
  if (search && value && !value.toLowerCase().includes(search.toLowerCase())) {
    return null
  }

  const index = value ? items.indexOf(value) : -1
  const isSelected = index === selectedIndex

  const handleClick = () => {
    onSelect?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSelect?.()
    }
  }

  return (
    <div
      ref={ref}
      data-command-item=""
      data-selected={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={cn(
        "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CommandItem.displayName = 'CommandItem'

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = 'CommandShortcut'

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
