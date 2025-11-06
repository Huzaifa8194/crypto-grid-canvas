import Navigation from "@/components/Navigation";

const Story = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">The Story</h1>
        <div className="prose">
          <p className="text-gray-700 mb-4">
            Content coming soon. This page will tell the story of The Million Dollar Crypto Page
            and its connection to the original Million Dollar Homepage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Story;

