import Background from "@/components/home/Background";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import FindYourTutor from "@/components/home/FindTutors";
import HowItWorks from "@/components/home/HowItWorks";
import WhyTutorSathi from "@/components/home/WhyTeachMate";
import FinalCTA from "@/components/home/FinalCTA";
import Verification from "@/components/home/Verification";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#050914] text-white">
      <Background />
      <Navbar />

      <main className="relative z-10">
        <Hero />
        <FindYourTutor />
          <Verification/>
           <HowItWorks/>
        <WhyTutorSathi/>
       
      
        <FinalCTA/>
        <Footer/>
        
      </main>
    </div>
  );
}