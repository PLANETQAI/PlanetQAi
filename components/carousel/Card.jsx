import Styles from "./Card.module.css";
import React, { useState } from "react";
import { useSpring, animated } from "react-spring";
import { Button } from "@/components/ui/button"; // Assuming this path for the Button component

function Card({ imagen, videoLink, onCardClick }) {
  const [show, setShown] = useState(false);

  const props3 = useSpring({
    transform: show ? "scale(1.03)" : "scale(1)",
    boxShadow: show
      ? "0 20px 25px rgb(0 0 0 / 25%)"
      : "0 2px 10px rgb(0 0 0 / 8%)"
  });

  const handleClick = () => {
    if (onCardClick && videoLink) {
      onCardClick(videoLink);
    }
  };

  return (
    <animated.div
      className={Styles.card}
      style={props3}
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
      onClick={handleClick} // Make the entire card clickable
    >
      <div className={Styles.imageContainer}>
        <img src={imagen} alt="" />
        {videoLink && (
          <div className={Styles.playOverlay}>
            <svg className={Styles.playIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
        )}
      </div>
      <h2>Title</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
        nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat
        volutpat.
      </p>
      <div className={Styles.btnn}>
        <Button>Demo</Button>
        <Button>Code</Button>
      </div>
    </animated.div>
  );
}

export default Card;