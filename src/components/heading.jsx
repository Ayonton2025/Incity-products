import { Icon, LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
// interface HeadingProps {
//   title: string;
//   description: string;
//   icon: LucideIcon;
//   iconColor?: string;
//   bgColor?: string;
// }

export default function Heading({
  title,
  description,
  icon: Icon,
  iconColor,
  bgColor,
}) {
  return (
    <>
      <div className="px-4 lg:px-8 flex items-center py-4 gap-x-3 bg-[#111827] text-white">
        <div className={cn("p-2 w-fit rounded-md", bgColor)}>
          <Icon className={cn("w-10 h-10", iconColor)} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-sm text-white">{description}</p>
        </div>
      </div>
    </>
  );
}
