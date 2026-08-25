
import 'dotenv/config'
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { TavilySearch } from "@langchain/tavily";

type Provider = "exa" | "tavily";

export class SearchToolData {
  private provider: Provider;
  private exaTool?: ExaSearchResults;
  private tavilyTool?: TavilySearch;

  constructor(provider: Provider) {
    this.provider = provider;

    if (provider === "exa") {
      const client = new Exa(process.env.EXA_SEARCH_API_KEY!);
      this.exaTool = new ExaSearchResults({
        client,
        searchArgs: {
          numResults: 2,
          type: "keyword",
        },
      }) as any
    } else if (provider === "tavily") {
      this.tavilyTool = new TavilySearch({
        maxResults: 3,
        topic: "general",
        apiKey: process.env.TAVILY_API_KEY,
      } as any);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async invoke(query: string): Promise<{results:Array<{title:string,text:string,url:string}>}> {
    if (this.provider === "exa" && this.exaTool) {
      const result=await this.exaTool.invoke(query);
       return result
    }

    if (this.provider === "tavily" && this.tavilyTool) {
       const result=await this.tavilyTool.invoke({ query });
       return result
    }

    throw new Error("No search tool initialized.");
  }
}


