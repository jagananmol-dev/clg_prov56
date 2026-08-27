import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Categories from '@/components/Categories';
import BestSelling from '@/components/BestSelling';
import SaleBanner from '@/components/SaleBanner';
import Testimonials from '@/components/Testimonials';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <BestSelling />
      <SaleBanner />
      <Testimonials />
    </>
  );
}
