import { auth, signOut } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function AdminUsersTable() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Role</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{user.name || 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function AdminCompaniesTable() {
  const companies = await prisma.yellowBookEntry.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      rating: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Category</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Phone</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Rating</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{company.category}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{company.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                ⭐ {company.rating?.toFixed(1) || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  
  // SSR Guard: Check if user is authenticated and is admin
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin');
  }
  
  const userRole = (session.user as { role: string }).role;
  
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">
            You do not have permission to access this admin page.
          </p>
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.yellowBookEntry.count(),
    prisma.user.count({ where: { role: 'admin' } }),
  ]);

  const [totalUsers, totalCompanies, totalAdmins] = stats;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}>
            <button 
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Companies</p>
                <p className="text-3xl font-bold text-gray-900">{totalCompanies}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Admins</p>
                <p className="text-3xl font-bold text-gray-900">{totalAdmins}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">All registered users</p>
          </div>
          <div className="p-6">
            <AdminUsersTable />
          </div>
        </div>

        {/* Companies Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
            <p className="text-sm text-gray-600 mt-1">Recent yellow book entries</p>
          </div>
          <div className="p-6">
            <AdminCompaniesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
