import React from "react";
import { Composition } from "remotion";
import { PhoneOrbit } from "./compositions/PhoneOrbit";
import { PhoneStill } from "./compositions/PhoneStill";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PhoneStill"
        component={PhoneStill}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="PhoneOrbit"
        component={PhoneOrbit}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1350}
      />
    </>
  );
};
