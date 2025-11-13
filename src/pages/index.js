// src/pages/index.js
import Image from "next/image";
import Head from "next/head";
import { routes } from "@/constants";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import logo from "../../public/logo.png";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const headRef = useRef();
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleResume = async () => {
    toggleChat();
  };

  const redirect = (e) => {
    e.preventDefault();
    router.push("https://github.com/SpandanM110");
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const randomEffect = () => {
    const original = "Incity".split("");
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    let iterations = 0;
    const interval = setInterval(() => {
      if (headRef.current) {
        headRef.current.innerText = headRef.current.innerText
          .split("")
          .map((letter, index) => {
            if (index < iterations) return original[index];
            else return letters[Math.floor(Math.random() * 36)];
          })
          .join("");
        if (iterations >= 6) clearInterval(interval);
        iterations += 1 / 3;
      }
    }, 70);
  };

  useEffect(() => {
    randomEffect();
  }, []);

  console.log(logo.src); // Check if the logo source is correct

  return (
    <div className="bg-black w-full min-h-screen">
      {/* Logout Button - Only show if user is authenticated */}
      {session && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}

      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon"></link>
        <title>Incity | Empowering Your Journey</title>
        <meta
          name="description"
          content="Incity is a dynamic platform offering insights into maps, health support, recipes, news updates, and weather information. Explore more about our services and connect with us."
        ></meta>
        <meta
          name="keywords"
          content="Incity, Maps, Health Support, Recipes, News, Weather, Information"
        ></meta>
        <meta name="author" content="Spandan Mukherjee"></meta>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        ></meta>
      </Head>
      <main
        className={`min-h-screen flex max-w-[100vw] flex-col items-center justify-center px-4 md:px-20 lg:px-24 py-10 lg:py-24 relative`}
      >
        <section
          className={`w-full h-auto mb-10 flex flex-wrap items-center justify-center gap-8 text-sm md:text-md lg:text-[1.5rem] font-Mono text-white z-5`}
        >
          {routes.map((route) => {
            return (
              <Link
                className={cn(
                  "text-xl group flex p-3 justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                  pathname === route.href ? "bg-white/10" : ""
                )}
                href={route.href}
                key={route.href}
              >
                <div className="flex items-center flex-1 ">
                  <route.icon
                    color={route.color}
                    className={cn(`h-5 w-5 mr-3`)}
                  />
                  {route.label}
                </div>
              </Link>
            );
          })}
        </section>
        <section
          ref={headRef}
          className={`w-full h-auto my-5 text-[2rem] md:text-[4rem] lg:text-[6rem] text-white text-center font-Audiowide z-5`}
        >
          Incity
        </section>
        <section
          className={`w-full h-auto mt-10 flex items-center justify-center text-center text-sm lg:text-[1.15rem] font-Body text-gray-500 z-5`}
        >
          <p>
            Welcome to Incity, where we enhance your daily life with
            personalized information on maps, health support, recipes, news, and
            weather. <br />
            <span
              className={`text-gray-50 cursor-pointer font-Mono`}
              // onClick={redirect}
            >
              👉 Connecting newbies to a new city 👈
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}