import React from 'react';
// This file is deprecated and can be deleted.
// This file is deprecated and should be deleted.

// Placeholder: Public monk/philosopher Lottie animation from LottieFiles
// (You can swap the src URL below with your own custom Chanakya animation JSON)
// This Lottie is a meditating monk/wise figure, suitable as a placeholder for Chanakya
// Guaranteed working Lottie: meditating person (public)
const animationUrl = "/meditating.json"; // Local file in public folder

export default function LottieChanakya() {
  return (
    <div style={{ width: 300, height: 300, background: 'white', margin: '0 auto' }}>
      <Player
        src={animationUrl}
        autoplay
        loop
        style={{ width: 300, height: 300 }}
      />
    </div>
  );
}
