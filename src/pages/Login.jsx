import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "../context/AppContext";
import { homeForRole } from "../lib/roles";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

function Login() {
  const { user, login, hosted } = useApp();
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
    return <Navigate to={homeForRole(user.role, user.eventId)} replace />;
  }

  const onSubmit = async (values) => {
    const signedInUser = await login(values);
    if (signedInUser) {
      navigate(homeForRole(signedInUser.role, signedInUser.eventId), { replace: true });
    }
  };

  return <main className="grid min-h-dvh place-items-center bg-background p-4">
    <section className="ticket">
      <header className="feature-tile rounded-none px-6 py-7 sm:p-8">
        <div className="grooves" aria-hidden="true" />
        <div className="brand"><img src="/favicon.svg" alt="" />EntryFlow</div>
        <h1 className="mt-10 text-4xl font-semibold tracking-tight">Sign in</h1>
      </header>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">{hosted ? "Use the email registered with your event administrator." : "Local demo. Use any password of four or more characters."}</p>
        <div><label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" className="mt-1 min-h-12 w-full rounded-xl border px-3" {...register("email")} />
          {errors.email && <p role="alert" className="mt-1 text-sm text-destructive">{errors.email.message}</p>}</div>
        <div><label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="mt-1 min-h-12 w-full rounded-xl border px-3" {...register("password")} />
          {errors.password && <p role="alert" className="mt-1 text-sm text-destructive">{errors.password.message}</p>}</div>
        <button type="submit" className="min-h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary-hover">Sign in</button>
        {!hosted && <p className="text-sm text-muted-foreground">Demo admin email <span className="break-all font-mono">admin@entryflow.local</span></p>}
      </form>
    </section>
  </main>;
}

export default Login;
