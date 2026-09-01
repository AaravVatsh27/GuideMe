"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, SlidersHorizontal } from "lucide-react";

import { Button } from "@/Frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/Frontend/components/ui/dropdown-menu";
import { cn } from "@/Backend/server/utils";

import { downloadCsv } from "./admin-utils";

type SortDirection = "asc" | "desc";

export type AdminTableColumn<T> = {
  id: string;
  header: string;
  accessor?: (row: T) => string | number | boolean | Date | null | undefined;
  cell?: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string | number | boolean | null | undefined;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  hiddenByDefault?: boolean;
};

type ToolbarContext<T> = {
  selectedRows: T[];
  filteredRows: T[];
  clearSelection: () => void;
};

type Props<T> = {
  rows: T[];
  columns: Array<AdminTableColumn<T>>;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyState?: string;
  fileName?: string;
  renderToolbar?: (context: ToolbarContext<T>) => React.ReactNode;
};

function normalizeSortValue(value: string | number | boolean | Date | null | undefined) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value ?? "";
}

export function AdminDataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  pageSize = 25,
  emptyState = "No records match the current filters.",
  fileName = "admin-export.csv",
  renderToolbar,
}: Props<T>) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortState, setSortState] = useState<{ id: string; direction: SortDirection } | null>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    columns.reduce<Record<string, boolean>>((accumulator, column) => {
      accumulator[column.id] = !column.hiddenByDefault;
      return accumulator;
    }, {}),
  );

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!sortState) {
      return rows;
    }

    const column = columns.find((entry) => entry.id === sortState.id);
    if (!column?.accessor) {
      return rows;
    }

    return [...rows].sort((left, right) => {
      const leftValue = normalizeSortValue(column.accessor?.(left));
      const rightValue = normalizeSortValue(column.accessor?.(right));

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortState.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      const result = String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: "base" });
      return sortState.direction === "asc" ? result : -result;
    });
  }, [columns, rows, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [page, pageSize, sortedRows]);

  const selectedRows = useMemo(
    () => sortedRows.filter((row) => selectedIds.has(getRowId(row))),
    [getRowId, selectedIds, sortedRows],
  );

  const visibleColumns = columns.filter((column) => visibility[column.id] !== false);
  const allPageRowsSelected = pagedRows.length > 0 && pagedRows.every((row) => selectedIds.has(getRowId(row)));

  function toggleSort(columnId: string) {
    setSortState((current) => {
      if (!current || current.id !== columnId) {
        return { id: columnId, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { id: columnId, direction: "desc" };
      }

      return null;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function toggleSelectedRow(rowId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  function toggleAllPageRows() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allPageRowsSelected) {
        for (const row of pagedRows) {
          next.delete(getRowId(row));
        }
      } else {
        for (const row of pagedRows) {
          next.add(getRowId(row));
        }
      }

      return next;
    });
  }

  function exportRows() {
    const sourceRows = selectedRows.length > 0 ? selectedRows : sortedRows;
    const headers = visibleColumns.map((column) => column.header);
    const csvRows = sourceRows.map((row) =>
      visibleColumns.map((column) => {
        if (column.csvValue) {
          return column.csvValue(row);
        }

        if (column.accessor) {
          const value = column.accessor(row);
          return value instanceof Date ? value.toISOString() : value;
        }

        return "";
      }),
    );

    downloadCsv(fileName, headers, csvRows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {renderToolbar?.({ selectedRows, filteredRows: sortedRows, clearSelection })}
          {selectedRows.length > 0 ? (
            <span className="text-sm text-slate-500">{selectedRows.length} selected</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportRows}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <SlidersHorizontal className="size-4" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibility[column.id] !== false}
                  onCheckedChange={(checked) =>
                    setVisibility((current) => ({
                      ...current,
                      [column.id]: Boolean(checked),
                    }))
                  }
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageRowsSelected}
                    onChange={toggleAllPageRows}
                    aria-label="Select current page rows"
                  />
                </th>
                {visibleColumns.map((column) => {
                  const isSorted = sortState?.id === column.id;

                  return (
                    <th
                      key={column.id}
                      className={cn("px-4 py-3 font-medium text-slate-600", column.headerClassName)}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-left"
                          onClick={() => toggleSort(column.id)}
                        >
                          <span>{column.header}</span>
                          {isSorted ? (
                            sortState?.direction === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-slate-500">
                    {emptyState}
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const rowId = getRowId(row);
                  const isSelected = selectedIds.has(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={cn(
                        "transition hover:bg-slate-50",
                        onRowClick ? "cursor-pointer" : "",
                        isSelected ? "bg-teal-50/50" : "",
                      )}
                      onClick={(event) => {
                        if (!onRowClick) {
                          return;
                        }

                        const target = event.target as HTMLElement;
                        if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
                          return;
                        }

                        onRowClick(row);
                      }}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectedRow(rowId)}
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                      {visibleColumns.map((column) => (
                        <td key={column.id} className={cn("px-4 py-4 align-top text-slate-700", column.className)}>
                          {column.cell ? column.cell(row) : String(column.accessor?.(row) ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {sortedRows.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedRows.length)} of{" "}
            {sortedRows.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <span className="text-slate-600">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
