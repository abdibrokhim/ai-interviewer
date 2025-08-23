'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Jobstry</h1>
        <p className="text-lg">The platform automates the recruitment process using an AI Interviewer Agent that can conduct video-based interviews, assess technical coding skills, and provide feedback automatically.</p>
        <Button
          onClick={() => {
            router.push('/dashboard')
          }}
        >Get Started</Button>
      </main>
      {/* <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/jobstry.png"
            alt="File icon"
            width={16}  
            height={16}
          />
          Jobstry
        </a>
      </footer> */}
    </div>
  );
}
