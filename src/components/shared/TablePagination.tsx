"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  isLoading = false,
  onPageChange,
}: TablePaginationProps) {
  if (totalCount <= 0) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isLastPage = (page + 1) * pageSize >= totalCount;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">{start.toLocaleString()}</span>
        {"–"}
        <span className="font-medium text-foreground">{end.toLocaleString()}</span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {totalCount.toLocaleString()}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || isLoading}
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          <ChevronLeft className="h-4 w-4 me-1" />
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || isLastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ms-1" />
        </Button>
      </div>
    </div>
  );
}
