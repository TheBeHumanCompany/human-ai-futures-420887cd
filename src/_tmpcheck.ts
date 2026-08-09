import { fetchEpisodeList } from "@/lib/podcast/queries";
const x = fetchEpisodeList();
type T = typeof x;
const y: T = x;
export { y };
