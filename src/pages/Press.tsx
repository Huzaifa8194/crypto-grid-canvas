import Navigation from "@/components/Navigation";

const Press = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Press & Media</h1>
          <div className="space-y-4 text-gray-700">
            <p>
              Content coming soon...
            </p>
            <p>
              For press inquiries, please use the contact form.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Press;

