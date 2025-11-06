import Navigation from "@/components/Navigation";
import PixelGrid from "@/components/PixelGrid";

const BuyPixels = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      {/* Grid Section - Interactive */}
      <main className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Pixels</h2>
            <p className="text-sm text-gray-600">
              Drag to select multiple pixels • $1 per pixel • 100 pixel minimum
            </p>
          </div>
          <PixelGrid interactive={true} />
        </div>
      </main>
    </div>
  );
};

export default BuyPixels;

