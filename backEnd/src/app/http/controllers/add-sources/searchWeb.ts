import { google } from "googleapis";
import { Request, Response, NextFunction } from "express";
import { SearchToolData } from "@/app/tools/SearchToolData";
import { UserRepository } from "../auth/repository/userRepository";


export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);



export const searchWeb = asyncHandler(async (req: Request, res: Response) => {

  const { query ,userId} = req.query
  if (!query) {
    return res.status(422).send({ message: "query should not be empty" })
  }

  const userRepo = UserRepository.getInstance()
  await userRepo.reduceCredits(userId as string, 1)

  const searchTool = new SearchToolData('exa')
  const searchResult = await searchTool.invoke(query as string)

  const data = []
  const parsedWebResult = JSON.parse(searchResult as any) as { results: Array<{ title: string, text: string, url: string }> }
  if (Array.isArray(parsedWebResult?.results)) {

    for (const webResult of parsedWebResult?.results) {
      data.push({ title: webResult?.title, link: webResult?.url, text: webResult?.text })

    }

  }
  res.status(200).json({ data });
});

