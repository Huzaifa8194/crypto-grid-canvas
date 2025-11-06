import Navigation from "@/components/Navigation";

const Auction = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">NFT Auction</h1>
        <div className="prose">
          <p className="text-gray-700 mb-4">
            Special pixel blocks will be auctioned as NFTs. Stay tuned for announcements!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auction;

