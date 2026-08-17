"use client";

import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CONTROL_BORDER, CONTROL_CLASSES } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { AdminUserRow, Paginated, Role, SessionUser, UserStatus } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function AdminUsersScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["ADMIN"]}>{(user) => <AdminUsers admin={user} />}</AuthGate>
    </Container>
  );
}

function AdminUsers({ admin }: { admin: SessionUser }) {
  const [filters, setFilters] = useState<{ q: string; role: Role | ""; status: UserStatus | "" }>({
    q: "",
    role: "",
    status: "",
  });
  const [page, setPage] = useState(1);

  const query = useApiQuery<Paginated<AdminUserRow>>("/api/admin/users", {
    q: filters.q || undefined,
    role: filters.role || undefined,
    status: filters.status || undefined,
    page,
    pageSize: 25,
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFilters({
      q: String(data.get("q") ?? ""),
      role: (data.get("role") as Role | null) ?? "",
      status: (data.get("status") as UserStatus | null) ?? "",
    });
    setPage(1);
  }

  return (
    <>
      <PageHeader title="Users" description="Disable an account to revoke its access immediately." />

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-wrap gap-3 rounded-card border border-ink-200 bg-white p-5"
        role="search"
      >
        <input
          name="q"
          type="text"
          defaultValue={filters.q}
          placeholder="Email or name"
          aria-label="Search users"
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "w-64")}
        />
        <Select
          id="role"
          name="role"
          aria-label="Role"
          className="w-44"
          placeholder="All roles"
          defaultValue={filters.role}
          options={[
            { value: "CANDIDATE", label: "Candidates" },
            { value: "EMPLOYER", label: "Employers" },
            { value: "ADMIN", label: "Admins" },
          ]}
        />
        <Select
          id="status"
          name="status"
          aria-label="Status"
          className="w-44"
          placeholder="All statuses"
          defaultValue={filters.status}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "DISABLED", label: "Disabled" },
          ]}
        />
        <Button type="submit">Search</Button>
      </form>

      {query.loading ? (
        <LoadingState label="Loading users…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <Card>
            <ul className="divide-y divide-ink-100">
              {query.data.items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === admin.id}
                  onChanged={query.reload}
                />
              ))}
            </ul>
          </Card>
          <Pagination
            className="mt-6"
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState title="No users match this search" />
      )}
    </>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: UserStatus) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${user.id}/status`, { method: "PATCH", body: { status } });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="font-medium text-ink-900">
          {user.name} <span className="font-normal text-ink-500">· {user.email}</span>
        </p>
        <p className="text-sm text-ink-500">Joined {formatDate(user.createdAt)}</p>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Badge tone={user.role === "ADMIN" ? "brand" : "neutral"}>{user.role.toLowerCase()}</Badge>
        <Badge tone={user.status === "ACTIVE" ? "available" : "danger"}>
          {user.status.toLowerCase()}
        </Badge>

        {isSelf ? (
          <span className="text-sm text-ink-400">your account</span>
        ) : user.status === "ACTIVE" ? (
          <Button variant="danger" size="sm" disabled={busy} onClick={() => setStatus("DISABLED")}>
            Disable
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStatus("ACTIVE")}>
            Enable
          </Button>
        )}
      </div>
    </li>
  );
}
