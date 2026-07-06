function Login() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-bold text-center text-blue-600">
          EntryFlow
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Event Entry Management
        </p>

        <div className="mt-8 space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg p-3"
          />

          <button
            className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition"
          >
            Login
          </button>

        </div>

      </div>
    </div>
  );
}

export default Login;