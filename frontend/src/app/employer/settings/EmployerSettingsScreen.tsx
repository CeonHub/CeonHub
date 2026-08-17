"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";

export function EmployerSettingsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>
        {(user) => (
          <>
            <PageHeader
              title="Settings"
              description="Your account details. Company information lives on the company profile page."
            />
            <AccountSettings user={user} />
          </>
        )}
      </AuthGate>
    </Container>
  );
}
