import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "../context/AppContext";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = (values) => {
    if (login(values)) {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-3xl font-bold text-center text-blue-600">
          EntryFlow
        </h1>
        <p className="text-center text-gray-500 mt-2">Event Entry Management</p>
        <p className="text-center text-sm text-gray-400 mt-2">
          Local demo login — any valid email and password work.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded-lg p-3"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded-lg p-3"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
