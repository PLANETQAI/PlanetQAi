"use client";

import { v4 as uuidv4 } from "uuid";
import Card from "@/components/carousel/Card";
import Carousel from "@/components/carousel/Carousel";

export default function CarouselTestPage() {
  let cards = [
    {
      key: uuidv4(),
      content: (
        <Card imagen="https://updates.theme-fusion.com/wp-content/uploads/2017/12/convertplus_thumbnail.jpg" />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card imagen="https://updates.theme-fusion.com/wp-content/uploads/2017/12/acf_pro.png" />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card imagen="https://updates.theme-fusion.com/wp-content/uploads/2017/12/layer_slider_plugin_thumb.png" />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card imagen="https://updates.theme-fusion.com/wp-content/uploads/2016/08/slider_revolution-1.png" />
      )
    },
    {
      key: uuidv4(),
      content: (
        <Card imagen="https://updates.theme-fusion.com/wp-content/uploads/2019/01/pwa_880_660.jpg" />
      )
    }
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#050816] overflow-hidden">
      <div className="container mx-auto px-4 py-12 h-full flex items-center">
        <div className="w-full h-[800px] relative">
          <Carousel
            cards={cards}
            width="100%"
            height="100%"
            margin="0 auto"
            offset={2}
            showArrows={false}
          />
        </div>
      </div>
    </div>
  );
}
