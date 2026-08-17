"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Built on the native <dialog> element: focus trapping, Escape handling and the
 * backdrop come from the browser instead of from a dependency.
 */
export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Fires for Escape as well as dialog.close().
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      className="w-full max-w-lg rounded-card border border-ink-200 bg-white p-0 backdrop:bg-ink-950/40 open:mx-auto open:my-auto"
      onClick={(event) => {
        // Clicking the backdrop (the dialog element itself) closes the modal.
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="border-b border-ink-200 px-5 py-4">
        <h2 id="modal-title" className="text-base font-semibold text-ink-900">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
