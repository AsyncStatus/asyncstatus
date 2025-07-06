import type { TypedContract } from "./core/typed-contract";

export function typedUrlFactory(baseUrl: string) {
  return <TC extends TypedContract<any, any, any>>(contract: TC, input: TC["$infer"]["input"]) => {
    return `${baseUrl}${contract.url(input)}`;
  };
}
