import { auth0 } from '@/lib/auth/auth0';

export default async function TestAuthPage() {
  const session = await auth0.getSession();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Auth0 Session Test</h1>
      
      {session ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h2 className="text-xl font-semibold mb-4">✅ Authenticated!</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {session.user?.sub}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Picture:</strong></p>
            {session.user?.picture && (
              <img 
                src={session.user.picture} 
                alt="User avatar" 
                className="w-16 h-16 rounded-full"
              />
            )}
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">View Full Session Data</summary>
            <pre className="mt-2 bg-white p-4 rounded overflow-auto text-xs">
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-semibold mb-2">❌ Not Authenticated</h2>
          <p>No session found. Please log in.</p>
          <a 
            href="/api/auth/login" 
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login
          </a>
        </div>
      )}
    </div>
  );
}
