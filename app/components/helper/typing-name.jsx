"use client";

import { useEffect, useState } from "react";

const TypingName = ({ text = "Ankit Kumar", speed = 120 }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, index + 1));
      index += 1;

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="group inline-flex items-center">
      <span className="text-amber-300 transition-all duration-300 group-hover:scale-110 group-hover:text-pink-400">
        {displayed}
      </span>
      <span className="ml-1 inline-block h-[1.1em] w-[2px] animate-pulse bg-amber-300 group-hover:bg-pink-400" />
    </span>
  );
};

export default TypingName;