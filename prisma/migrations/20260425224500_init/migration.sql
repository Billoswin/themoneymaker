-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveCharacter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eveCharacterId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ownerHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveToken" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "accessTokenEnc" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL,
    "tokenClaimsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZkbEvent" (
    "killmailId" INTEGER NOT NULL,
    "hash" TEXT,
    "killTime" TIMESTAMP(3) NOT NULL,
    "victimCorpId" INTEGER,
    "victimAllianceId" INTEGER,
    "shipTypeId" INTEGER,
    "systemId" INTEGER,
    "regionId" INTEGER,
    "totalValue" DOUBLE PRECISION,
    "isLoss" BOOLEAN NOT NULL DEFAULT true,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZkbEvent_pkey" PRIMARY KEY ("killmailId")
);

-- CreateTable
CREATE TABLE "Killmail" (
    "killmailId" INTEGER NOT NULL,
    "killTime" TIMESTAMP(3) NOT NULL,
    "solarSystemId" INTEGER NOT NULL,
    "victimShipTypeId" INTEGER,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Killmail_pkey" PRIMARY KEY ("killmailId")
);

-- CreateTable
CREATE TABLE "KillmailItem" (
    "id" TEXT NOT NULL,
    "killmailId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "flag" INTEGER,
    "singleton" INTEGER,
    "qtyDropped" INTEGER,
    "qtyDestroyed" INTEGER,

    CONSTRAINT "KillmailItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveTypeCache" (
    "typeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveTypeCache_pkey" PRIMARY KEY ("typeId")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignScope" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "allianceId" INTEGER,
    "regionId" INTEGER,
    "systemId" INTEGER,

    CONSTRAINT "CampaignScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMembership" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "killmailId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EveCharacter_eveCharacterId_key" ON "EveCharacter"("eveCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "EveToken_characterId_key" ON "EveToken"("characterId");

-- CreateIndex
CREATE INDEX "ZkbEvent_killTime_idx" ON "ZkbEvent"("killTime");

-- CreateIndex
CREATE INDEX "ZkbEvent_victimAllianceId_idx" ON "ZkbEvent"("victimAllianceId");

-- CreateIndex
CREATE INDEX "ZkbEvent_shipTypeId_idx" ON "ZkbEvent"("shipTypeId");

-- CreateIndex
CREATE INDEX "ZkbEvent_regionId_idx" ON "ZkbEvent"("regionId");

-- CreateIndex
CREATE INDEX "ZkbEvent_systemId_idx" ON "ZkbEvent"("systemId");

-- CreateIndex
CREATE INDEX "Killmail_killTime_idx" ON "Killmail"("killTime");

-- CreateIndex
CREATE INDEX "Killmail_solarSystemId_idx" ON "Killmail"("solarSystemId");

-- CreateIndex
CREATE INDEX "Killmail_victimShipTypeId_idx" ON "Killmail"("victimShipTypeId");

-- CreateIndex
CREATE INDEX "KillmailItem_killmailId_idx" ON "KillmailItem"("killmailId");

-- CreateIndex
CREATE INDEX "KillmailItem_typeId_idx" ON "KillmailItem"("typeId");

-- CreateIndex
CREATE INDEX "Campaign_startAt_idx" ON "Campaign"("startAt");

-- CreateIndex
CREATE INDEX "Campaign_endAt_idx" ON "Campaign"("endAt");

-- CreateIndex
CREATE INDEX "CampaignScope_campaignId_idx" ON "CampaignScope"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignScope_allianceId_idx" ON "CampaignScope"("allianceId");

-- CreateIndex
CREATE INDEX "CampaignScope_regionId_idx" ON "CampaignScope"("regionId");

-- CreateIndex
CREATE INDEX "CampaignScope_systemId_idx" ON "CampaignScope"("systemId");

-- CreateIndex
CREATE INDEX "CampaignMembership_killmailId_idx" ON "CampaignMembership"("killmailId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMembership_campaignId_killmailId_key" ON "CampaignMembership"("campaignId", "killmailId");

-- AddForeignKey
ALTER TABLE "EveCharacter" ADD CONSTRAINT "EveCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveToken" ADD CONSTRAINT "EveToken_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "EveCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Killmail" ADD CONSTRAINT "Killmail_killmailId_fkey" FOREIGN KEY ("killmailId") REFERENCES "ZkbEvent"("killmailId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KillmailItem" ADD CONSTRAINT "KillmailItem_killmailId_fkey" FOREIGN KEY ("killmailId") REFERENCES "Killmail"("killmailId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignScope" ADD CONSTRAINT "CampaignScope_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMembership" ADD CONSTRAINT "CampaignMembership_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMembership" ADD CONSTRAINT "CampaignMembership_killmailId_fkey" FOREIGN KEY ("killmailId") REFERENCES "ZkbEvent"("killmailId") ON DELETE CASCADE ON UPDATE CASCADE;

