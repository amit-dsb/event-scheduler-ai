'use client';

const Login = () => {
  const handleLogin = () => {
    // const clientId = '831367647050-21h30lcqo96hcqmb4esorqg41lfbsouj.apps.googleusercontent.com';
    // const redirectUri = 'http://localhost:3000/api/auth/callback';
    // const scope = 'https://www.googleapis.com/auth/drive';
    // const responseType = 'code';
    // const state = 'random_state_string';

    // const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}&prompt=login`;
    
    // window.location.href = url;
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-xl mb-4">Welcome to Google OAuth with Next.js 15!</h1>
      <button className="p-2 px-5 bg-gray-200 hover:bg-gray-300 duration-300 rounded-xl" onClick={handleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
