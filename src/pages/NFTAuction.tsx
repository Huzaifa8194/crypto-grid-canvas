import Navigation from "@/components/Navigation";

const NFTAuction = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">NFT Auction</h1>
          <div className="space-y-4 text-gray-700">
            <p>
              Content coming soon...
            </p>
            <p>
              Special pixel blocks will be auctioned as NFTs. Stay tuned for announcements!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NFTAuction;

