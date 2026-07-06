import Sidebar from "./Sidebar";

function Layout({ title, children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">

        <header className="bg-white border-b px-8 py-5">
          <h2 className="text-3xl font-bold text-gray-800">
            {title}
          </h2>
        </header>

        <main className="p-8">
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;