import { useCallback, useMemo, useState } from "react";
import GlobeMarketplace from "./components/GlobeMarketplace";
import HoverCard from "./components/HoverCard";
import SelectedLotPanel from "./components/SelectedLotPanel";
import AuditLoading from "./components/AuditLoading";
import AuditResults from "./components/AuditResults";
import PurchaseModal from "./components/PurchaseModal";
import {
  TopNav,
  HeroOverlay,
  FeaturesSection,
  StatsSection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  ContactForm,
  SupportForm,
  SellerListingSheet,
  PinDropOverlay,
  RoleSplash,
  MarketplaceSection,
  BuyerOnboardingDialog,
} from "./components/marketing";
import { useUserRole } from "./hooks/useUserRole";
import { useBuyerProfile } from "./hooks/useBuyerProfile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Toaster,
  toast,
} from "./components/ui";
import type { RinLot } from "./types/rin";
import { useSellerListings } from "./hooks/useSellerListings";
import {
  LiveAuctionsSheet,
  LiveAuctionPanel,
} from "./components/auction";

type Stage = "globe" | "audit-loading" | "audit-results";

export default function App() {
  const { listings: sellerListings } = useSellerListings();
  const { role, setRole } = useUserRole();
  const { profile: buyerProfile, clear: clearBuyerProfile } = useBuyerProfile();

  const [selectedLot, setSelectedLot] = useState<RinLot | null>(null);
  const [hoveredLot, setHoveredLot] = useState<RinLot | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [stage, setStage] = useState<Stage>("globe");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Listing flow state
  const [showListingSheet, setShowListingSheet] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Contact / Support dialogs
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  // Buyer onboarding
  const [showBuyerOnboarding, setShowBuyerOnboarding] = useState(false);
  const [forceRoleSplash, setForceRoleSplash] = useState(false);

  // Live auctions state
  const [showAuctionsSheet, setShowAuctionsSheet] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  const handleViewAuction = useCallback((id: string) => {
    setSelectedAuctionId(id);
    setShowAuctionsSheet(false);
  }, []);

  const mergedLots = useMemo<RinLot[]>(
    () => sellerListings,
    [sellerListings],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  const scrollToMarketplace = useCallback(() => {
    const el = document.querySelector("#marketplace");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onListRins = useCallback(() => {
    setShowListingSheet(true);
  }, []);

  const onPickLocation = useCallback(() => {
    setShowListingSheet(false);
    setPinMode(true);
    scrollToMarketplace();
    toast({
      title: "Pin drop mode",
      description: "Click the globe to set your facility location.",
    });
  }, [scrollToMarketplace]);

  const onGlobeClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (!pinMode) return;
      setDroppedPin(coords);
      setPinMode(false);
      setShowListingSheet(true);
      toast({
        title: "Pin set",
        description: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        variant: "success",
      });
    },
    [pinMode],
  );

  const scrollToMarketplaceList = useCallback(() => {
    const el = document.querySelector("#marketplace-list");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onGetStarted = useCallback(() => {
    setForceRoleSplash(true);
  }, []);

  const onPickRole = useCallback(
    (next: "buyer" | "seller") => {
      setRole(next);
      setForceRoleSplash(false);
      if (next === "seller") {
        // brief delay so the splash finishes its exit animation
        setTimeout(() => setShowListingSheet(true), 320);
      } else {
        if (buyerProfile) {
          setTimeout(() => scrollToMarketplaceList(), 320);
        } else {
          setTimeout(() => setShowBuyerOnboarding(true), 320);
        }
      }
    },
    [setRole, scrollToMarketplaceList, buyerProfile],
  );

  const onMarketplaceSelect = useCallback(
    (lot: RinLot) => {
      setSelectedLot(lot);
      scrollToMarketplace();
    },
    [scrollToMarketplace],
  );

  const onMarketplaceAudit = useCallback(
    (lot: RinLot) => {
      setSelectedLot(lot);
      scrollToMarketplace();
      setStage("audit-loading");
    },
    [scrollToMarketplace],
  );

  return (
    <div className="relative min-h-screen bg-space-950 text-white">
      <TopNav
        onBrowse={scrollToMarketplaceList}
        onOpenContact={() => setShowContactDialog(true)}
        onOpenSupport={() => setShowSupportDialog(true)}
        buyerCompanyName={buyerProfile?.companyName}
        onOpenAuctions={() => setShowAuctionsSheet(true)}
        onChangeIdentity={() => setShowBuyerOnboarding(true)}
        onClearIdentity={() => clearBuyerProfile()}
      />

      {/* Marketplace hero / globe */}
      <section
        id="marketplace"
        className="relative h-screen w-full overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <GlobeMarketplace
          selectedLot={selectedLot}
          hoveredLot={hoveredLot}
          onHover={setHoveredLot}
          onSelect={(lot) => {
            if (pinMode) return;
            setSelectedLot(lot);
          }}
          auditing={stage === "audit-loading"}
          lots={mergedLots}
          onGlobeClick={onGlobeClick}
        />

        {stage === "globe" && (
          <>
            <HeroOverlay
              onGetStarted={onGetStarted}
              onBrowse={scrollToMarketplaceList}
            />

            {hoveredLot && !selectedLot && (
              <HoverCard
                lot={hoveredLot}
                x={cursorPos.x}
                y={cursorPos.y}
                visible
              />
            )}

            {selectedLot && (
              <SelectedLotPanel
                lot={selectedLot}
                onClose={() => setSelectedLot(null)}
                onAudit={() => setStage("audit-loading")}
                onViewPurchaseInfo={() => setShowPurchaseModal(true)}
              />
            )}
          </>
        )}

        {stage === "audit-loading" && selectedLot && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <AuditLoading
              lot={selectedLot}
              onComplete={() => setStage("audit-results")}
            />
          </div>
        )}

        {stage === "audit-results" && selectedLot && (
          <div className="absolute inset-0 z-20 overflow-y-auto">
            <AuditResults
              lot={selectedLot}
              onBack={() => setStage("globe")}
              onRequestPurchase={() => setShowPurchaseModal(true)}
            />
          </div>
        )}

        <PinDropOverlay active={pinMode} onCancel={() => setPinMode(false)} />
      </section>

      {/* Full marketplace browser (filterable grid) */}
      <MarketplaceSection
        lots={mergedLots}
        onSelectLot={onMarketplaceSelect}
        onAuditLot={onMarketplaceAudit}
      />

      {/* Marketing sections (scrollable) */}
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <CTASection onBrowse={scrollToMarketplace} />
      <FooterSection />

      {/* Global modals */}
      <PurchaseModal
        open={showPurchaseModal}
        lot={selectedLot}
        onClose={() => setShowPurchaseModal(false)}
        onViewAuditPacket={() => {
          setShowPurchaseModal(false);
          setStage("audit-results");
        }}
        onReturnToMarketplace={() => {
          setShowPurchaseModal(false);
          setStage("globe");
        }}
      />

      <SellerListingSheet
        open={showListingSheet}
        onOpenChange={setShowListingSheet}
        pin={droppedPin}
        onPickLocation={onPickLocation}
        onCreated={(_listing, meta) => {
          setDroppedPin(null);
          if (meta?.auctionId) setSelectedAuctionId(meta.auctionId);
        }}
      />

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact ORIN</DialogTitle>
            <DialogDescription>
              Talk to the team about onboarding, integrations, or compliance.
            </DialogDescription>
          </DialogHeader>
          <ContactForm onSubmitted={() => {}} />
        </DialogContent>
      </Dialog>

      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle>Support</DialogTitle>
            <DialogDescription>
              File a ticket and our team will reach out.
            </DialogDescription>
          </DialogHeader>
          <SupportForm onSubmitted={() => {}} />
        </DialogContent>
      </Dialog>

      <RoleSplash
        open={role === null || forceRoleSplash}
        onPick={onPickRole}
        onDismiss={forceRoleSplash ? () => setForceRoleSplash(false) : undefined}
      />

      <BuyerOnboardingDialog
        open={showBuyerOnboarding}
        onOpenChange={setShowBuyerOnboarding}
        onComplete={() => {
          setShowBuyerOnboarding(false);
          setTimeout(() => scrollToMarketplaceList(), 200);
        }}
      />

      <LiveAuctionsSheet
        open={showAuctionsSheet}
        onOpenChange={setShowAuctionsSheet}
        onView={handleViewAuction}
      />

      <LiveAuctionPanel
        auctionId={selectedAuctionId}
        onClose={() => setSelectedAuctionId(null)}
      />

      <Toaster />
    </div>
  );
}
