import React from "react"
import type { Row } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Action {
  label: string
  onClick: () => void
  icon?: React.ElementType
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onEdit?: (row: TData) => void
  onDelete?: (row: TData) => void
  onDuplicate?: (row: TData) => void
  extraActions?: Action[] | React.ReactNode
}

export function DataTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
  onDuplicate,
  extraActions,
}: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Editar
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
            <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
            Duplicar
          </DropdownMenuItem>
        )}
        {extraActions && (
          <>
            {Array.isArray(extraActions) ? (
              extraActions.map((action, index) => (
                <DropdownMenuItem key={index} onClick={action.onClick}>
                  {action.icon && <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                  {action.label}
                </DropdownMenuItem>
              ))
            ) : (
              extraActions
            )}
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
