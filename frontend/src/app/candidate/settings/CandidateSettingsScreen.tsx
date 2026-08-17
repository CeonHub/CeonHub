"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";

export function CandidateSettingsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["CANDIDATE"]}>
        {(user) => (
          <>
            <PageHeader
              title="Settings"
              description="Your account details. Profile, skills and availability live on your profile page."
            />
            <AccountSettings user={user} />
          </>
        )}
      </AuthGate>
    </Container>
  );
}
