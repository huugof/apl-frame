import { Metadata } from "next";
import { PatternService } from "@/app/services/pattern.service";
import { getRedisClient } from "@/lib/kv";
import RandomPattern from "@/app/components/RandomPattern";

const appUrl = process.env.NEXT_PUBLIC_URL;

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const redis = getRedisClient();
  PatternService.initialize(redis);
  
  const pattern = await PatternService.getPatternById(parseInt(params.id, 10));
  
  if (!pattern) {
    return {
      title: "Pattern Not Found",
      description: "The requested pattern could not be found.",
    };
  }

  const frame = {
    version: "next",
    imageUrl: `${appUrl}/start.png`,
    button: {
      title: `View Pattern ${pattern.number}: ${pattern.title}`,
      action: {
        type: "launch_frame",
        name: "APL Daily",
        url: `${appUrl}/frames/pattern/${pattern.id}`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#e2e2e2",
      },
    },
  };

  return {
    title: `Pattern ${pattern.number}: ${pattern.title}`,
    description: pattern.problem,
    openGraph: {
      title: `Pattern ${pattern.number}: ${pattern.title}`,
      description: pattern.problem,
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function PatternFrame({ params }: Props) {
  return <RandomPattern initialPatternId={parseInt(params.id, 10)} />;
} 