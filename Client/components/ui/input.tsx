"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"
import {
  useController,
  useFormContext,
  useWatch,
  type FieldValues,
  type Path,
  type Control,
  type RegisterOptions,
  type UseFormReturn,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const INVALID_INPUT_CLASS =
  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25"
const VALID_INPUT_CLASS =
  "border-green-600 focus-visible:border-green-600 focus-visible:ring-green-600/25"

const BaseInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-base shadow-2xs transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm autofill:shadow-[inset_0_0_0_9999px_var(--card)] autofill:[-webkit-text-fill-color:var(--foreground)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
BaseInput.displayName = "BaseInput"

interface BoundInputProps
  extends Omit<React.ComponentProps<"input">, "name"> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formApi: UseFormReturn<any>
}

/** Input wired to react-hook-form state — red on error, green on valid input. */
const BoundInput = React.forwardRef<HTMLInputElement, BoundInputProps>(
  ({ formApi, name, className, type, onFocus, onBlur, ...props }, ref) => {
    const { control, getFieldState, formState } = formApi
    const value = useWatch({ control, name })
    const { invalid, isTouched, isDirty } = getFieldState(name, formState)
    const [focused, setFocused] = React.useState(false)

    const interacted = isTouched || isDirty
    const hasError = invalid && (interacted || formState.isSubmitted)
    const isValid =
      !invalid &&
      interacted &&
      value !== undefined &&
      value !== "" &&
      focused

    return (
      <BaseInput
        {...props}
        ref={ref}
        name={name}
        type={type}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        className={cn(
          className,
          hasError && INVALID_INPUT_CLASS,
          isValid && !hasError && VALID_INPUT_CLASS
        )}
      />
    )
  }
)
BoundInput.displayName = "BoundInput"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  (props, ref) => {
    const formContext = useFormContext()
    const { name, type, ...rest } = props

    if (
      !formContext ||
      !name ||
      type === "hidden" ||
      type === "checkbox" ||
      type === "radio"
    ) {
      return <BaseInput name={name} type={type} {...rest} ref={ref} />
    }

    return (
      <BoundInput
        name={name}
        type={type}
        formApi={formContext}
        {...rest}
        ref={ref}
      />
    )
  }
)
Input.displayName = "Input"

interface FieldErrorProps {
  id?: string
  message?: string
  className?: string
}

function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        "mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

export interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> extends Omit<React.ComponentProps<"input">, "name"> {
  name: TName
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<TFieldValues, any>
  rules?: RegisterOptions<TFieldValues, TName>
  label?: string
  required?: boolean
  icon?: React.ReactNode
  rightAction?: React.ReactNode
  trailingAction?: React.ReactNode
  containerClassName?: string
  errorMessage?: string
}

function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  required = false,
  icon,
  rightAction,
  trailingAction,
  containerClassName,
  className,
  type = "text",
  id,
  disabled,
  errorMessage: customErrorMessage,
  ...props
}: FormInputProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>()
  const effectiveControl = control ?? formContext?.control

  const {
    field,
    fieldState: { error },
  } = useController({ name, control: effectiveControl, rules })

  const inputId = id ?? `input-${String(name)}`
  const errorId = `${inputId}-error`
  const activeError = customErrorMessage ?? error?.message

  return (
    <div className={cn("flex w-full flex-col", containerClassName)}>
      {(label || rightAction) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <Label htmlFor={inputId} required={required}>
              {label}
            </Label>
          )}
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </div>
        )}

        <Input
          {...field}
          {...props}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={Boolean(activeError)}
          aria-describedby={activeError ? errorId : undefined}
          className={cn(
            "h-11 rounded-lg",
            icon && "pl-10",
            trailingAction && "pr-11",
            activeError &&
              "border-destructive/60 focus-visible:ring-destructive/30",
            className
          )}
        />

        {trailingAction && (
          <div className="absolute right-3 flex items-center">
            {trailingAction}
          </div>
        )}
      </div>

      <FieldError id={errorId} message={activeError} />
    </div>
  )
}

export { Input, FormInput, FieldError }
