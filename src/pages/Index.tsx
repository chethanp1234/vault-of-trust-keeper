
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { FolderLock } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Feature Showcase / Hero Section */}
      <div className="flex-1 bg-digilocker-700 text-white p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-8">
            <div className="p-3 bg-white/10 rounded-xl">
              <FolderLock className="h-8 w-8" />
            </div>
            <h1 className="ml-3 text-3xl font-bold">DigiLocker</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Your Secure Digital Document Vault
          </h2>
          
          <p className="text-lg mb-8 text-digilocker-100">
            Store, verify, and share your important documents securely from anywhere.
          </p>
          
          <div className="space-y-6">
            <FeatureItem title="Document Security" description="Military-grade encryption for all your documents." />
            <FeatureItem title="Easy Verification" description="Verify documents with government authorities." />
            <FeatureItem title="Seamless Sharing" description="Share documents securely with QR codes and links." />
          </div>
        </div>
      </div>
      
      {/* Authentication Form */}
      <div className="flex-1 bg-white p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ title, description }: { title: string; description: string }) => (
  <div className="flex">
    <div className="mr-4 flex-shrink-0">
      <div className="h-5 w-5 rounded-full bg-digilocker-300 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-white"></div>
      </div>
    </div>
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-digilocker-200">{description}</p>
    </div>
  </div>
);

export default Index;
