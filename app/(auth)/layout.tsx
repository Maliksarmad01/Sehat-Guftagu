import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authentication | Sehat Guftagu",
    description: "Login or Signup to Sehat Guftagu",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-auth-pattern flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-5 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-urdu">
                    خوش آمدید
                    <br />
                    <span className="font-sans text-2xl text-primary mt-2 block">Sehat Guftagu</span>
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-lg sm:px-10 border border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    );
}
