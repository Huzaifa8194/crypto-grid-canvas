import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      {/* Grid Section - Centered and Compact */}
      <main className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <PixelGrid interactive={false} />
        </div>
      </main>
    </div>
  );
};

export default Index;
