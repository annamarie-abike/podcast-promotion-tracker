import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { AboutPodcast } from "./components/AboutPodcast";
import { Credentials } from "./components/Credentials";
import { AssetLibrary } from "./components/AssetLibrary";
import { Calendar } from "./components/Calendar";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "calendar", Component: Calendar },
      { path: "about", Component: AboutPodcast },
      { path: "credentials", Component: Credentials },
      { path: "assets", Component: AssetLibrary },
    ],
  },
]);