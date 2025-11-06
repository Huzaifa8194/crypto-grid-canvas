import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="px-5 md:px-10 pt-36 pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <PixelGrid interactive={false} showLegend={false} />
        </div>
      </main>
    </div>
  );
};

export default Index;
