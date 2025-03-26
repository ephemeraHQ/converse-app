import React, { memo, ReactNode } from "react"
import { HStack } from "@/design-system/HStack"
import { VStack } from "@/design-system/VStack"
import { ProfileContactCardContainer } from "./profile-contact-card-container"

type ICardLayoutProps = {
  avatar: ReactNode
  name: ReactNode
  additionalOptions?: ReactNode
}

export const ProfileContactCardLayout = memo(function CardLayout({
  avatar,
  name,
  additionalOptions,
}: ICardLayoutProps) {
  return (
    <ProfileContactCardContainer>
      <VStack style={{ flex: 1, justifyContent: "space-between" }}>
        <HStack style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          {avatar}
          {additionalOptions}
        </HStack>
        {name}
      </VStack>
    </ProfileContactCardContainer>
  )
})
