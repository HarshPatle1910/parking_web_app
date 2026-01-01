import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { parkingService } from '../services/parking.service';
import { DashboardStats, ParkingSession } from '../types';
import StatsCard from '../components/Dashboard/StatsCard';
import EarningsChart from '../components/Dashboard/EarningsChart';
import VehicleList from '../components/Dashboard/VehicleList';
import CCTVView from '../components/Dashboard/CCTVView';

export default function Dashboard() {
  const { owner, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ParkingSession[]>([]);

  // Initialize socket connection
  const socket = useSocket(owner?.id || null);

  useEffect(() => {
    loadDashboardStats();

    // Set up socket listeners for real-time updates
    if (socket && owner) {
      socket.on('vehicle-entered', (data: { vehicleNumber: string; timestamp: Date }) => {
        console.log('Vehicle entered:', data);
        // Refresh dashboard stats
        loadDashboardStats();
      });

      socket.on('vehicle-exited', (data: { vehicleNumber: string; timestamp: Date }) => {
        console.log('Vehicle exited:', data);
        // Refresh dashboard stats
        loadDashboardStats();
      });

      return () => {
        socket.off('vehicle-entered');
        socket.off('vehicle-exited');
      };
    }
  }, [socket, owner]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await parkingService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await parkingService.searchVehicles(searchQuery);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSendReceipt = async (sessionId: string) => {
    const phone = prompt('Enter recipient phone number (with country code):');
    if (!phone) return;

    try {
      await parkingService.sendReceipt(sessionId, phone);
      alert('Receipt sent successfully!');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send receipt');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{owner?.shopName}</h1>
            <p className="text-sm text-gray-500">Welcome, {owner?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Today's Earnings"
            value={`$${stats?.todayEarnings.toFixed(2) || '0.00'}`}
          />
          <StatsCard
            title="Active Vehicles"
            value={stats?.activeVehicles || 0}
          />
          <StatsCard
            title="Total Sessions"
            value={stats?.totalSessions || 0}
          />
          <StatsCard
            title="Avg Duration"
            value={`${Math.round((stats?.averageDuration || 0) / 60)}h ${(stats?.averageDuration || 0) % 60}m`}
          />
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Search vehicle by number plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h2>
            <VehicleList sessions={searchResults} onSendReceipt={handleSendReceipt} />
          </div>
        )}

        {/* Charts and CCTV */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EarningsChart data={stats?.earningsChart || []} />
          <CCTVView />
        </div>

        {/* Recent Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h2>
          <VehicleList sessions={stats?.recentSessions || []} onSendReceipt={handleSendReceipt} />
        </div>
      </main>
    </div>
  );
}

