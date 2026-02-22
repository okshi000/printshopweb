import * as React from 'react'
import { Check, ChevronDown, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  isLoading?: boolean
  className?: string
  triggerClassName?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'اختر...',
  searchPlaceholder = 'ابحث...',
  isLoading = false,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedLabel = React.useMemo(
    () => options.find((o) => o.value === value)?.label,
    [options, value]
  )

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const term = search.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(term))
  }, [options, search])

  // Focus the search input when popover opens
  React.useEffect(() => {
    if (open) {
      // Small delay to let the popover render
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setSearch('')
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm transition-all duration-200',
            'hover:border-primary/50',
            !value && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <span className="truncate text-right flex-1">
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0 w-[--radix-popover-trigger-width]', className)}
        align="start"
        // Prevent popover from stealing focus on mobile
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        {/* Search input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            // Prevent popover close on mobile touch
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />
          )}
        </div>

        {/* Options list */}
        <div className="max-h-60 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              لا توجد نتائج
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-3 text-sm outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:bg-accent focus:text-accent-foreground',
                  value === option.value && 'bg-accent/50'
                )}
              >
                <Check
                  className={cn(
                    'ml-2 h-4 w-4 shrink-0',
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
