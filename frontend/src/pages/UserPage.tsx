import { useAuth } from "@/hooks/useAuth";

const UserPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gradient">User Profile</h1>
        <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in">
          <h3 className="text-xl font-semibold mb-2">Welcome, {currentUser?.displayName || 'User'}</h3>
          <p className="text-sm text-gray-400">{currentUser?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
