import { useState, useEffect, useMemo } from "react";
import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import WalletTab from "./WalletTab";
import ActivityTab from "./ActivityTab";
import MenuTab from "./MenuTab";
import { SwipeProvider } from "./context/SwipeContext";
import { useSwipe } from "./hooks/useSwipe";

type TabName = "wallet" | "activity" | "menu";

function PanelContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState<TabName>("wallet");
  const [direction, setDirection] = useState(0);
  const { isSwipeEnabled } = useSwipe();

  const tabs = useMemo(
    () => [
      { name: "wallet" as const, label: "Wallet", component: <WalletTab /> },
      {
        name: "activity" as const,
        label: "Activity",
        component: <ActivityTab active={selectedTab === "activity"} />,
      },
      { name: "menu" as const, label: "Menu", component: <MenuTab /> },
    ],
    [selectedTab],
  );

  // Update selectedTab based on URL path
  useEffect(() => {
    const path = location.pathname.split("/").pop() as TabName;
    if (tabs.some((tab) => tab.name === path) && path !== selectedTab) {
      setSelectedTab(path);
    }
  }, [location.pathname, selectedTab, tabs]);

  // Unified tab change handler for both click and swipe
  const handleTabChange = (tabName: TabName) => {
    const currentIndex = tabs.findIndex((tab) => tab.name === selectedTab);
    const newIndex = tabs.findIndex((tab) => tab.name === tabName);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setSelectedTab(tabName);
    // Update URL
    navigate(`/panel/${tabName}`, { replace: true });
  };

  // Swipe handlers now use handleTabChange
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isSwipeEnabled) return;
      const currentIndex = tabs.findIndex((tab) => tab.name === selectedTab);
      if (currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1].name);
      }
    },
    onSwipedRight: () => {
      if (!isSwipeEnabled) return;
      const currentIndex = tabs.findIndex((tab) => tab.name === selectedTab);
      if (currentIndex > 0) {
        handleTabChange(tabs[currentIndex - 1].name);
      }
    },
    trackMouse: true,
  });

  // Animation variants for sliding
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative" as const,
      width: "100%",
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
    }),
  };

  return (
    <TabGroup
      selectedIndex={tabs.findIndex((tab) => tab.name === selectedTab)}
      onChange={(index) => handleTabChange(tabs[index].name)}
      className="flex flex-col w-full md:h-[75svh] h-dvh
      md:max-w-lg
      overflow-hidden"
    >
      <div className="flex flex-col flex-1 h-full" {...swipeHandlers}>
        <TabPanels className="flex-1 relative overflow-hidden">
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={selectedTab}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="h-full w-full"
              style={{ minWidth: 0, maxWidth: "100%" }}
            >
              {tabs.find((tab) => tab.name === selectedTab)?.component}
            </motion.div>
          </AnimatePresence>
        </TabPanels>
        <TabList className="flex gap-0 sticky bottom-0 mb-2 z-10 bg-transparent backdrop-blur">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `
                flex-1 rounded-none
                px-3 py-5
                text-base md:text-lg xl:text-xl font-semibold
                focus:not-data-focus:outline-none hover:cursor-pointer
                data-focus:outline data-focus:outline-white
                transition
                ${selected ? "text-white/90" : "text-white/60"}
                `
              }
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </div>
    </TabGroup>
  );
}

export default function Panel() {
  return (
    <SwipeProvider>
      <PanelContent />
    </SwipeProvider>
  );
}
