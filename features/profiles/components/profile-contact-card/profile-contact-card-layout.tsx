import React, { memo } from "react";
import { VStack } from "@/design-system/VStack";
import { ProfileContactCardContainer } from "./profile-contact-card-container";
import { HStack } from "@/design-system/HStack";
import { ICardLayoutProps } from "../../profile.types";

export const ProfileContactCardLayout = memo(function CardLayout({
  avatar,
  name,
  additionalOptions,
}: ICardLayoutProps) {
  return (
    <ProfileContactCardContainer>
      <VStack style={{ flex: 1, justifyContent: "space-between" }}>
        <HStack
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          {avatar}
          {additionalOptions}
        </HStack>
        {name}
      </VStack>
    </ProfileContactCardContainer>
  );
});
