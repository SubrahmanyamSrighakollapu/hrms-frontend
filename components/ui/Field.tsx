"use client";

import { cloneElement, isValidElement, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Label + hint/error wrapper shared by every form in the workspace. */
export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  // Associate the label with its control even when the caller does not wire up
  // htmlFor/id manually, so the label is clickable and announced by assistive
  // tech. Explicit ids passed by the caller always win.
  const generatedId = useId();
  const isElement = isValidElement(children);
  const childId = isElement ? (children.props as { id?: string }).id : undefined;
  const controlId = htmlFor ?? childId ?? (isElement && label ? generatedId : undefined);
  const control =
    isElement && !childId && controlId
      ? cloneElement(children as ReactElement<{ id?: string }>, { id: controlId })
      : children;

  return (
    <div>
      {label && (
        <label htmlFor={controlId} className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
          {label}
          {required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
        </label>
      )}
      {control}
      {error ? (
        <p className="mt-1 text-[0.72rem] text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[0.72rem] text-[var(--text-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input-base ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`input-base ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input-base ${className}`} {...props} />;
}
