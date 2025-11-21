import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";
import { usePixelMetadata } from "@/context/PixelMetadataContext";

const Index = () => {
  const { lockedBlocks } = usePixelMetadata();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="px-5 md:px-10 pt-48 md:pt-36 pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <PixelGrid interactive={false} showLegend={false} lockedBlocks={lockedBlocks} />
        </div>
      </main>
    </div>
  );
};

export default Index;
