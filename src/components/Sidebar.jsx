"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import logo from "../../public/logo.png";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { routes } from "@/constants";
import { usePathname } from "next/navigation";
// import { useProModal } from "@/hooks/use-pro-modal";

const montserrat = Montserrat({
  weight: "600",
  subsets: ["latin"],
});

export default function Sidebar() {
  // const proModal = useProModal();
  const pathname = usePathname();
  return (
    <div className=" basis-2/12 min-h-screen z-[80] space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <div className="relatve w-16 h-16 mr-4 rounded-md">
            <Image
              priority
              height={60}
              width={60}
              className="object-contain"
              src={logo.src}
              alt="logo"
            />
          </div>
          <p
            className={cn(
              "font-bold text-2xl text-white",
              montserrat.className
            )}
          >
            Incity
          </p>
        </Link>
        <div className="flex flex-col space-y-1">
          {routes.map((route) => {
            return (
              <Link
                className={cn(
                  "text-xl group flex p-3 w-full justify-start font-bold cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
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
        </div>
      </div>
    </div>
  );
}
