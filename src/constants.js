import {
  Bus,
  Map,
  MessageCircle,
  PackageCheck as PackageCheckIcon,
  PartyPopper,
} from "lucide-react";
import { HeartPulse as HealthIcon } from "lucide-react";
import { Utensils as RecipeIcon } from "lucide-react";
import { Newspaper as NewsIcon } from "lucide-react";
import { Cloud as WeatherIcon } from "lucide-react";
import { DollarSign as FinanceIcon } from "lucide-react";
import { Phone as ContactIcon } from "lucide-react";

export const routes = [
  {
    label: "Places",
    icon: Map,
    href: "/places",
    color: "#3498DB", // blue (location-related)
  },
  {
    label: "Health Support",
    icon: HealthIcon,
    href: "/health",
    color: "#E74C3C", // red (health/alert)
  },
  {
    label: "Recipes",
    icon: RecipeIcon,
    href: "/recipes",
    color: "#F39C12", // orange (food-related)
  },
  // {
  //   label: "News",
  //   icon: NewsIcon,
  //   href: "/news",
  //   color: "#8E44AD", // purple (informative)
  // },
  {
    label: "Weather",
    icon: WeatherIcon,
    href: "/weather",
    color: "#3498DB", // blue (weather/sky-related)
  },
  {
    label: "Finance",
    icon: FinanceIcon,
    href: "/finance",
    color: "#27AE60", // green (money/finance-related)
  },
  // {
  //   label: "Contact",
  //   icon: ContactIcon,
  //   href: "/contact",
  //   color: "#34495E", // dark blue/gray (communication/technology)
  // },
  {
    label: "Products",
    icon: PackageCheckIcon,
    href: "/products",
    color: "#FF5733", // orange-red (shopping/e-commerce)
  },
  {
    label: "Commute",
    icon: Bus,
    href: "/commute",
    color: "#2980B9", // dark blue (transportation-related)
  },
  {
    label: "Events",
    icon: PartyPopper,
    href: "/events",
    color: "#FFC300", // bright yellow (celebration)
  },
  // {
  //   label: "Travel Buddy",
  //   icon: MessageCircle,
  //   href: "https://chat-kpmjee.vercel.app/",
  //   color: "#16A085", // teal (social communication)
  // },
];
