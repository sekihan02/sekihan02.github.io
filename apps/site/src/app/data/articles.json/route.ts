import { getArticlesManifest } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(await getArticlesManifest());
}
